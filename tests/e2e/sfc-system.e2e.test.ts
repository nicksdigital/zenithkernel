/**
 * End-to-End Tests for ZenithKernel SFC System
 * 
 * Tests the complete workflow from .zk file processing through runtime hydration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hydraPlugin } from '../../packages/zenith-core/src/plugins/vite-plugin-hydra';
import { ZenithTemplateParser } from '../../packages/zenith-core/src/modules/Rendering/template-parser';
import { ZenithHtmlTransformer } from '../../packages/zenith-core/src/modules/Rendering/zenith-html-transformer';
import {
  initializeSDK,
  createCounterController,
  getSDKStatus,
  ComponentContext
} from '../../test-app/src/sdk/ComponentSDK';
import fs from 'fs/promises';
import path from 'path';

// Mock filesystem and dependencies
vi.mock('fs/promises');
vi.mock('glob');

const mockFs = fs as any;

// Sample .zk files for testing
const counterIslandZK = `
<template>
  <div class="counter-island" 
       data-hydration-strategy="immediate"
       data-ecs-entity="{{ entityId }}"
       zk-entity="{{ entityId }}"
       zk-trust="local">
    <h3>{{ title }}</h3>
    <div class="count">{{ count }}</div>
    <button @click="increment" :disabled="loading">+</button>
    <button @click="decrement" :disabled="loading">-</button>
    <button @click="reset" :disabled="loading">Reset</button>
  </div>
</template>

<script>
export const metadata = {
  name: 'CounterIsland',
  version: '1.0.0',
  trustLevel: 'local',
  ecsComponents: ['Counter']
};

export default {
  setup(props, context) {
    const controller = createCounterController(props, context);
    return {
      ...controller.getState(),
      increment: () => controller.increment(),
      decrement: () => controller.decrement(),
      reset: () => controller.reset()
    };
  }
};
</script>

<style>
.counter-island {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.count {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 10px 0;
}
</style>
`;

const buttonIslandZK = `
<template>
  <button class="zen-button" 
          :class="variant"
          :disabled="disabled"
          @click="handleClick"
          zk-trust="local">
    <span v-if="loading">⏳</span>
    <span v-else>{{ label }}</span>
  </button>
</template>

<script>
export const metadata = {
  name: 'ButtonIsland',
  version: '1.0.0',
  trustLevel: 'local'
};

export default {
  setup(props) {
    return {
      label: props.label || 'Button',
      variant: props.variant || 'primary',
      disabled: props.disabled || false,
      loading: props.loading || false,
      handleClick: () => props.onClick?.()
    };
  }
};
</script>

<style>
.zen-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.zen-button.primary {
  background: #007bff;
  color: white;
}
.zen-button.secondary {
  background: #6c757d;
  color: white;
}
</style>
`;

// Mock ZenithKernel and ECS
const mockECSManager = {
  getAllEntities: vi.fn(() => [100, 200]),
  getComponent: vi.fn((entityId, type) => 
    entityId === 100 && type === 'Counter' ? { value: 5 } : null
  ),
  addComponent: vi.fn(),
  dumpComponentMap: vi.fn(() => new Map([
    ['Counter', new Map([[100, { value: 5 }]])]
  ])),
  getEntitiesWithQuery: vi.fn(() => [100])
};

const mockZenithKernel = {
  getECS: vi.fn(() => mockECSManager),
  getSystem: vi.fn(),
  addSystem: vi.fn(),
  removeSystem: vi.fn()
};

const mockVerifySystem = {
  verifyProof: vi.fn().mockResolvedValue(true),
  isVerified: vi.fn().mockReturnValue(true)
};

describe('ZenithKernel SFC System E2E Tests', () => {
  let plugin: any;
  let mockConfig: any;
  let mockServer: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock configuration
    mockConfig = {
      root: '/test/project',
      command: 'serve'
    };

    mockServer = {
      middlewares: { use: vi.fn() },
      ws: { send: vi.fn() }
    };

    // Initialize plugin
    plugin = hydraPlugin({
      islandsDir: 'src/islands',
      islandPattern: '**/*Island.{ts,tsx,zk}',
      enableZKFiles: true,
      generateRegistry: true
    });

    // Initialize SDK
    initializeSDK(mockZenithKernel as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete Workflow: .zk File to Runtime', () => {
    it('should process .zk files through complete pipeline', async () => {
      // 1. Setup filesystem mocks
      const mockFiles = [
        '/test/project/src/islands/CounterIsland.zk',
        '/test/project/src/islands/ButtonIsland.zk'
      ];

      const { glob } = await import('glob');
      (glob as any).mockResolvedValue(mockFiles);

      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('CounterIsland.zk')) {
          return Promise.resolve(counterIslandZK);
        }
        if (filePath.includes('ButtonIsland.zk')) {
          return Promise.resolve(buttonIslandZK);
        }
        return Promise.reject(new Error('File not found'));
      });

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      // 2. Configure and run plugin
      plugin.configResolved(mockConfig);
      plugin.configureServer(mockServer);
      await plugin.buildStart();

      // 3. Verify file discovery
      expect(glob).toHaveBeenCalledWith(
        path.join('/test/project/src/islands', '**/*Island.{ts,tsx,zk}')
      );
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);

      // 4. Verify registry generation
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/project/dist/hydra/island-registry.js',
        expect.stringContaining('CounterIsland')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/project/dist/hydra/island-registry.d.ts',
        expect.stringContaining('IslandRegistry')
      );

      // 5. Test .zk transformation
      const transformed = await plugin.transform(counterIslandZK, '/test/CounterIsland.zk');
      
      expect(transformed).toBeTruthy();
      expect(transformed.code).toContain('__ZK_SFC__');
      expect(transformed.code).toContain('__ZK_TEMPLATE__');
      expect(transformed.code).toContain('__ZK_STYLES__');
      expect(transformed.code).toContain('CounterIsland');
    });

    it('should handle multiple island types in registry', async () => {
      // Setup multiple island files
      const mockFiles = [
        '/test/project/src/islands/CounterIsland.zk',
        '/test/project/src/islands/ButtonIsland.zk',
        '/test/project/src/islands/StatusIsland.ts',
        '/test/project/src/islands/ModalIsland.tsx'
      ];

      const { glob } = await import('glob');
      (glob as any).mockResolvedValue(mockFiles);

      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('CounterIsland.zk')) return Promise.resolve(counterIslandZK);
        if (filePath.includes('ButtonIsland.zk')) return Promise.resolve(buttonIslandZK);
        if (filePath.includes('StatusIsland.ts')) {
          return Promise.resolve(`
            export const metadata = { name: 'StatusIsland', version: '1.0.0' };
            export default function StatusIsland() { return '<div>Status</div>'; }
          `);
        }
        if (filePath.includes('ModalIsland.tsx')) {
          return Promise.resolve(`
            export const metadata = { name: 'ModalIsland', version: '1.0.0' };
            export default function ModalIsland() { return '<div>Modal</div>'; }
          `);
        }
        return Promise.reject(new Error('File not found'));
      });

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const registryCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('island-registry.js')
      );

      const registryContent = registryCall[1];
      expect(registryContent).toContain('CounterIsland');
      expect(registryContent).toContain('ButtonIsland');
      expect(registryContent).toContain('StatusIsland');
      expect(registryContent).toContain('ModalIsland');
      expect(registryContent).toContain('type: \'zk\'');
      expect(registryContent).toContain('type: \'ts\'');
      expect(registryContent).toContain('type: \'tsx\'');
    });
  });

  describe('Template Processing and Rendering Pipeline', () => {
    it('should parse and render .zk template with all directive types', async () => {
      // 1. Parse template
      const templateContent = counterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parser = new ZenithTemplateParser({
        enableZKDirectives: true,
        enableECSDirectives: true,
        enableHydrationDirectives: true
      });

      const parsed = parser.parse(templateContent);

      // 2. Verify parsing results
      expect(parsed.componentName).toBe('div');
      expect(parsed.zkDirectives?.zkEntity).toBeDefined();
      expect(parsed.zkDirectives?.zkTrust).toBe('local');
      expect(parsed.ecsBindings?.ecsEntity).toBeDefined();
      expect(parsed.hydrationConfig?.strategy).toBe('immediate');
      expect(parsed.directives?.bindings).toBeDefined();

      // 3. Create render context
      const renderContext = {
        title: 'E2E Test Counter',
        count: 42,
        entityId: '100',
        loading: false,
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem,
        zkContext: { peerId: 'e2e-test' }
      };

      // 4. Transform to HTML
      const transformer = new ZenithHtmlTransformer(renderContext, {
        enableZKVerification: true,
        enableECSBinding: true,
        enableHydrationConfig: true,
        hydrate: true
      });

      const result = await transformer.transform(parsed);

      // 5. Verify output
      expect(result).toContain('E2E Test Counter');
      expect(result).toContain('42');
      expect(result).toContain('data-hydration-strategy="immediate"');
      expect(result).toContain('data-ecs-entity="100"');
      expect(result).toContain('data-zk-entity="100"');
      expect(result).toContain('data-zk-trust="local"');
      expect(result).toContain('data-hydrate="true"');
    });

    it('should handle complex nested templates with conditional rendering', async () => {
      const complexTemplate = `
        <div class="complex-island" zk-trust="verified">
          <h1>{{ title }}</h1>
          <div v-if="showContent">
            <div v-for="item in items" :key="item.id">
              <span>{{ item.name }}</span>
              <button @click="selectItem" :data-id="item.id">Select</button>
            </div>
          </div>
          <div v-else>
            <p>No content to display</p>
          </div>
          <footer>Total items: {{ items.length }}</footer>
        </div>
      `;

      const parser = new ZenithTemplateParser();
      const parsed = parser.parse(complexTemplate);

      const context = {
        title: 'Complex Component',
        showContent: true,
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
          { id: 3, name: 'Item 3' }
        ],
        verifySystem: mockVerifySystem
      };

      const transformer = new ZenithHtmlTransformer(context);
      const result = await transformer.transform(parsed);

      expect(result).toContain('Complex Component');
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
      expect(result).toContain('Total items: 3');
      expect(result).not.toContain('No content to display');
    });
  });

  describe('Component Lifecycle and State Management', () => {
    it('should manage component lifecycle through SDK', async () => {
      // 1. Create component controller
      const props = {
        initialCount: 10,
        title: 'Lifecycle Test',
        entityId: '100'
      };

      const context: ComponentContext = {
        strategy: 'immediate',
        trustLevel: 'local',
        entityId: '100'
      };

      const controller = createCounterController(props, context);

      // 2. Verify initial state
      expect(controller.getState()).toEqual({
        count: 10,
        title: 'Lifecycle Test',
        entityId: '100',
        hydrationTime: 0
      });

      // 3. Test mounting
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      controller.mount();
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Mounting CounterController for entity 100');

      // 4. Test state operations
      await controller.increment();
      expect(controller.getState().count).toBe(11);

      await controller.decrement();
      expect(controller.getState().count).toBe(10);

      await controller.reset();
      expect(controller.getState().count).toBe(0);

      // 5. Test unmounting
      controller.unmount();
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Unmounting CounterController for entity 100');

      consoleSpy.mockRestore();
    });

    it('should handle error recovery in component operations', async () => {
      // Mock ECS error
      mockECSManager.getComponent.mockImplementationOnce(() => {
        throw new Error('ECS Connection Failed');
      });

      const controller = createCounterController({
        entityId: '100'
      }, {});

      const initialCount = controller.getState().count;

      // Should handle error gracefully and rollback
      await expect(controller.increment()).rejects.toThrow('ECS Connection Failed');
      expect(controller.getState().count).toBe(initialCount);
    });
  });

  describe('Hot Module Replacement Integration', () => {
    it('should handle HMR for .zk files', async () => {
      plugin.configResolved(mockConfig);
      plugin.configureServer(mockServer);

      const changedFile = '/test/project/src/islands/CounterIsland.zk';
      
      // Mock file discovery for HMR
      const { glob } = await import('glob');
      (glob as any).mockResolvedValue([changedFile]);
      mockFs.readFile.mockResolvedValue(counterIslandZK);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await plugin.handleHotUpdate({
        file: changedFile,
        server: mockServer
      });

      expect(mockServer.ws.send).toHaveBeenCalledWith({
        type: 'custom',
        event: 'hydra:island-updated',
        data: expect.objectContaining({
          islandPath: 'src/islands/CounterIsland.zk',
          type: 'zk'
        })
      });
    });

    it('should regenerate registry on island changes', async () => {
      plugin.configResolved(mockConfig);

      const changedFile = '/test/project/src/islands/UpdatedIsland.zk';
      
      const { glob } = await import('glob');
      (glob as any).mockResolvedValue([changedFile]);
      mockFs.readFile.mockResolvedValue(counterIslandZK);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await plugin.handleHotUpdate({
        file: changedFile,
        server: mockServer
      });

      // Should regenerate registry
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/project/dist/hydra/island-registry.js',
        expect.stringContaining('ISLANDS')
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle file system errors gracefully', async () => {
      const { glob } = await import('glob');
      (glob as any).mockRejectedValue(new Error('Permission denied'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to discover islands:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle transformation errors with fallbacks', async () => {
      const invalidZK = `
        <template>
          <div>{{ invalidFunction() }}</div>
        </template>
        <script>
        invalid javascript syntax {
        </script>
      `;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        plugin.transform(invalidZK, '/test/invalid.zk')
      ).rejects.toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle missing dependencies in SDK', () => {
      // Test SDK without proper initialization
      const status = getSDKStatus();
      expect(status.initialized).toBe(true); // Should be initialized from beforeEach

      // Reset SDK and test
      initializeSDK(null as any);
      const resetStatus = getSDKStatus();
      expect(resetStatus.initialized).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of islands efficiently', async () => {
      // Generate 50 mock island files
      const mockFiles = Array.from({ length: 50 }, (_, i) => 
        `/test/project/src/islands/Island${i}.zk`
      );

      const { glob } = await import('glob');
      (glob as any).mockResolvedValue(mockFiles);

      mockFs.readFile.mockImplementation((filePath: string) => {
        const islandNumber = filePath.match(/Island(\d+)/)?.[1] || '0';
        return Promise.resolve(`
          <template><div>Island ${islandNumber}</div></template>
          <script>
          export const metadata = { name: 'Island${islandNumber}', version: '1.0.0' };
          export default {};
          </script>
        `);
      });

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const startTime = performance.now();
      plugin.configResolved(mockConfig);
      await plugin.buildStart();
      const endTime = performance.now();

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds

      // Should have processed all files
      expect(mockFs.readFile).toHaveBeenCalledTimes(50);
    });

    it('should handle concurrent transformations efficiently', async () => {
      const templates = Array.from({ length: 10 }, (_, i) => `
        <template><div>Concurrent ${i}: {{ count }}</div></template>
      `);

      const parser = new ZenithTemplateParser();
      const transformers = templates.map((template, i) => 
        new ZenithHtmlTransformer({ count: i })
      );

      const startTime = performance.now();
      const results = await Promise.all(
        templates.map((template, i) => {
          const parsed = parser.parse(template);
          return transformers[i].transform(parsed);
        })
      );
      const endTime = performance.now();

      // All transformations should complete
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result).toContain(`Concurrent ${i}`);
        expect(result).toContain(i.toString());
      });

      // Should complete efficiently
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle different DOM environments', async () => {
      // Test without window object
      const originalWindow = global.window;
      delete (global as any).window;

      const controller = createCounterController({}, {});
      
      // Should not throw when window is undefined
      await expect(controller.increment()).resolves.not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it('should handle missing APIs gracefully', async () => {
      // Mock missing performance API
      const originalPerformance = global.performance;
      delete (global as any).performance;

      const parser = new ZenithTemplateParser();
      const template = parser.parse('<div>{{ count }}</div>');
      const transformer = new ZenithHtmlTransformer({ count: 5 });

      const result = await transformer.transform(template);
      expect(result).toContain('5');

      // Restore performance
      global.performance = originalPerformance;
    });
  });

  describe('Security and Validation', () => {
    it('should sanitize user input in templates', async () => {
      const maliciousTemplate = `
        <div>{{ userInput }}</div>
      `;

      const parser = new ZenithTemplateParser();
      const parsed = parser.parse(maliciousTemplate);

      const context = {
        userInput: '<script>alert("XSS")</script>'
      };

      const transformer = new ZenithHtmlTransformer(context);
      const result = await transformer.transform(parsed);

      // Should escape HTML characters
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should validate ZK proofs properly', async () => {
      const template = `
        <div zk-proof="invalid-proof">Content</div>
      `;

      const parser = new ZenithTemplateParser();
      const parsed = parser.parse(template);

      // Mock failed verification
      mockVerifySystem.verifyProof.mockResolvedValue(false);

      const context = {
        verifySystem: mockVerifySystem,
        zkContext: { peerId: 'test' }
      };

      const transformer = new ZenithHtmlTransformer(context, {
        enableZKVerification: true,
        fallbackToPlaceholder: true
      });

      const result = await transformer.transform(parsed);

      expect(result).toContain('zk-verification-placeholder');
      expect(result).toContain('🔒 Verification Required');
    });
  });
});
