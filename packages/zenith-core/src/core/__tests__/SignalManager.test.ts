/**
 * Tests for SignalManager Orchestrator
 */

import { SignalManager, getSignalManager, resetSignalManager } from '../SignalManager';
import { Signal, signal } from '../signals';
import { ECSManager } from '../ECSManager';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';

// Ensure DOM globals are available (fallback if global setup doesn't work)
if (typeof document === 'undefined') {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000/',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  global.document = dom.window.document;
  global.window = dom.window as any;
  global.HTMLElement = dom.window.HTMLElement;

  // Add requestAnimationFrame polyfill for tests
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16); // ~60fps
  };
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

describe('SignalManager', () => {
  let manager: SignalManager;
  let mockECS: ECSManager;

  beforeEach(() => {
    resetSignalManager();
    mockECS = new ECSManager();
    manager = new SignalManager({
      ecsManager: mockECS,
      debugMode: false,
      performanceTracking: true
    });
  });

  afterEach(() => {
    if (manager) {
      manager.dispose();
    }
  });

  describe('Signal Creation & Management', () => {
    test('creates and manages signals', () => {
      const count = manager.createSignal('counter', 0);
      
      expect(count.value).toBe(0);
      expect(count.name).toBe('counter');
      expect(manager.getSignal('counter')).toBe(count);
    });

    test('prevents duplicate signal IDs', () => {
      manager.createSignal('test', 0);
      expect(() => manager.createSignal('test', 1)).toThrow();
    });

    test('creates computed signals', () => {
      const count = manager.createSignal('count', 5);
      const doubled = manager.createComputed('doubled', () => count.value * 2);
      
      expect(doubled.value).toBe(10);
      
      count.value = 10;
      expect(doubled.value).toBe(20);
    });

    test('creates async signals', async () => {
      const asyncSig = manager.createAsyncSignal('async', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'loaded';
      });
      
      expect(asyncSig.loading).toBe(false);
      asyncSig.reload();
      expect(asyncSig.loading).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(asyncSig.value).toBe('loaded');
    });

    test('removes signals properly', () => {
      const count = manager.createSignal('counter', 0);
      expect(manager.removeSignal('counter')).toBe(true);
      expect(manager.getSignal('counter')).toBeUndefined();
    });
  });

  describe('DOM Binding', () => {
    test('binds signal to text content and handles disposal', async () => {
      const element = document.createElement('div');
      const count = manager.createSignal('count', 0);
      
      manager.bindTextContent('test-binding', element, count);
      
      // First update - should set text to "0"
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(element.textContent).toBe('0');
      
      // Update value before disposal
      count.value = 5;
      
      // Next frame should show updated value
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(element.textContent).toBe('5');
      
      // Dispose the signal - cleanup should happen synchronously
      count.dispose();
      expect(element.textContent).toBe('');
      expect(manager.getStats().domBindingCount).toBe(0);
    });

    test('binds signal to attributes and handles disposal', async () => {
      const element = document.createElement('div');
      const title = manager.createSignal('title', 'Hello');
      
      manager.bindAttribute('title-binding', element, 'title', title);
      
      // First update - should set title attribute
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(element.getAttribute('title')).toBe('Hello');
      
      // Update value before disposal
      title.value = 'World';
      
      // Next frame should show updated attribute
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(element.getAttribute('title')).toBe('World');
      
      // Dispose the signal - cleanup should happen synchronously
      title.dispose();
      expect(element.hasAttribute('title')).toBe(false);
      expect(manager.getStats().domBindingCount).toBe(0);
    });

    test('binds signal to class list and handles disposal', async () => {
      const element = document.createElement('div');
      const classes:any = manager.createSignal('classes', { active: true, disabled: false });

      manager.bindClassList('class-binding', element, classes);
      
      // First update - should add 'active' class
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(element.className).toBe('active');
      
      // Update classes before disposal
      classes.value = { active: false, disabled: true };
      
      // Next frame should show updated classes
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(element.className).toBe('disabled');
      
      // Dispose the signal - cleanup should happen synchronously
      classes.dispose();
      expect(element.className).toBe('');
      expect(manager.getStats().domBindingCount).toBe(0);
    });

    test('removes DOM bindings', () => {
      const element = document.createElement('div');
      const count = manager.createSignal('count', 0);
      
      manager.bindTextContent('test-binding', element, count);
      expect(manager.removeDOMBinding('test-binding')).toBe(true);
      expect(manager.removeDOMBinding('nonexistent')).toBe(false);
    });
  });

  describe('Hydra Context Management', () => {
    test('creates and manages Hydra contexts', () => {
      const context = manager.createHydraContext('test-hydra');
      
      expect(context.id).toBe('test-hydra');
      expect(context.signals.size).toBe(0);
    });

    test('adds signals to Hydra context', () => {
      const context = manager.createHydraContext('test-hydra');
      const count = manager.createSignal('count', 0);
      
      manager.addToHydraContext('test-hydra', 'count', count);
      
      const signals = manager.getHydraSignals('test-hydra');
      expect(signals.get('count')).toBe(count);
    });

    test('cleans up Hydra contexts', () => {
      const context = manager.createHydraContext('test-hydra');
      const count = manager.createSignal('count', 0);
      manager.addToHydraContext('test-hydra', 'count', count);
      
      manager.cleanupHydraContext('test-hydra');
      
      expect(manager.getHydraSignals('test-hydra').size).toBe(0);
    });
  });

  describe('ECS Integration', () => {
    test('creates entity-bound signals', () => {
      const entity = mockECS.createEntity();
      const health = manager.createSignal('health', 100, { entity });
      
      const entitySignals = manager.getEntitySignals(entity);
      expect(entitySignals).toHaveLength(1);
      expect(entitySignals[0]).toBe(health);
    });

    test('cleans up signals when entity is destroyed', () => {
      const entity = mockECS.createEntity();
      const health = manager.createSignal('health', 100, { entity });
      
      expect(manager.getEntitySignals(entity)).toHaveLength(1);
      
      mockECS.destroyEntity(entity);
      
      expect(manager.getEntitySignals(entity)).toHaveLength(0);
      expect(manager.getSignal('health')).toBeUndefined();
    });
  });

  describe('Performance & Statistics', () => {
    test('tracks performance statistics', () => {
      manager.createSignal('count1', 0);
      manager.createSignal('count2', 0);
      manager.createComputed('sum', () => 0);
      
      const stats = manager.getStats();
      
      expect(stats.totalSignals).toBe(2);
      expect(stats.activeSignals).toBe(2);
      expect(stats.memoryUsage.signals).toBe(2);
      expect(stats.memoryUsage.computedSignals).toBe(1);
    });

    test('provides debug information', () => {
      manager.createSignal('test', 0);
      
      const debug = manager.getDebugInfo();
      
      expect(debug.signals).toContain('test');
      expect(debug.stats.totalSignals).toBe(1);
    });
  });

  describe('Global Instance Management', () => {
    test('provides global singleton access', () => {
      const global1 = getSignalManager();
      const global2 = getSignalManager();
      
      expect(global1).toBe(global2);
    });

    test('resets global instance', () => {
      const global1 = getSignalManager();
      resetSignalManager();
      const global2 = getSignalManager();
      
      expect(global1).not.toBe(global2);
    });
  });

  describe('Cleanup & Disposal', () => {
    test('disposes all resources', () => {
      const count = manager.createSignal('count', 0);
      const element = document.createElement('div');
      manager.bindTextContent('binding', element, count);
      manager.createHydraContext('hydra');
      
      const stats = manager.getStats();
      expect(stats.activeSignals).toBe(1);
      expect(stats.domBindingCount).toBe(1);
      expect(stats.hydraContextCount).toBe(1);
      
      manager.dispose();
      
      const finalStats = manager.getStats();
      expect(finalStats.memoryUsage.signals).toBe(0);
      expect(finalStats.memoryUsage.domBindings).toBe(0);
    });
  });
});
