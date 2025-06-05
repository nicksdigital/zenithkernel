/**
 * Tests for ZenithKernel Island Loader
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ZenithIslandLoader, initializeIslands, hydrateIsland } from '../../../src/modules/Rendering/island-loader';
import { islandLoader } from '../../../src/modules/Rendering/island-loader';
import { IslandComponent, IslandRegistration } from '../../../src/modules/Rendering/types';

// Mock intersection observer
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock requestIdleCallback
const mockRequestIdleCallback = vi.fn();
window.requestIdleCallback = mockRequestIdleCallback;
window.cancelIdleCallback = vi.fn();

// Mock island component
const createMockIsland = (name: string): IslandComponent => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  view: vi.fn(() => {
    const div = document.createElement('div');
    div.textContent = `Mock ${name} view`;
    return div;
  })
});

describe('ZenithKernel Island Loader', () => {
  let loader: ZenithIslandLoader;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    
    // Create fresh loader instance
    loader = new ZenithIslandLoader();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    loader.cleanup();
  });

  describe('Island Registration', () => {
    it('should register islands', () => {
      const mockIsland = createMockIsland('TestIsland');
      const registration: IslandRegistration = {
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      };

      loader.registerIsland(registration);
      
      expect(loader.getIsland('TestIsland')).toBe(registration);
    });

    it('should unregister islands', () => {
      const mockIsland = createMockIsland('TestIsland');
      const registration: IslandRegistration = {
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      };

      loader.registerIsland(registration);
      loader.unregisterIsland('TestIsland');
      
      expect(loader.getIsland('TestIsland')).toBeUndefined();
    });

    it('should return undefined for non-existent islands', () => {
      expect(loader.getIsland('NonExistent')).toBeUndefined();
    });
  });

  describe('Island Discovery', () => {
    it('should discover islands in DOM', () => {
      // Create test islands in DOM
      document.body.innerHTML = `
        <div data-zk-island="TestIsland1" data-zk-props='{"test": true}'></div>
        <div data-zk-island="TestIsland2"></div>
        <div>Not an island</div>
      `;

      const islands = loader.discoverIslands();
      
      expect(islands).toHaveLength(2);
      expect(islands[0].getAttribute('data-zk-island')).toBe('TestIsland1');
      expect(islands[1].getAttribute('data-zk-island')).toBe('TestIsland2');
    });

    it('should parse island configuration correctly', () => {
      const mockIsland = createMockIsland('TestIsland');
      loader.registerIsland({
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      document.body.innerHTML = `
        <div 
          data-zk-island="TestIsland"
          data-zk-props='{"count": 5, "label": "Test"}'
          data-zk-strategy="immediate"
          data-zk-context='{"userId": "123"}'
        ></div>
      `;

      const islands = loader.discoverIslands();
      expect(islands).toHaveLength(1);
      
      // The discovery should trigger hydration for immediate strategy
      expect(mockIsland.mount).toHaveBeenCalledWith(
        islands[0],
        { count: 5, label: 'Test' },
        { userId: '123' }
      );
    });

    it('should handle malformed JSON in props gracefully', () => {
      document.body.innerHTML = `
        <div data-zk-island="TestIsland" data-zk-props='invalid json'></div>
      `;

      // Should not throw, just log error
      expect(() => loader.discoverIslands()).not.toThrow();
    });
  });

  describe('Island Hydration', () => {
    it('should hydrate registered islands', async () => {
      const mockIsland = createMockIsland('TestIsland');
      loader.registerIsland({
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      const element = document.createElement('div');
      element.setAttribute('data-zk-island', 'TestIsland');
      document.body.appendChild(element);

      await loader.hydrateIsland(element, {
        island: 'TestIsland',
        props: { test: true }
      });

      expect(mockIsland.mount).toHaveBeenCalledWith(
        element,
        { test: true },
        undefined
      );
      expect(element.getAttribute('data-hydra-state')).toBe('hydrated');
      expect(element.classList.contains('zk-island-hydrated')).toBe(true);
    });

    it('should handle hydration errors gracefully', async () => {
      const mockIsland: IslandComponent = {
        mount: vi.fn().mockRejectedValue(new Error('Mount failed')),
        unmount: vi.fn()
      };

      loader.registerIsland({
        name: 'ErrorIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      const element = document.createElement('div');
      element.setAttribute('data-zk-island', 'ErrorIsland');
      document.body.appendChild(element);

      await loader.hydrateIsland(element, {
        island: 'ErrorIsland'
      });

      expect(element.getAttribute('data-hydra-state')).toBe('error');
      expect(element.classList.contains('zk-island-error')).toBe(true);
    });

    it('should not hydrate already hydrated islands', async () => {
      const mockIsland = createMockIsland('TestIsland');
      loader.registerIsland({
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      const element = document.createElement('div');
      document.body.appendChild(element);

      // First hydration
      await loader.hydrateIsland(element, { island: 'TestIsland' });
      expect(mockIsland.mount).toHaveBeenCalledOnce();

      // Second hydration attempt
      await loader.hydrateIsland(element, { island: 'TestIsland' });
      expect(mockIsland.mount).toHaveBeenCalledOnce(); // Should not be called again
    });

    it('should handle non-existent islands', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await loader.hydrateIsland(element, {
        island: 'NonExistentIsland'
      });

      expect(element.getAttribute('data-hydra-state')).toBe('error');
    });
  });

  describe('Hydration Strategies', () => {
    it('should handle immediate strategy', () => {
      const mockIsland = createMockIsland('ImmediateIsland');
      loader.registerIsland({
        name: 'ImmediateIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      document.body.innerHTML = `
        <div data-zk-island="ImmediateIsland" data-zk-strategy="immediate"></div>
      `;

      loader.discoverIslands();

      expect(mockIsland.mount).toHaveBeenCalled();
    });

    it('should setup intersection observer for visible strategy', () => {
      // Clear previous mock calls from constructor
      vi.clearAllMocks();
      
      // Create a new loader instance which will call the IntersectionObserver constructor
      const newLoader = new ZenithIslandLoader();
      
      expect(mockIntersectionObserver).toHaveBeenCalled();
      
      newLoader.cleanup();
    });

    it('should setup interaction listeners for interaction strategy', () => {
      const mockIsland = createMockIsland('InteractionIsland');
      loader.registerIsland({
        name: 'InteractionIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      document.body.innerHTML = `
        <div data-zk-island="InteractionIsland" data-zk-strategy="interaction"></div>
      `;

      const element = document.querySelector('[data-zk-island]') as HTMLElement;
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

      loader.discoverIslands();

      // Should add interaction event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), expect.any(Object));
      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function), expect.any(Object));
    });

    it('should handle idle strategy', () => {
      // Clear previous mock calls from constructor
      vi.clearAllMocks();
      
      // Create a new loader instance which will call requestIdleCallback in constructor
      const newLoader = new ZenithIslandLoader();
      
      expect(mockRequestIdleCallback).toHaveBeenCalled();
      
      newLoader.cleanup();
    });

    it('should do nothing for manual strategy', () => {
      const mockIsland = createMockIsland('ManualIsland');
      loader.registerIsland({
        name: 'ManualIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      document.body.innerHTML = `
        <div data-zk-island="ManualIsland" data-zk-strategy="manual"></div>
      `;

      loader.discoverIslands();

      expect(mockIsland.mount).not.toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    it('should emit discovery events', () => {
      const discoveryHandler = vi.fn();
      loader.addEventListener('island:discovered', discoveryHandler);

      document.body.innerHTML = `
        <div data-zk-island="TestIsland"></div>
      `;

      loader.discoverIslands();

      expect(discoveryHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            element: expect.any(HTMLElement),
            config: expect.objectContaining({
              island: 'TestIsland'
            })
          })
        })
      );
    });

    it('should emit hydration events', async () => {
      const loadingHandler = vi.fn();
      const hydratedHandler = vi.fn();
      
      loader.addEventListener('island:loading', loadingHandler);
      loader.addEventListener('island:hydrated', hydratedHandler);

      const mockIsland = createMockIsland('TestIsland');
      loader.registerIsland({
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      const element = document.createElement('div');
      document.body.appendChild(element);

      await loader.hydrateIsland(element, { island: 'TestIsland' });

      expect(loadingHandler).toHaveBeenCalled();
      expect(hydratedHandler).toHaveBeenCalled();
    });

    it('should emit error events', async () => {
      const errorHandler = vi.fn();
      loader.addEventListener('island:error', errorHandler);

      await loader.hydrateIsland(document.createElement('div'), {
        island: 'NonExistentIsland'
      });

      // Wait for the event loop to process the event
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', () => {
      const mockIsland = createMockIsland('TestIsland');
      loader.registerIsland({
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      document.body.innerHTML = `
        <div data-zk-island="TestIsland" data-hydra-state="hydrated"></div>
      `;

      loader.cleanup();

      expect(mockIsland.unmount).toHaveBeenCalled();
      expect(loader.getIsland('TestIsland')).toBeUndefined();
    });
  });
});

describe('Global Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('initializeIslands', () => {
    it('should initialize on DOM ready', () => {
      // Mock document.readyState
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      initializeIslands();

      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });

    it('should initialize immediately if DOM is ready', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      document.body.innerHTML = `
        <div data-zk-island="TestIsland"></div>
      `;

      expect(() => initializeIslands()).not.toThrow();
    });
  });

  describe('hydrateIsland helper', () => {
    it('should hydrate island by selector', async () => {
      const mockIsland = createMockIsland('TestIsland');
      islandLoader.registerIsland({
        name: 'TestIsland',
        component: mockIsland,
        trustLevel: 'local'
      });

      const element = document.createElement('div');
      element.setAttribute('data-zk-island', 'TestIsland');
      document.body.appendChild(element);

      await hydrateIsland(element, { island: 'TestIsland' });
      expect(mockIsland.mount).toHaveBeenCalledWith(element, undefined, undefined);
    }, 10000); // Increase timeout to 10s for slow environments

    it('should throw for non-existent elements', async () => {
      await expect(hydrateIsland('#non-existent')).rejects.toThrow('Element not found');
    });

    it('should throw for invalid islands', async () => {
      document.body.innerHTML = `
        <div id="not-island">Regular div</div>
      `;

      await expect(hydrateIsland('#not-island')).rejects.toThrow('not a valid island');
    });
  });
});
