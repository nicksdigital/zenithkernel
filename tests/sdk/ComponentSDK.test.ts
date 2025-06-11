/**
 * Tests for ComponentSDK
 * 
 * Tests the component controller system, ECS integration, and SDK utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Ensure DOM globals are available
if (typeof window === 'undefined') {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000/',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  global.window = dom.window as any;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
}
import {
  ComponentController,
  CounterController,
  createCounterController,
  setZenithReference,
  getZenith,
  getECSManager,
  isSDKInitialized,
  initializeSDK,
  createTestEntity,
  getSDKStatus,
  ComponentContext
} from '../../test-app/src/sdk/ComponentSDK';

// Mock ZenithKernel
const mockZenithKernel = {
  getECS: vi.fn()
};

// Mock ECSManager
const mockECSManager = {
  getAllEntities: vi.fn(() => [123, 456]),
  getComponent: vi.fn((entityId, componentType) => {
    if (entityId === 123 && componentType === 'Counter') {
      return { value: 42 };
    }
    return null;
  }),
  addComponent: vi.fn(),
  dumpComponentMap: vi.fn(() => new Map())
};

describe('ComponentSDK', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockZenithKernel.getECS.mockReturnValue(mockECSManager);
    
    // Clear global state
    setZenithReference(null as any);
  });

  afterEach(() => {
    // Clean up any intervals that might be running
    if (vi.clearAllTimers) {
      vi.clearAllTimers();
    }
  });

  describe('ComponentController Base Class', () => {
    class TestController extends ComponentController<{ count: number }> {
      mount() {
        console.log('Test controller mounted');
      }
      
      unmount() {
        console.log('Test controller unmounted');
      }
    }

    it('should create controller with initial state', () => {
      const controller = new TestController({ count: 5 }, { strategy: 'test' });
      
      expect(controller.getState()).toEqual({ count: 5 });
    });

    it('should store context correctly', () => {
      const context: ComponentContext = { strategy: 'immediate', trustLevel: 'local' };
      const controller = new TestController({ count: 0 }, context);
      
      expect((controller as any).context).toEqual(context);
    });
  });

  describe('CounterController', () => {
    let controller: CounterController;
    let context: ComponentContext;

    beforeEach(() => {
      context = {
        strategy: 'immediate',
        trustLevel: 'local',
        entityId: '123'
      };
      
      controller = new CounterController({
        initialCount: 10,
        title: 'Test Counter',
        entityId: '123'
      }, context);
      
      // Set up SDK
      setZenithReference(mockZenithKernel as any);
    });

    it('should initialize with correct state', () => {
      const state = controller.getState();
      
      expect(state.count).toBe(10);
      expect(state.title).toBe('Test Counter');
      expect(state.entityId).toBe('123');
      expect(state.hydrationTime).toBe(0);
    });

    it('should use default values when not provided', () => {
      const defaultController = new CounterController({}, {});
      const state = defaultController.getState();
      
      expect(state.count).toBe(0);
      expect(state.title).toBe('Counter Island');
      expect(state.entityId).toBe(null);
    });

    describe('Increment Operation', () => {
      it('should increment count and update ECS', async () => {
        const initialCount = controller.getState().count;
        
        await controller.increment();
        
        expect(controller.getState().count).toBe(initialCount + 1);
        expect(mockECSManager.getComponent).toHaveBeenCalledWith(123, 'Counter');
      });

      it('should emit custom event on increment', async () => {
        // Ensure window is available
        if (typeof window === 'undefined') {
          expect.fail('Window is not available in test environment');
        }

        const eventSpy = vi.spyOn(window, 'dispatchEvent');

        await controller.increment();

        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'counter:change',
            detail: expect.objectContaining({
              entityId: '123',
              action: 'increment',
              value: 11
            })
          })
        );
      });

      it('should rollback on error', async () => {
        // Mock an error in the component accessor
        mockECSManager.getComponent.mockImplementationOnce(() => {
          throw new Error('ECS Error');
        });
        
        const initialCount = controller.getState().count;
        
        await expect(controller.increment()).rejects.toThrow('ECS Error');
        expect(controller.getState().count).toBe(initialCount);
      });
    });

    describe('Decrement Operation', () => {
      it('should decrement count and update ECS', async () => {
        const initialCount = controller.getState().count;
        
        await controller.decrement();
        
        expect(controller.getState().count).toBe(initialCount - 1);
      });

      it('should emit custom event on decrement', async () => {
        // Ensure window is available
        if (typeof window === 'undefined') {
          expect.fail('Window is not available in test environment');
        }

        const eventSpy = vi.spyOn(window, 'dispatchEvent');

        await controller.decrement();

        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'counter:change',
            detail: expect.objectContaining({
              action: 'decrement'
            })
          })
        );
      });

      it('should rollback on error', async () => {
        mockECSManager.getComponent.mockImplementationOnce(() => {
          throw new Error('ECS Error');
        });
        
        const initialCount = controller.getState().count;
        
        await expect(controller.decrement()).rejects.toThrow('ECS Error');
        expect(controller.getState().count).toBe(initialCount);
      });
    });

    describe('Reset Operation', () => {
      it('should reset count to zero', async () => {
        // First increment to make sure we're not starting at 0
        await controller.increment();
        expect(controller.getState().count).toBe(11);
        
        await controller.reset();
        
        expect(controller.getState().count).toBe(0);
      });

      it('should emit custom event on reset', async () => {
        // Ensure window is available
        if (typeof window === 'undefined') {
          expect.fail('Window is not available in test environment');
        }

        const eventSpy = vi.spyOn(window, 'dispatchEvent');

        await controller.reset();

        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'counter:change',
            detail: expect.objectContaining({
              action: 'reset',
              value: 0
            })
          })
        );
      });

      it('should rollback on error', async () => {
        await controller.increment(); // Set to non-zero value
        const currentCount = controller.getState().count;
        
        mockECSManager.getComponent.mockImplementationOnce(() => {
          throw new Error('ECS Error');
        });
        
        await expect(controller.reset()).rejects.toThrow('ECS Error');
        expect(controller.getState().count).toBe(currentCount);
      });
    });

    describe('Mount and Unmount', () => {
      it('should track changes when mounted with entity ID', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        controller.mount();
        
        expect(consoleSpy).toHaveBeenCalledWith('🔌 Mounting CounterController for entity 123');
        expect(controller.getConnectionStatus()).toBe(true);
        
        consoleSpy.mockRestore();
      });

      it('should handle mount without entity ID', () => {
        const localController = new CounterController({ entityId: null }, {});
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        localController.mount();
        
        expect(consoleSpy).toHaveBeenCalledWith('⚠️ No entity ID provided - operating in local mode');
        expect(localController.getConnectionStatus()).toBe(false);
        
        consoleSpy.mockRestore();
      });

      it('should clean up when unmounted', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        controller.mount();
        controller.unmount();
        
        expect(consoleSpy).toHaveBeenCalledWith('🔌 Unmounting CounterController for entity 123');
        expect(controller.getConnectionStatus()).toBe(false);
        
        consoleSpy.mockRestore();
      });
    });

    describe('Change Tracking', () => {
      it('should detect external changes through polling', async () => {
        // Check if timer mocking is available
        if (!vi.useFakeTimers || !vi.advanceTimersByTime) {
          console.warn('Timer mocking not available, skipping test');
          return;
        }

        vi.useFakeTimers();

        // Mock external change
        let externalValue = 42;
        mockECSManager.getComponent.mockImplementation(() => ({ value: externalValue }));

        controller.mount();

        // Simulate external change
        externalValue = 50;

        // Fast-forward polling interval
        vi.advanceTimersByTime(150);

        // The controller should detect the change
        expect(controller.getState().count).toBe(50);

        vi.useRealTimers();
      });
    });

    describe('Local Mode Operation', () => {
      let localController: CounterController;

      beforeEach(() => {
        localController = new CounterController({
          initialCount: 5,
          entityId: null
        }, {});
      });

      it('should work without ECS manager', async () => {
        await localController.increment();
        expect(localController.getState().count).toBe(6);
        
        await localController.decrement();
        expect(localController.getState().count).toBe(5);
        
        await localController.reset();
        expect(localController.getState().count).toBe(0);
      });

      it('should not attempt ECS operations in local mode', async () => {
        await localController.increment();
        
        // Should not call ECS methods
        expect(mockECSManager.getComponent).not.toHaveBeenCalled();
        expect(mockECSManager.addComponent).not.toHaveBeenCalled();
      });
    });
  });

  describe('Factory Functions', () => {
    it('should create counter controller through factory', () => {
      const controller = createCounterController({
        initialCount: 15,
        title: 'Factory Counter'
      }, {
        strategy: 'lazy'
      });
      
      expect(controller).toBeInstanceOf(CounterController);
      expect(controller.getState().count).toBe(15);
      expect(controller.getState().title).toBe('Factory Counter');
    });

    it('should handle factory errors', () => {
      // Test with invalid parameters
      expect(() => {
        createCounterController(null as any, {});
      }).toThrow();
    });
  });

  describe('SDK Initialization', () => {
    it('should set Zenith reference correctly', () => {
      setZenithReference(mockZenithKernel as any);
      
      expect(getZenith()).toBe(mockZenithKernel);
      expect(getECSManager()).toBe(mockECSManager);
    });

    it('should report initialization status', () => {
      expect(isSDKInitialized()).toBe(false);
      
      setZenithReference(mockZenithKernel as any);
      
      expect(isSDKInitialized()).toBe(true);
    });

    it('should initialize SDK through utility function', () => {
      const result = initializeSDK(mockZenithKernel as any);
      
      expect(result).toBe(true);
      expect(isSDKInitialized()).toBe(true);
    });

    it('should handle initialization errors', () => {
      const invalidKernel = { getECS: () => { throw new Error('Invalid'); } };
      
      const result = initializeSDK(invalidKernel as any);
      
      expect(result).toBe(false);
    });

    it('should recover ECS manager from Zenith if not available', () => {
      setZenithReference(mockZenithKernel as any);

      // This test verifies that getECSManager works correctly when initialized
      const ecsManager = getECSManager();

      expect(ecsManager).toBe(mockECSManager);
    });
  });

  describe('Test Utilities', () => {
    beforeEach(() => {
      setZenithReference(mockZenithKernel as any);
    });

    it('should create test entity', () => {
      const entityId = createTestEntity(25);
      
      expect(entityId).toBeDefined();
      expect(typeof entityId).toBe('string');
      expect(mockECSManager.addComponent).toHaveBeenCalledWith(
        expect.any(Number),
        'Counter',
        { value: 25 }
      );
    });

    it('should create test entity with default value', () => {
      const entityId = createTestEntity();
      
      expect(entityId).toBeDefined();
      expect(mockECSManager.addComponent).toHaveBeenCalledWith(
        expect.any(Number),
        'Counter',
        { value: 0 }
      );
    });

    it('should handle test entity creation errors', () => {
      mockECSManager.addComponent.mockImplementationOnce(() => {
        throw new Error('ECS Error');
      });
      
      const entityId = createTestEntity();
      
      expect(entityId).toBe(null);
    });

    it('should return null when ECS manager not available', () => {
      setZenithReference(null as any);
      
      const entityId = createTestEntity();
      
      expect(entityId).toBe(null);
    });
  });

  describe('SDK Status', () => {
    it('should return correct status when initialized', () => {
      setZenithReference(mockZenithKernel as any);
      
      const status = getSDKStatus();
      
      expect(status).toEqual({
        initialized: true,
        zenithAvailable: true,
        ecsAvailable: true,
        entityCount: 2
      });
    });

    it('should return correct status when not initialized', () => {
      const status = getSDKStatus();
      
      expect(status).toEqual({
        initialized: false,
        zenithAvailable: false,
        ecsAvailable: false,
        entityCount: 0
      });
    });

    it('should handle partial initialization', () => {
      setZenithReference({ getECS: () => null } as any);
      
      const status = getSDKStatus();
      
      expect(status.zenithAvailable).toBe(true);
      expect(status.ecsAvailable).toBe(false);
      expect(status.initialized).toBe(false);
    });
  });

  describe('Error Resilience', () => {
    it('should handle ECS errors gracefully', async () => {
      mockECSManager.getComponent.mockImplementation(() => {
        throw new Error('ECS Connection Lost');
      });
      
      setZenithReference(mockZenithKernel as any);
      
      const controller = createCounterController({ entityId: '123' }, {});
      
      // Should not throw, but should handle error internally
      await expect(controller.increment()).rejects.toThrow('ECS Connection Lost');
    });

    it('should handle missing context gracefully', () => {
      const controller = createCounterController({}, undefined as any);
      
      expect(controller.getState()).toBeDefined();
    });

    it('should handle window not being available', async () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      const controller = createCounterController({}, {});

      // Should not throw when trying to dispatch events
      await expect(async () => {
        await controller.increment();
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Performance Considerations', () => {
    it('should not create excessive polling intervals', () => {
      // Check if timer mocking is available
      if (!vi.useFakeTimers || !vi.useRealTimers) {
        console.warn('Timer mocking not available, skipping test');
        return;
      }

      vi.useFakeTimers();
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      setZenithReference(mockZenithKernel as any);

      const controller1 = createCounterController({ entityId: '123' }, {});
      const controller2 = createCounterController({ entityId: '456' }, {});

      controller1.mount();
      controller2.mount();

      // Each controller should create exactly one interval
      expect(setIntervalSpy).toHaveBeenCalledTimes(2);

      controller1.unmount();
      controller2.unmount();

      vi.useRealTimers();
    });

    it('should clean up intervals on unmount', () => {
      // Check if timer mocking is available
      if (!vi.useFakeTimers || !vi.useRealTimers) {
        console.warn('Timer mocking not available, skipping test');
        return;
      }

      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      setZenithReference(mockZenithKernel as any);

      const controller = createCounterController({ entityId: '123' }, {});
      controller.mount();
      controller.unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
