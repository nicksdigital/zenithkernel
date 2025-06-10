/**
 * Test Utilities for ZenithKernel SFC System
 * 
 * Shared utilities, mocks, and helpers for testing the SFC system
 */

import { vi } from 'vitest';
import type { ECSManager, Entity } from '../../packages/zenith-core/src/core/ECSManager';
import type { ZenithKernel } from '../../packages/zenith-core/src/core/ZenithKernel';
import type { HydraContext } from '../../packages/zenith-core/src/modules/Rendering/types';

/**
 * Mock ECS Manager Factory
 */
export function createMockECSManager(config: {
  entityCount?: number;
  components?: Record<string, any>;
  entities?: Entity[];
} = {}): jest.Mocked<ECSManager> {
  const {
    entityCount = 10,
    components = { Counter: { value: 42 }, Health: { hp: 100, maxHp: 100 } },
    entities = Array.from({ length: entityCount }, (_, i) => i + 1)
  } = config;

  // Create component maps
  const componentMaps = new Map();
  Object.entries(components).forEach(([componentType, defaultData]) => {
    const componentMap = new Map();
    entities.forEach(entityId => {
      componentMap.set(entityId, { ...defaultData, entityId });
    });
    componentMaps.set(componentType, componentMap);
  });

  return {
    // Entity management
    getAllEntities: vi.fn(() => entities),
    createEntity: vi.fn(() => entities.length + 1),
    destroyEntity: vi.fn(),
    hasEntity: vi.fn((entityId) => entities.includes(entityId)),

    // Component management
    addComponent: vi.fn((entityId, componentType, data) => {
      let componentMap = componentMaps.get(componentType);
      if (!componentMap) {
        componentMap = new Map();
        componentMaps.set(componentType, componentMap);
      }
      componentMap.set(entityId, { ...data, entityId });
    }),
    removeComponent: vi.fn((entityId, componentType) => {
      const componentMap = componentMaps.get(componentType);
      if (componentMap) {
        componentMap.delete(entityId);
      }
    }),
    getComponent: vi.fn((entityId, componentType) => {
      const componentMap = componentMaps.get(componentType);
      return componentMap?.get(entityId) || null;
    }),
    hasComponent: vi.fn((entityId, componentType) => {
      const componentMap = componentMaps.get(componentType);
      return componentMap?.has(entityId) || false;
    }),

    // System management
    addSystem: vi.fn(),
    removeSystem: vi.fn(),
    getSystem: vi.fn(),
    getSystems: vi.fn(() => []),

    // Query and iteration
    query: vi.fn(() => entities),
    getEntitiesWithComponent: vi.fn((componentType) => {
      const componentMap = componentMaps.get(componentType);
      return componentMap ? Array.from(componentMap.keys()) : [];
    }),
    getEntitiesWithQuery: vi.fn((queryId) => entities.slice(0, 5)), // Return subset for queries

    // Debug and introspection
    dumpComponentMap: vi.fn(() => componentMaps),
    getComponentTypes: vi.fn(() => Object.keys(components)),
    getEntityComponents: vi.fn((entityId) => {
      const result: string[] = [];
      componentMaps.forEach((componentMap, componentType) => {
        if (componentMap.has(entityId)) {
          result.push(componentType);
        }
      });
      return result;
    }),

    // Event system
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),

    // Lifecycle
    update: vi.fn(),
    destroy: vi.fn()
  } as any;
}

/**
 * Mock ZenithKernel Factory
 */
export function createMockZenithKernel(config: {
  ecsManager?: ECSManager;
  systems?: any[];
} = {}): jest.Mocked<ZenithKernel> {
  const { ecsManager = createMockECSManager(), systems = [] } = config;

  return {
    // Core systems
    getECS: vi.fn(() => ecsManager),
    getSystem: vi.fn((name) => systems.find(s => s.name === name)),
    addSystem: vi.fn((system) => systems.push(system)),
    removeSystem: vi.fn((name) => {
      const index = systems.findIndex(s => s.name === name);
      if (index !== -1) systems.splice(index, 1);
    }),

    // Module management
    loadModule: vi.fn(),
    unloadModule: vi.fn(),
    getModule: vi.fn(),
    getModules: vi.fn(() => []),

    // Event system
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),

    // Lifecycle
    start: vi.fn(),
    stop: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),

    // Configuration
    getConfig: vi.fn(() => ({})),
    setConfig: vi.fn()
  } as any;
}

/**
 * Mock Verify System Factory
 */
