/**
 * Performance and Benchmark Tests for ZenithKernel SFC System
 * 
 * Measures performance characteristics of template parsing, transformation,
 * and component operations under various loads
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZenithTemplateParser } from '../../packages/zenith-core/src/modules/Rendering/template-parser';
import { ZenithHtmlTransformer } from '../../packages/zenith-core/src/modules/Rendering/zenith-html-transformer';
import {
  createCounterController,
  setZenithReference,
  ComponentContext
} from '../../test-app/src/sdk/ComponentSDK';

// Performance measurement utilities
class PerformanceProfiler {
  private measurements: Map<string, number[]> = new Map();

  measure<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then(value => {
        this.recordMeasurement(name, performance.now() - start);
        return value;
      });
    } else {
      this.recordMeasurement(name, performance.now() - start);
      return result;
    }
  }

  private recordMeasurement(name: string, duration: number) {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, total: 0, count: 0 };
    }

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const total = measurements.reduce((a, b) => a + b, 0);

    return { avg, min, max, total, count: measurements.length };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  clear() {
    this.measurements.clear();
  }
}

// Memory measurement utilities
class MemoryProfiler {
  private initialMemory: number = 0;

  start() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.initialMemory = performance.memory.usedJSHeapSize;
    }
  }

  getUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        delta: performance.memory.usedJSHeapSize - this.initialMemory
      };
    }
    return { used: 0, total: 0, limit: 0, delta: 0 };
  }
}

// Test data generators
function generateComplexTemplate(complexity: number = 10): string {
  const items = Array.from({ length: complexity }, (_, i) => `item${i}`);
  const conditions = Array.from({ length: complexity / 2 }, (_, i) => `condition${i}`);
  
  return `
    <div class="complex-component" 
         zk-trust="local" 
         ecs-entity="{{ entityId }}"
         hydration-strategy="visible">
      <h1>{{ title }}</h1>
      <div v-if="showHeader">
        <p>Complex template with ${complexity} items</p>
      </div>
      
      ${conditions.map(condition => `
        <section v-if="${condition}">
          <h2>Section for {{ ${condition} }}</h2>
          <div v-for="item in ${condition}Items" :key="item.id">
            <span :class="item.active ? 'active' : 'inactive'">
              {{ item.name }} - {{ item.value }}
            </span>
            <button @click="handleClick" :data-id="item.id">
              Action
            </button>
          </div>
        </section>
      `).join('')}
      
      <div class="items-list">
        <div v-for="item in items" :key="item" :class="getItemClass(item)">
          <span>{{ item }}</span>
          <input :value="getItemValue(item)" @input="updateItem" />
        </div>
      </div>
      
      <footer>
        <p>Total items: {{ items.length }}</p>
        <p>Last updated: {{ lastUpdate }}</p>
      </footer>
    </div>
  `;
}

function generateComplexContext(complexity: number = 10): any {
  const items = Array.from({ length: complexity }, (_, i) => `item${i}`);
  const conditions = Array.from({ length: complexity / 2 }, (_, i) => `condition${i}`);
  
  const context: any = {
    title: 'Performance Test Component',
    showHeader: true,
    entityId: '123',
    items,
    lastUpdate: new Date().toISOString(),
    getItemClass: (item: string) => `item-${item}`,
    getItemValue: (item: string) => `value-${item}`,
    handleClick: () => {},
    updateItem: () => {}
  };

  // Add condition-specific data
  conditions.forEach((condition, i) => {
    context[condition] = i % 2 === 0; // Alternate true/false
    context[`${condition}Items`] = Array.from({ length: 5 }, (_, j) => ({
      id: j,
      name: `${condition}-item-${j}`,
      value: j * 10,
      active: j % 2 === 0
    }));
  });

  return context;
}

// Mock ECS Manager for performance tests
const createMockECSManager = (entityCount: number = 1000) => ({
  getAllEntities: vi.fn(() => Array.from({ length: entityCount }, (_, i) => i)),
  getComponent: vi.fn((entityId, type) => 
    type === 'Counter' ? { value: entityId * 2 } : null
  ),
  addComponent: vi.fn(),
  dumpComponentMap: vi.fn(() => {
    const map = new Map();
    map.set('Counter', new Map(
      Array.from({ length: entityCount }, (_, i) => [i, { value: i * 2 }])
    ));
    return map;
  }),
  getEntitiesWithQuery: vi.fn(() => Array.from({ length: Math.min(entityCount, 100) }, (_, i) => i))
});

const mockVerifySystem = {
  verifyProof: vi.fn().mockResolvedValue(true),
  isVerified: vi.fn().mockReturnValue(true)
};

describe('ZenithKernel SFC Performance Benchmarks', () => {
  let profiler: PerformanceProfiler;
  let memoryProfiler: MemoryProfiler;
  let parser: ZenithTemplateParser;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
    memoryProfiler = new MemoryProfiler();
    parser = new ZenithTemplateParser({
      enableZKDirectives: true,
      enableECSDirectives: true,
      enableHydrationDirectives: true
    });

    // Setup SDK
    setZenithReference({
      getECS: () => createMockECSManager()
    } as any);
  });

  describe('Template Parser Performance', () => {
    it('should parse simple templates efficiently', () => {
      const simpleTemplate = '<div class="test">{{ value }}</div>';
      const iterations = 1000;

      profiler.measure('simple-parse', () => {
        for (let i = 0; i < iterations; i++) {
          parser.parse(simpleTemplate);
        }
      });

      const stats = profiler.getStats('simple-parse');
      console.log(`Simple parsing: ${stats.avg.toFixed(2)}ms avg for ${iterations} iterations`);
      
      // Should complete 1000 simple parses in under 100ms
      expect(stats.total).toBeLessThan(100);
    });

    it('should handle complex templates within performance bounds', () => {
      const complexTemplate = generateComplexTemplate(50);
      const iterations = 100;

      profiler.measure('complex-parse', () => {
        for (let i = 0; i < iterations; i++) {
          parser.parse(complexTemplate);
        }
      });

      const stats = profiler.getStats('complex-parse');
      console.log(`Complex parsing: ${stats.avg.toFixed(2)}ms avg for ${iterations} iterations`);
      
      // Complex templates should still parse reasonably fast
      expect(stats.avg).toBeLessThan(10); // Less than 10ms per complex template
    });

    it('should scale linearly with template complexity', () => {
      const complexities = [10, 20, 40, 80];
      const results: number[] = [];

      complexities.forEach(complexity => {
        const template = generateComplexTemplate(complexity);
        const iterations = 50;

        profiler.measure(`parse-complexity-${complexity}`, () => {
          for (let i = 0; i < iterations; i++) {
            parser.parse(template);
          }
        });

        const stats = profiler.getStats(`parse-complexity-${complexity}`);
        results.push(stats.avg);
        console.log(`Complexity ${complexity}: ${stats.avg.toFixed(2)}ms avg`);
      });

      // Performance should scale reasonably (not exponentially)
      const ratio1 = results[1] / results[0];
      const ratio2 = results[2] / results[1];
      const ratio3 = results[3] / results[2];

      expect(ratio1).toBeLessThan(3); // No more than 3x slower for 2x complexity
      expect(ratio2).toBeLessThan(3);
      expect(ratio3).toBeLessThan(3);
    });
  });

  describe('HTML Transformer Performance', () => {
    it('should transform simple templates efficiently', async () => {
      const template = parser.parse('<div>{{ count }}</div>');
      const context = { count: 42 };
      const transformer = new ZenithHtmlTransformer(context);
      const iterations = 500;

      await profiler.measure('simple-transform', async () => {
        for (let i = 0; i < iterations; i++) {
          await transformer.transform(template);
        }
      });

      const stats = profiler.getStats('simple-transform');
      console.log(`Simple transformation: ${stats.avg.toFixed(2)}ms avg for ${iterations} iterations`);
      
      expect(stats.total).toBeLessThan(200); // Under 200ms for 500 simple transforms
    });

    it('should handle complex transformations efficiently', async () => {
      const complexTemplate = generateComplexTemplate(30);
      const complexContext = generateComplexContext(30);
      const parsed = parser.parse(complexTemplate);
      
      const transformer = new ZenithHtmlTransformer({
        ...complexContext,
        ecsManager: createMockECSManager(100),
        verifySystem: mockVerifySystem
      });

      const iterations = 20;

      await profiler.measure('complex-transform', async () => {
        for (let i = 0; i < iterations; i++) {
          await transformer.transform(parsed);
        }
      });

      const stats = profiler.getStats('complex-transform');
      console.log(`Complex transformation: ${stats.avg.toFixed(2)}ms avg for ${iterations} iterations`);
      
      expect(stats.avg).toBeLessThan(50); // Less than 50ms per complex transform
    });

    it('should handle concurrent transformations efficiently', async () => {
      const template = parser.parse('<div>{{ value }}</div>');
      const concurrency = 20;
      
      memoryProfiler.start();

      await profiler.measure('concurrent-transform', async () => {
        const promises = Array.from({ length: concurrency }, (_, i) => {
          const transformer = new ZenithHtmlTransformer({ value: i });
          return transformer.transform(template);
        });
        
        await Promise.all(promises);
      });

      const stats = profiler.getStats('concurrent-transform');
      const memoryUsage = memoryProfiler.getUsage();
      
      console.log(`Concurrent transformation: ${stats.total.toFixed(2)}ms for ${concurrency} concurrent operations`);
      console.log(`Memory delta: ${(memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`);
      
      expect(stats.total).toBeLessThan(100); // Should complete quickly
      expect(memoryUsage.delta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });
  });

  describe('Component Controller Performance', () => {
    it('should create controllers efficiently', () => {
      const iterations = 1000;

      profiler.measure('controller-creation', () => {
        for (let i = 0; i < iterations; i++) {
          createCounterController({
            initialCount: i,
            entityId: `entity-${i}`
          }, {
            strategy: 'immediate'
          });
        }
      });

      const stats = profiler.getStats('controller-creation');
      console.log(`Controller creation: ${stats.avg.toFixed(4)}ms avg for ${iterations} iterations`);
      
      expect(stats.total).toBeLessThan(50); // Under 50ms for 1000 controllers
    });

    it('should handle rapid state updates efficiently', async () => {
      const controller = createCounterController({ initialCount: 0 }, {});
      const operations = 1000;

      await profiler.measure('rapid-updates', async () => {
        for (let i = 0; i < operations; i++) {
          if (i % 3 === 0) {
            await controller.increment();
          } else if (i % 3 === 1) {
            await controller.decrement();
          } else {
            await controller.reset();
          }
        }
      });

      const stats = profiler.getStats('rapid-updates');
      console.log(`Rapid updates: ${stats.total.toFixed(2)}ms for ${operations} operations`);
      
      expect(stats.total).toBeLessThan(500); // Under 500ms for 1000 operations
      expect(stats.avg).toBeLessThan(1); // Under 1ms per operation on average
    });

    it('should handle multiple controllers efficiently', async () => {
      const controllerCount = 100;
      const controllers = Array.from({ length: controllerCount }, (_, i) =>
        createCounterController({
          initialCount: i,
          entityId: `entity-${i}`
        }, {})
      );

      memoryProfiler.start();

      await profiler.measure('multiple-controllers', async () => {
        // Mount all controllers
        controllers.forEach(controller => controller.mount());
        
        // Perform operations on all controllers
        for (let i = 0; i < 10; i++) {
          await Promise.all(controllers.map(controller => controller.increment()));
        }
        
        // Unmount all controllers
        controllers.forEach(controller => controller.unmount());
      });

      const stats = profiler.getStats('multiple-controllers');
      const memoryUsage = memoryProfiler.getUsage();
      
      console.log(`Multiple controllers: ${stats.total.toFixed(2)}ms for ${controllerCount} controllers`);
      console.log(`Memory delta: ${(memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`);
      
      expect(stats.total).toBeLessThan(1000); // Under 1 second
      expect(memoryUsage.delta).toBeLessThan(20 * 1024 * 1024); // Less than 20MB growth
    });
  });

  describe('ECS Integration Performance', () => {
    it('should handle large ECS datasets efficiently', async () => {
      const entityCount = 10000;
      const largeECSManager = createMockECSManager(entityCount);
      
      const template = parser.parse(`
        <div ecs-entity="123" ecs-components='["Counter"]'>
          Value: {{ Counter.value }}
        </div>
      `);

      const transformer = new ZenithHtmlTransformer({
        ecsManager: largeECSManager,
        verifySystem: mockVerifySystem
      });

      await profiler.measure('large-ecs-transform', async () => {
        await transformer.transform(template);
      });

      const stats = profiler.getStats('large-ecs-transform');
      console.log(`Large ECS transform: ${stats.total.toFixed(2)}ms with ${entityCount} entities`);
      
      expect(stats.total).toBeLessThan(100); // Should handle large datasets efficiently
    });

    it('should cache ECS queries for performance', async () => {
      const ecsManager = createMockECSManager(1000);
      const template = parser.parse(`
        <div v-for="entity in ecsQuery('test-query')">
          Entity {{ entity }}: {{ ecsGet(entity, 'Counter').value }}
        </div>
      `);

      const transformer = new ZenithHtmlTransformer({
        ecsManager,
        verifySystem: mockVerifySystem
      });

      // First render (should cache queries)
      await profiler.measure('ecs-first-render', async () => {
        await transformer.transform(template);
      });

      // Second render (should use cache)
      await profiler.measure('ecs-second-render', async () => {
        await transformer.transform(template);
      });

      const firstStats = profiler.getStats('ecs-first-render');
      const secondStats = profiler.getStats('ecs-second-render');
      
      console.log(`ECS first render: ${firstStats.total.toFixed(2)}ms`);
      console.log(`ECS second render: ${secondStats.total.toFixed(2)}ms`);
      
      // Second render should be faster (cached)
      expect(secondStats.total).toBeLessThanOrEqual(firstStats.total);
    });
  });

  describe('Memory Usage and Leaks', () => {
    it('should not leak memory during repeated operations', async () => {
      const template = parser.parse('<div>{{ count }}</div>');
      const iterations = 100;
      
      memoryProfiler.start();
      
      for (let i = 0; i < iterations; i++) {
        const transformer = new ZenithHtmlTransformer({ count: i });
        await transformer.transform(template);
        
        // Force garbage collection hint (if available)
        if (global.gc) {
          global.gc();
        }
      }

      const memoryUsage = memoryProfiler.getUsage();
      console.log(`Memory after ${iterations} operations: ${(memoryUsage.delta / 1024 / 1024).toFixed(2)}MB delta`);
      
      // Should not accumulate significant memory
      expect(memoryUsage.delta).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });

    it('should clean up controller resources properly', () => {
      const controllerCount = 50;
      
      memoryProfiler.start();
      
      const controllers = Array.from({ length: controllerCount }, (_, i) =>
        createCounterController({ entityId: `entity-${i}` }, {})
      );

      // Mount all controllers
      controllers.forEach(controller => controller.mount());
      
      const mountedMemory = memoryProfiler.getUsage();
      
      // Unmount all controllers
      controllers.forEach(controller => controller.unmount());
      
      // Force cleanup
      if (global.gc) {
        global.gc();
      }
      
      const cleanedMemory = memoryProfiler.getUsage();
      
      console.log(`Memory after mount: ${(mountedMemory.delta / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory after cleanup: ${(cleanedMemory.delta / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory should not continuously grow
      expect(cleanedMemory.delta).toBeLessThanOrEqual(mountedMemory.delta * 1.2); // Allow 20% variance
    });
  });

  describe('Real-world Scenario Benchmarks', () => {
    it('should handle typical e-commerce product list efficiently', async () => {
      const productCount = 100;
      const template = parser.parse(`
        <div class="product-list" hydration-strategy="visible">
          <h2>{{ title }}</h2>
          <div v-for="product in products" class="product-card" :key="product.id">
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
            <span class="price">\${{ product.price }}</span>
            <button @click="addToCart" :data-id="product.id" :disabled="product.outOfStock">
              {{ product.outOfStock ? 'Out of Stock' : 'Add to Cart' }}
            </button>
            <div v-if="product.inStock > 0" class="stock-info">
              {{ product.inStock }} remaining
            </div>
          </div>
        </div>
      `);

      const context = {
        title: 'Featured Products',
        products: Array.from({ length: productCount }, (_, i) => ({
          id: i,
          name: `Product ${i}`,
          description: `Description for product ${i}`,
          price: (Math.random() * 100).toFixed(2),
          inStock: Math.floor(Math.random() * 50),
          outOfStock: Math.random() < 0.1
        })),
        addToCart: () => {}
      };

      const transformer = new ZenithHtmlTransformer(context);

      await profiler.measure('ecommerce-render', async () => {
        await transformer.transform(template);
      });

      const stats = profiler.getStats('ecommerce-render');
      console.log(`E-commerce render: ${stats.total.toFixed(2)}ms for ${productCount} products`);
      
      expect(stats.total).toBeLessThan(200); // Under 200ms for 100 products
    });

    it('should handle dashboard with multiple widgets efficiently', async () => {
      const template = parser.parse(`
        <div class="dashboard" zk-trust="verified" ecs-entity="{{ userId }}">
          <header>
            <h1>Welcome, {{ user.name }}</h1>
            <span>Last login: {{ lastLogin }}</span>
          </header>
          
          <div class="widgets">
            <div v-for="widget in widgets" class="widget" :key="widget.id">
              <h3>{{ widget.title }}</h3>
              <div v-if="widget.type === 'chart'">
                <canvas :data-chart="widget.chartData"></canvas>
              </div>
              <div v-else-if="widget.type === 'stats'">
                <div v-for="stat in widget.stats" class="stat">
                  <span class="label">{{ stat.label }}</span>
                  <span class="value">{{ stat.value }}</span>
                </div>
              </div>
              <div v-else-if="widget.type === 'list'">
                <ul>
                  <li v-for="item in widget.items" :key="item.id">
                    {{ item.text }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `);

      const context = {
        userId: '123',
        user: { name: 'John Doe' },
        lastLogin: new Date().toISOString(),
        widgets: Array.from({ length: 12 }, (_, i) => ({
          id: i,
          title: `Widget ${i}`,
          type: ['chart', 'stats', 'list'][i % 3],
          chartData: Array.from({ length: 10 }, () => Math.random() * 100),
          stats: Array.from({ length: 4 }, (_, j) => ({
            label: `Metric ${j}`,
            value: Math.floor(Math.random() * 1000)
          })),
          items: Array.from({ length: 5 }, (_, k) => ({
            id: k,
            text: `Item ${k}`
          }))
        })),
        verifySystem: mockVerifySystem,
        ecsManager: createMockECSManager()
      };

      const transformer = new ZenithHtmlTransformer(context, {
        enableZKVerification: true,
        enableECSBinding: true
      });

      await profiler.measure('dashboard-render', async () => {
        await transformer.transform(template);
      });

      const stats = profiler.getStats('dashboard-render');
      console.log(`Dashboard render: ${stats.total.toFixed(2)}ms for 12 widgets`);
      
      expect(stats.total).toBeLessThan(300); // Under 300ms for complex dashboard
    });
  });

  afterEach(() => {
    if (profiler) {
      const allStats = profiler.getAllStats(); // Safely access getAllStats
      if (Object.keys(allStats).length > 0) {
        console.log('\n--- Performance Summary ---');
        Object.entries(allStats).forEach(([name, stats]) => {
          console.log(`${name}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms`);
        });
        console.log('--- End Summary ---\n');
      }
    }
  });
});
