/**
 * Integration Tests for CounterIsland.zk
 * 
 * Tests the complete Single File Component system including template parsing,
 * component logic, ECS integration, and ZK features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ZenithTemplateParser } from '../../packages/zenith-core/src/modules/Rendering/template-parser';
import { ZenithHtmlTransformer } from '../../packages/zenith-core/src/modules/Rendering/zenith-html-transformer';
import {
  createCounterController,
  setZenithReference,
  ComponentContext
} from '../../test-app/src/sdk/ComponentSDK';

// Mock filesystem for reading the .zk file
import fs from 'fs/promises';

// Mock the actual CounterIsland.zk file content
const mockCounterIslandZK = `<!--
  CounterIsland.zk - ZenithKernel Single-File Component
-->

<template>
  <Hydra 
    type="island" 
    id="counter-island" 
    execType="local" 
    context="{{ context }}"
    data-hydration-strategy="{{ context?.strategy || 'immediate' }}"
    data-ecs-entity="{{ entityId }}"
    data-ecs-components='["Counter"]'
    zk-entity="{{ entityId }}"
    zk-trust="{{ context?.trustLevel || 'local' }}"
  >
    <div class="counter-island" data-component="CounterIsland">
      <div class="island-header">
        <h3>{{ title }}</h3>
        <div class="island-meta">
          <span class="hydration-info">
            Strategy: {{ context?.strategy || 'immediate' }} | 
            Trust: {{ context?.trustLevel || 'local' }}
          </span>
          <span v-if="entityId" class="entity-badge" data-entity="{{ entityId }}">
            Entity: {{ entityId }}
          </span>
        </div>
      </div>
      
      <div class="island-content">
        <div class="count-display" :class="{ 'updating': isUpdating }">
          {{ count }}
        </div>
        
        <div class="controls">
          <button 
            class="decrement-btn" 
            @click="decrement" 
            zk-entity="{{ entityId }}"
            :disabled="isUpdating"
          >
            -
          </button>
          
          <button 
            class="increment-btn" 
            @click="increment" 
            zk-entity="{{ entityId }}"
            :disabled="isUpdating"
          >
            +
          </button>
          
          <button 
            class="reset-btn" 
            @click="reset" 
            zk-entity="{{ entityId }}"
            :disabled="isUpdating"
          >
            Reset
          </button>
        </div>
        
        <div v-if="entityId" class="entity-info">
          <div class="entity-details">
            <span>Entity ID: {{ entityId }}</span>
            <span class="entity-status" :class="ecsConnected ? 'connected' : 'disconnected'">
              {{ ecsConnected ? '🟢 ECS Connected' : '🔴 ECS Disconnected' }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="island-footer">
        <span class="hydration-time">⚡ Hydrated in {{ hydrationTime }}ms</span>
      </div>
    </div>
  </Hydra>
</template>

<script>
  import { reactive, computed } from '../../../packages/zenith-core/src/core/signals';
  import type { IslandComponent } from '../../../packages/zenith-core/src/modules/Rendering/types';
  import { 
    createCounterController, 
    setZenithReference,
    ComponentContext 
  } from '../sdk/ComponentSDK';

  export const metadata = {
    name: 'CounterIsland',
    version: '1.0.0',
    trustLevel: 'local',
    hydrationStrategies: ['immediate', 'visible', 'interaction', 'idle'],
    ecsComponents: ['Counter']
  };

  export default {
    metadata,
    
    setup(props, context) {
      if (context?.kernel) {
        setZenithReference(context.kernel);
      }
      
      const componentContext = {
        strategy: context?.strategy || 'immediate',
        trustLevel: context?.trustLevel || 'local',
        entityId: props.entityId || null
      };
      
      const controller = createCounterController({
        initialCount: props.initialCount || 0,
        title: props.title || 'Counter Island',
        entityId: props.entityId || null
      }, componentContext);
      
      const state = controller.getState();
      const isUpdating = reactive(false);
      const ecsConnected = reactive(!!props.entityId);
      
      const hydrationTime = computed(() => {
        return Math.round(performance.now() - Date.now());
      });
      
      const increment = async () => {
        isUpdating.value = true;
        try {
          await controller.increment();
        } finally {
          isUpdating.value = false;
        }
      };

      const decrement = async () => {
        isUpdating.value = true;
        try {
          await controller.decrement();
        } finally {
          isUpdating.value = false;
        }
      };

      const reset = async () => {
        isUpdating.value = true;
        try {
          await controller.reset();
        } finally {
          isUpdating.value = false;
        }
      };
      
      return {
        state,
        count: computed(() => state.count),
        title: computed(() => state.title),
        entityId: computed(() => state.entityId),
        isUpdating,
        ecsConnected,
        hydrationTime,
        context: componentContext,
        increment,
        decrement,
        reset
      };
    }
  };
</script>

<style>
  .counter-island {
    padding: 24px;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    margin: 16px 0;
    font-family: system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  }
  
  .island-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.5rem;
  }
  
  .count-display {
    font-size: 3rem;
    font-weight: 700;
    text-align: center;
    margin: 24px 0;
    color: #2c3e50;
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
  
  .controls button {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .increment-btn {
    background: #4CAF50;
    color: white;
  }
  
  .decrement-btn {
    background: #f44336;
    color: white;
  }
  
  .reset-btn {
    background: #2196F3;
    color: white;
  }
</style>`;

// Mock ECS Manager
const mockECSManager = {
  getAllEntities: vi.fn(() => [123, 456]),
  getComponent: vi.fn((entityId, componentType) => {
    if (entityId === 123 && componentType === 'Counter') {
      return { value: 42 };
    }
    return null;
  }),
  addComponent: vi.fn(),
  dumpComponentMap: vi.fn(() => new Map([
    ['Counter', new Map([[123, { value: 42 }]])]
  ])),
  getEntitiesWithQuery: vi.fn(() => [123])
};

// Mock ZenithKernel
const mockZenithKernel = {
  getECS: vi.fn(() => mockECSManager)
};

// Mock verify system
const mockVerifySystem = {
  verifyProof: vi.fn().mockResolvedValue(true),
  isVerified: vi.fn().mockReturnValue(true)
};

vi.mock('fs/promises', () => ({
  readFile: vi.fn(async (filePath) => {
    if (filePath.endsWith('CounterIsland.zk')) {
      return mockCounterIslandZK; // Return mocked file content
    }
    throw new Error(`Mocked file not found: ${filePath}`);
  }),
}));

describe('CounterIsland.zk Integration Tests', () => {
  let parser: ZenithTemplateParser;
  let transformer: ZenithHtmlTransformer;
  let componentInstance: any;

  beforeEach(() => {
    // Initialize parser and transformer
    parser = new ZenithTemplateParser({
      enableZKDirectives: true,
      enableECSDirectives: true,
      enableHydrationDirectives: true
    });

    transformer = new ZenithHtmlTransformer({
      ecsManager: mockECSManager as any,
      verifySystem: mockVerifySystem,
      zkContext: { peerId: 'test-peer' }
    });

    // Reset mocks
    vi.clearAllMocks();
    
    // Set up SDK
    setZenithReference(mockZenithKernel as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('SFC Structure Parsing', () => {
    it('should parse .zk file structure correctly', async () => {
      const fileContent = await fs.readFile('CounterIsland.zk', 'utf-8');
      const templateMatch = fileContent.match(/<template>([\s\S]*?)<\/template>/);
      const scriptMatch = fileContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      const styleMatch = fileContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);

      expect(templateMatch).toBeTruthy();
      expect(scriptMatch).toBeTruthy();
      expect(styleMatch).toBeTruthy();

      const template = templateMatch![1].trim();
      const script = scriptMatch![1].trim();
      const style = styleMatch![1].trim();

      expect(template).toContain('<Hydra');
      expect(template).toContain('counter-island');
      expect(script).toContain('export const metadata');
      expect(script).toContain('CounterIsland');
      expect(style).toContain('.counter-island');
    });

    it('should extract metadata correctly', async () => {
      const fileContent = await fs.readFile('CounterIsland.zk', 'utf-8');
      const script = fileContent.match(/<script[^>]*>([\s\S]*?)<\/script>/)![1];
      const metadataMatch = script.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);

      expect(metadataMatch).toBeTruthy();

      const metadataStr = metadataMatch![1]
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/(\w+):/g, '"$1":')
        .replace(/'/g, '"');

      const metadata = JSON.parse(metadataStr);

      expect(metadata.name).toBe('CounterIsland');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.trustLevel).toBe('local');
      expect(metadata.ecsComponents).toContain('Counter');
    });
  });

  describe('Template Directive Parsing', () => {
    it('should parse ZK directives in template', async () => {
      const fileContent = await fs.readFile('CounterIsland.zk', 'utf-8');
      const template = fileContent.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);

      expect(parsed.zkDirectives?.zkEntity).toBeDefined();
      expect(parsed.zkDirectives?.zkTrust).toBeDefined();
    });

    it('should parse ECS directives in template', async () => {
      const fileContent = await fs.readFile('CounterIsland.zk', 'utf-8');
      const template = fileContent.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);

      expect(parsed.ecsBindings?.ecsEntity).toBeDefined();
      expect(parsed.ecsBindings?.ecsComponents).toBeDefined();
    });

    it('should parse hydration directives in template', async () => {
      const fileContent = await fs.readFile('CounterIsland.zk', 'utf-8');
      const template = fileContent.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);

      expect(parsed.hydrationConfig?.strategy).toBeDefined();
    });

    it('should parse Vue.js-style directives', async () => {
      const fileContent = await fs.readFile('CounterIsland.zk', 'utf-8');
      const template = fileContent.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);

      expect(parsed.directives?.vIf).toBeDefined();
      expect(parsed.directives?.bindings).toBeDefined();
    });
  });

  describe('Component Logic Integration', () => {
    beforeEach(() => {
      const props = {
        initialCount: 5,
        title: 'Test Counter',
        entityId: '123'
      };

      const context = {
        strategy: 'immediate',
        trustLevel: 'local',
        kernel: mockZenithKernel
      };

      componentInstance = {
        setup: (props: any, context: any) => {
          const controller = createCounterController({
            initialCount: props.initialCount || 0,
            title: props.title || 'Counter Island',
            entityId: props.entityId || null
          }, {
            strategy: context?.strategy || 'immediate',
            trustLevel: context?.trustLevel || 'local',
            entityId: props.entityId
          });

          const state = controller.getState();

          return {
            state,
            count: state.count,
            title: state.title,
            entityId: state.entityId,
            increment: () => controller.increment(),
            decrement: () => controller.decrement(),
            reset: () => controller.reset()
          };
        }
      };

      componentInstance.instance = componentInstance.setup(props, context);
    });

    it('should initialize component with correct state', () => {
      expect(componentInstance.instance.count).toBe(5);
      expect(componentInstance.instance.title).toBe('Test Counter');
      expect(componentInstance.instance.entityId).toBe('123');
    });

    it('should handle increment operation', async () => {
      const initialCount = componentInstance.instance.count;
      
      await componentInstance.instance.increment();
      
      expect(componentInstance.instance.state.count).toBe(initialCount + 1);
    });

    it('should handle decrement operation', async () => {
      const initialCount = componentInstance.instance.count;
      
      await componentInstance.instance.decrement();
      
      expect(componentInstance.instance.state.count).toBe(initialCount - 1);
    });

    it('should handle reset operation', async () => {
      // First increment to ensure we're not starting at 0
      await componentInstance.instance.increment();
      
      await componentInstance.instance.reset();
      
      expect(componentInstance.instance.state.count).toBe(0);
    });
  });

  describe('Template Rendering Integration', () => {
    it('should render template with component state', async () => {
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);

      const renderContext = {
        title: 'Test Counter',
        count: 42,
        entityId: '123',
        context: {
          strategy: 'immediate',
          trustLevel: 'local'
        },
        isUpdating: false,
        ecsConnected: true,
        hydrationTime: 150,
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem,
        zkContext: { peerId: 'test-peer' }
      };

      const transformer = new ZenithHtmlTransformer(renderContext);
      const result = await transformer.transform(parsed);

      expect(result).toContain('Test Counter');
      expect(result).toContain('42');
      expect(result).toContain('Entity: 123');
    });

    it('should handle conditional rendering with v-if', async () => {
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);
      
      // Test with entityId present
      const contextWithEntity = {
        entityId: '123',
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem
      };
      
      const transformerWithEntity = new ZenithHtmlTransformer(contextWithEntity);
      const resultWithEntity = await transformerWithEntity.transform(parsed);
      
      expect(resultWithEntity).toContain('entity-info');
      expect(resultWithEntity).toContain('Entity ID: 123');
      
      // Test with entityId absent
      const contextWithoutEntity = {
        entityId: null,
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem
      };
      
      const transformerWithoutEntity = new ZenithHtmlTransformer(contextWithoutEntity);
      const resultWithoutEntity = await transformerWithoutEntity.transform(parsed);
      
      // Should not contain entity info when entityId is null
      expect(resultWithoutEntity).not.toContain('entity-info');
    });

    it('should apply CSS classes based on state', async () => {
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);
      
      // Test with updating state
      const contextUpdating = {
        isUpdating: true,
        ecsConnected: true,
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem
      };
      
      const transformerUpdating = new ZenithHtmlTransformer(contextUpdating);
      const resultUpdating = await transformerUpdating.transform(parsed);
      
      expect(resultUpdating).toContain('updating');
      expect(resultUpdating).toContain('connected');
    });
  });

  describe('ZK Verification Integration', () => {
    it('should pass ZK verification with valid proof', async () => {
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);
      
      // Mock successful verification
      mockVerifySystem.verifyProof.mockResolvedValue(true);
      
      const context = {
        entityId: '123',
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem,
        zkContext: { peerId: 'test-peer' }
      };
      
      const transformer = new ZenithHtmlTransformer(context, {
        enableZKVerification: true
      });
      
      const result = await transformer.transform(parsed);
      
      expect(result).not.toContain('zk-verification-placeholder');
      expect(mockVerifySystem.verifyProof).toHaveBeenCalled();
    });

    it('should handle ZK verification failure', async () => {
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);

      // Mock failed verification
      mockVerifySystem.verifyProof.mockResolvedValue(false);

      const context = {
        entityId: '123',
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem,
        zkContext: { peerId: 'test-peer' }
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

  describe('ECS Integration', () => {
    it('should bind ECS component data', async () => {
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);
      
      const context = {
        entityId: 123,
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem
      };
      
      const transformer = new ZenithHtmlTransformer(context, {
        enableECSBinding: true
      });
      
      await transformer.transform(parsed);
      
      expect(mockECSManager.dumpComponentMap).toHaveBeenCalled();
    });

    it('should handle missing ECS components gracefully', async () => {
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsed = parser.parse(template);
      
      // Mock ECS manager returning empty data
      const emptyECSManager = {
        dumpComponentMap: vi.fn(() => new Map()),
        getAllEntities: vi.fn(() => []),
        getComponent: vi.fn(() => null),
        getEntitiesWithQuery: vi.fn(() => [])
      };
      
      const context = {
        entityId: 999,
        ecsManager: emptyECSManager,
        verifySystem: mockVerifySystem
      };
      
      const transformer = new ZenithHtmlTransformer(context, {
        enableECSBinding: true
      });
      
      const result = await transformer.transform(parsed);
      
      expect(result).toBeDefined();
      expect(result).not.toContain('undefined');
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full SFC workflow from parsing to rendering', async () => {
      // 1. Parse the complete .zk file structure
      const templateContent = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const scriptContent = mockCounterIslandZK.match(/<script[^>]*>([\s\S]*?)<\/script>/)![1];
      const styleContent = mockCounterIslandZK.match(/<style[^>]*>([\s\S]*?)<\/style>/)![1];
      
      expect(templateContent).toBeTruthy();
      expect(scriptContent).toBeTruthy();
      expect(styleContent).toBeTruthy();
      
      // 2. Parse template directives
      const parsed = parser.parse(templateContent);
      expect(parsed.componentName).toBe('Hydra');
      expect(parsed.zkDirectives).toBeDefined();
      expect(parsed.ecsBindings).toBeDefined();
      expect(parsed.hydrationConfig).toBeDefined();
      
      // 3. Create component instance
      const props = {
        initialCount: 10,
        title: 'Integration Test Counter',
        entityId: '123'
      };
      
      const componentContext = {
        strategy: 'immediate',
        trustLevel: 'verified',
        kernel: mockZenithKernel
      };
      
      const controller = createCounterController({
        initialCount: props.initialCount,
        title: props.title,
      }, componentContext);
      
      const renderContext = {
        ...props,
        count: controller.getState().count,
        title: controller.getState().title,
        entityId: controller.getState().entityId,
        context: componentContext,
        isUpdating: false,
        ecsConnected: true,
        hydrationTime: 125,
        ecsManager: mockECSManager,
        verifySystem: mockVerifySystem,
        zkContext: { peerId: 'test-peer' }
      };
      
      // 5. Transform template to HTML
      const transformer = new ZenithHtmlTransformer(renderContext, {
        enableZKVerification: true,
        enableECSBinding: true,
        enableHydrationConfig: true,
        hydrate: true
      });
      const result = await transformer.transform(parsed);
      
      // 6. Verify complete output
      expect(result).toContain('Integration Test Counter');
      expect(result).toContain('10'); // Initial count
      expect(result).toContain('Entity: 123');
      expect(result).toContain('Strategy: immediate');
      expect(result).toContain('Trust: verified');
      expect(result).toContain('data-hydrate="true"');
      expect(result).toContain('data-hydration-strategy="immediate"');
      expect(result).toContain('data-ecs-entity="123"');
      expect(result).toContain('data-zk-entity="123"');
      expect(result).toContain('data-zk-trust="verified"');

      // 7. Test component interactions
      await controller.increment();
      expect(controller.getState().count).toBe(11);
      await controller.decrement();
      expect(controller.getState().count).toBe(10);

      await controller.reset();
      expect(controller.getState().count).toBe(0);
    });
    
    it('should handle error scenarios gracefully', async () => {
      // Test with invalid template
      const invalidTemplate = '<div>{{ invalidExpression() }}</div>';
      const invalidParsed = parser.parse(invalidTemplate);
      const transformer = new ZenithHtmlTransformer({}, {
        fallbackToPlaceholder: true,
        debugMode: true
      });

      const result = await transformer.transform(invalidParsed);

      expect(result).toContain('render-error-placeholder');
      expect(result).toContain('⚠️ Rendering Error');
    });

    it('should handle missing dependencies gracefully', async () => {
      // Test without ECS manager
      const template = mockCounterIslandZK.match(/<template>([\s\S]*?)<\/template>/)![1];
      const parsedTemplate = parser.parse(template);
      const contextWithoutECS = {
        title: 'Test',
        count: 5,
        verifySystem: mockVerifySystem
      };
      const transformer = new ZenithHtmlTransformer(contextWithoutECS, {
        enableECSBinding: true
      });

      const result = await transformer.transform(parsedTemplate);

      expect(result).toBeDefined();
      expect(result).toContain('Test');
    });
  });
});