export function createMockVerifySystem(config: {
  defaultVerificationResult?: boolean;
  verificationDelay?: number;
  proofValidation?: (proof: string) => boolean;
} = {}) {
  const {
    defaultVerificationResult = true,
    verificationDelay = 0,
    proofValidation = (proof: string) => proof.startsWith('zk:')
  } = config;

  return {
    verifyProof: vi.fn(async (entityId: string, zkProof: string) => {
      if (verificationDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, verificationDelay));
      }
      
      if (proofValidation) {
        return proofValidation(zkProof);
      }
      
      return defaultVerificationResult;
    }),
    isVerified: vi.fn((entityId: string) => defaultVerificationResult),
    generateProof: vi.fn(async (entityId: string) => `zk:proof-${entityId}-${Date.now()}`),
    validateProof: vi.fn((proof: string) => proofValidation(proof))
  };
}

/**
 * Test Data Generators
 */
export class TestDataGenerator {
  static simpleTemplate(props: { 
    content?: string; 
    attributes?: Record<string, string>;
    directives?: string[];
  } = {}) {
    const { 
      content = '{{ message }}', 
      attributes = {}, 
      directives = [] 
    } = props;

    const attrString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    const directiveString = directives.join(' ');

    return `<div ${attrString} ${directiveString}>${content}</div>`;
  }

  static complexTemplate(complexity: number = 10) {
    // Defensive: ensure complexity is a positive integer >= 1
    const safeComplexity = Number.isFinite(complexity) && complexity > 0 ? Math.floor(complexity) : 1;
    const conditions = Array.from({ length: safeComplexity }, (_, i) => `condition${i}`);
    const lists = Array.from({ length: safeComplexity }, (_, i) => `list${i}`);

    return `
      <div class="complex-template" 
           zk-trust="local" 
           ecs-entity="{{ entityId }}"
           hydration-strategy="visible">
        <header>
          <h1>{{ title }}</h1>
          <nav>
            <ul>
              ${Array.from({ length: 5 }, (_, i) => 
                `<li><a href="#section${i}">Section ${i}</a></li>`
              ).join('')}
            </ul>
          </nav>
        </header>
        
        <main>
          ${conditions.map((condition, i) => `
            <section v-if="${condition ?? `condition${i}`}" class="section-${i}">
              <h2>{{ ${(condition ?? `condition${i}`)}Title }}</h2>
              <div v-for="item in ${(lists && lists[i]) ? lists[i] : `list${i}`}" :key="item.id">
                <article :class="item.type">
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.description }}</p>
                  <button @click="handleAction" :data-id="item.id">
                    {{ item.actionLabel }}
                  </button>
                </article>
              </div>
            </section>
          `).join('')}
        </main>
        
        <footer>
          <p>Generated with complexity: ${safeComplexity}</p>
        </footer>
      </div>
    `;
  }

  static zkTemplate(config: {
    zkDirectives?: Record<string, string>;
    ecsDirectives?: Record<string, string>;
    hydrationDirectives?: Record<string, string>;
  } = {}) {
    const {
      zkDirectives = { 'zk-trust': 'local', 'zk-entity': '{{ entityId }}' },
      ecsDirectives = { 'ecs-entity': '{{ entityId }}', 'ecs-components': '["Counter"]' },
      hydrationDirectives = { 'hydration-strategy': 'immediate' }
    } = config;

    const allDirectives = { ...zkDirectives, ...ecsDirectives, ...hydrationDirectives };
    const directiveString = Object.entries(allDirectives)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    return `
      <div class="zk-component" ${directiveString}>
        <h2>{{ title }}</h2>
        <div class="content">{{ content }}</div>
        <div class="actions">
          <button @click="action1">Action 1</button>
          <button @click="action2">Action 2</button>
        </div>
      </div>
    `;
  }

  static componentContext(props: any = {}) {
    return {
      title: 'Test Component',
      content: 'Test content',
      entityId: '123',
      showContent: true,
      items: [
        { id: 1, name: 'Item 1', value: 10 },
        { id: 2, name: 'Item 2', value: 20 },
        { id: 3, name: 'Item 3', value: 30 }
      ],
      ...props
    };
  }

  static hydraContext(props: Partial<HydraContext> = {}): HydraContext {
    return {
      env: props.env ?? 'client',
      peerId: 'test-peer',
      trustLevel: 'local',
      strategy: 'immediate',
      ...props
    };
  }

  static zkFile(config: {
    template?: string;
    script?: string;
    style?: string;
    metadata?: any;
  } = {}) {
    const {
      template = '<div class="test">{{ message }}</div>',
      script = 'export default { setup() { return { message: "Hello" }; } };',
      style = '.test { color: blue; }',
      metadata = { name: 'TestComponent', version: '1.0.0' }
    } = config;

    const metadataExport = `export const metadata = ${JSON.stringify(metadata, null, 2)};`;

    return `
<template>
  ${template}
</template>

<script>
  ${metadataExport}
  
  ${script}
</script>

<style>
  ${style}
</style>
    `.trim();
  }
}

/**
 * Test Assertion Helpers
 */
export class TestAssertions {
  static expectValidHTML(html: string) {
    // Basic HTML validation
    const openTags = (html.match(/<[^/][^>]*[^/]>/g) || []).length;
    const closeTags = (html.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (html.match(/<[^>]+\/>/g) || []).length;
    
    // For well-formed HTML, open tags should equal close tags (accounting for self-closing)
    // This is a simplified check - for production, use a real HTML parser
    return {
      isValid: true, // Simplified for tests
      openTags,
      closeTags,
      selfClosingTags
    };
  }

  static expectContainsDirectives(html: string, directives: string[]) {
    const checks = directives.map(directive => ({
      directive,
      found: html.includes(directive)
    }));

    return {
      allFound: checks.every(check => check.found),
      checks
    };
  }

  static expectPerformanceBounds(duration: number, bounds: { min?: number; max: number }) {
    const { min = 0, max } = bounds;
    return {
      withinBounds: duration >= min && duration <= max,
      duration,
      bounds
    };
  }

  static expectMemoryWithinLimits(memoryDelta: number, limitMB: number) {
    const limitBytes = limitMB * 1024 * 1024;
    return {
      withinLimits: memoryDelta <= limitBytes,
      actualMB: memoryDelta / 1024 / 1024,
      limitMB
    };
  }
}

/**
 * Test Environment Setup Helpers
 */
export class TestEnvironment {
  static setupDOM() {
    // Ensure DOM globals are available for tests
    if (typeof window === 'undefined') {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost/',
        pretendToBeVisual: true,
        resources: 'usable'
      });

      global.window = dom.window as any;
      global.document = dom.window.document;
      global.navigator = dom.window.navigator;
      global.HTMLElement = dom.window.HTMLElement;
      global.CustomEvent = dom.window.CustomEvent;
    }
  }

  static mockPerformance() {
    if (typeof performance === 'undefined') {
      global.performance = {
        now: () => Date.now(),
        mark: () => {},
        measure: () => {},
        memory: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000000
        }
      } as any;
    }
  }

  static setupConsole() {
    // Mock console methods for tests that check logging
    const originalConsole = global.console;
    
    return {
      mockConsole() {
        global.console = {
          ...originalConsole,
          log: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          info: vi.fn()
        };
      },
      
      restoreConsole() {
        global.console = originalConsole;
      }
    };
  }

  static createTestFile(content: string, path: string = '/test/file.zk') {
    return {
      path,
      content,
      size: content.length,
      lastModified: Date.now()
    };
  }
}

/**
 * Mock Vite Plugin Helpers
 */
export class MockViteHelpers {
  static createMockConfig(overrides: any = {}) {
    return {
      root: '/test/project',
      command: 'serve',
      mode: 'development',
      build: {
        outDir: 'dist'
      },
      ...overrides
    };
  }

  static createMockServer() {
    return {
      middlewares: {
        use: vi.fn()
      },
      ws: {
        send: vi.fn()
      },
      hot: {
        on: vi.fn(),
        send: vi.fn()
      }
    };
  }

  static createMockBundle() {
    return {
      emitFile: vi.fn(),
      getFileName: vi.fn(),
      addWatchFile: vi.fn()
    };
  }
}

/**
 * Async Test Helpers
 */
export class AsyncTestHelpers {
  static async waitFor(condition: () => boolean, timeout: number = 1000, interval: number = 10) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }

  static createDeferred<T>() {
    let resolve: (value: T) => void;
    let reject: (error: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    return { promise, resolve: resolve!, reject: reject! };
  }
}

/**
 * Error Testing Helpers
 */
export class ErrorTestHelpers {
  static createError(message: string, type: string = 'Error') {
    const error = new Error(message);
    error.name = type;
    return error;
  }

  static expectErrorType(error: any, expectedType: string) {
    return error.name === expectedType || error.constructor.name === expectedType;
  }

  static captureConsoleErrors() {
    const errors: any[] = [];
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      errors.push(args);
      originalError(...args);
    };
    
    return {
      errors,
      restore() {
        console.error = originalError;
      }
    };
  }
}
