/**
 * Tests for Enhanced Signals System
 */

import {
  signal,
  computed,
  effect,
  asyncSignal,
  batch,
  untrack,
  setDebugMode,
  resolve,
  isSignal,
  derived,
  combine,
  fromPromise,
  SignalError
} from '../signals';

describe('Enhanced Signals System', () => {
  beforeEach(() => {
    setDebugMode(false); // Disable debug for tests
  });

  describe('Basic Signal Functionality', () => {
    test('creates and updates signals', () => {
      const count = signal(0);
      expect(count.value).toBe(0);

      count.value = 5;
      expect(count.value).toBe(5);
    });

    test('tracks signal metadata', () => {
      const count = signal(0, { name: 'counter' });
      
      expect(count.name).toBe('counter');
      expect(count.id).toBeGreaterThan(0);
      expect(count.subscriberCount).toBe(0);
      expect(count.accessCount).toBe(0);
      expect(count.updateCount).toBe(0);
      
      count.value; // Access
      expect(count.accessCount).toBe(1);
      
      count.value = 1; // Update
      expect(count.updateCount).toBe(1);
    });

    test('prevents access to disposed signals', () => {
      const count = signal(0);
      count.dispose();
      
      expect(() => count.value).toThrow(SignalError);
      expect(() => { count.value = 1; }).toThrow(SignalError);
    });

    test('uses custom equality function', () => {
      const obj = signal({ x: 1, y: 2 }, {
        equals: (a, b) => a.x === b.x && a.y === b.y
      });
      
      let updateCount = 0;
      effect(() => {
        obj.value;
        updateCount++;
      });
      
      obj.value = { x: 1, y: 2 }; // Same values
      expect(updateCount).toBe(1); // Should not trigger update
      
      obj.value = { x: 2, y: 2 }; // Different values
      expect(updateCount).toBe(2); // Should trigger update
    });
  });

  describe('Computed Signals', () => {
    test('automatically updates computed values', () => {
      const count = signal(0);
      const doubled = computed(() => count.value * 2);
      
      expect(doubled.value).toBe(0);
      
      count.value = 5;
      expect(doubled.value).toBe(10);
    });

    test('throws error when trying to set computed value', () => {
      const count = signal(0);
      const doubled = computed(() => count.value * 2);
      
      expect(() => { doubled.value = 10; }).toThrow();
    });

    test('disposes computed signals properly', () => {
      const count = signal(0);
      const doubled = computed(() => count.value * 2);
      
      expect(count.subscriberCount).toBe(1);
      
      doubled.dispose();
      expect(count.subscriberCount).toBe(0);
    });
  });

  describe('Effects', () => {
    test('runs effects when dependencies change', () => {
      const count = signal(0);
      let effectCount = 0;
      
      effect(() => {
        count.value;
        effectCount++;
      });
      
      expect(effectCount).toBe(1); // Initial run
      
      count.value = 1;
      expect(effectCount).toBe(2);
    });

    test('handles effect cleanup', () => {
      const count = signal(0);
      let cleanupCalled = false;
      
      const comp = effect(() => {
        count.value;
        return () => { cleanupCalled = true; };
      });
      
      count.value = 1; // Should call cleanup before re-running
      expect(cleanupCalled).toBe(true);
      
      comp.dispose();
    });

    test('prevents infinite loops in effects', () => {
      const count = signal(0);
      
      const comp = effect(() => {
        if (count.value < 5) {
          count.value++; // This could cause infinite loop without protection
        }
      });
      
      expect(count.value).toBe(5);
      comp.dispose();
    });
  });

  describe('Async Signals', () => {
    test('handles async loading', async () => {
      const asyncData = asyncSignal(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'loaded data';
      }, { initialState: 'loading' });
      
      expect(asyncData.loading).toBe(true);
      expect(asyncData.value).toBeUndefined();
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(asyncData.loading).toBe(false);
      expect(asyncData.value).toBe('loaded data');
      expect(asyncData.isSuccess).toBe(true);
    });

    test('handles async errors with retry', async () => {
      let attempts = 0;
      const asyncData = asyncSignal(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      }, { 
        initialState: 'loading',
        retryCount: 2,
        retryDelay: 10
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(attempts).toBe(3);
      expect(asyncData.value).toBe('success');
      expect(asyncData.isSuccess).toBe(true);
    });

    test('handles timeout', async () => {
      const asyncData = asyncSignal(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'data';
      }, { 
        timeout: 50,
        initialState: 'loading'
      });
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(asyncData.loading).toBe(false);
      expect(asyncData.error).toBeTruthy();
      expect(asyncData.error?.message).toContain('Timeout');
    });
  });

  describe('Batching and Scheduling', () => {
    test('batches multiple updates', () => {
      const count1 = signal(0);
      const count2 = signal(0);
      let effectRuns = 0;
      
      effect(() => {
        count1.value + count2.value;
        effectRuns++;
      });
      
      expect(effectRuns).toBe(1); // Initial run
      
      batch(() => {
        count1.value = 1;
        count2.value = 2;
      });
      
      expect(effectRuns).toBe(2); // Should only run once more despite two updates
    });

    test('supports nested batching', () => {
      const count = signal(0);
      let effectRuns = 0;
      
      effect(() => {
        count.value;
        effectRuns++;
      });
      
      batch(() => {
        count.value = 1;
        batch(() => {
          count.value = 2;
        });
        count.value = 3;
      });
      
      expect(effectRuns).toBe(2); // Initial + batched
      expect(count.value).toBe(3);
    });
  });

  describe('Utility Functions', () => {
    test('untrack prevents dependency tracking', () => {
      const count = signal(0);
      const derived = computed(() => {
        return untrack(() => count.value) + 10; // Should not track count
      });
      
      expect(derived.value).toBe(10);
      expect(count.subscriberCount).toBe(0); // No dependency tracked
      
      count.value = 5;
      expect(derived.value).toBe(10); // Should not update
    });

    test('resolve unwraps signals', () => {
      const count = signal(5);
      
      expect(resolve(count)).toBe(5);
      expect(resolve(10)).toBe(10);
    });

    test('isSignal identifies signals', () => {
      const count = signal(0);
      
      expect(isSignal(count)).toBe(true);
      expect(isSignal(5)).toBe(false);
      expect(isSignal({})).toBe(false);
    });

    test('derived creates derived signals', () => {
      const count = signal(0);
      const doubled = derived(count, x => x * 2);
      
      expect(doubled.value).toBe(0);
      
      count.value = 5;
      expect(doubled.value).toBe(10);
    });

    test('combine merges multiple signals', () => {
      const a = signal(1);
      const b = signal(2);
      const c = signal(3);
      
      const combined = combine([a, b, c]);
      
      expect(combined.value).toEqual([1, 2, 3]);
      
      a.value = 10;
      expect(combined.value).toEqual([10, 2, 3]);
    });

    test('fromPromise creates async signal from promise', async () => {
      const promise = Promise.resolve('test data');
      const sig = fromPromise(promise);
      
      expect(sig.loading).toBe(true);
      
      await promise;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(sig.loading).toBe(false);
      expect(sig.value).toBe('test data');
    });
  });

  describe('Signal Utility Methods', () => {
    test('map transforms signal values', () => {
      const count = signal(5);
      const doubled = count.map(x => x * 2);
      
      expect(doubled.value).toBe(10);
      
      count.value = 10;
      expect(doubled.value).toBe(20);
    });

    test('filter conditionally passes values', () => {
      const count = signal(5);
      const evenOnly = count.filter(x => x % 2 === 0);
      
      expect(evenOnly.value).toBeUndefined(); // 5 is odd
      
      count.value = 6;
      expect(evenOnly.value).toBe(6); // 6 is even
      
      count.value = 7;
      expect(evenOnly.value).toBeUndefined(); // 7 is odd
    });
  });

  describe('Error Handling', () => {
    test('handles errors in effects gracefully', () => {
      const count = signal(0);
      const errors: Error[] = [];
      
      effect(() => {
        if (count.value > 5) {
          throw new Error('Too big!');
        }
      }, {
        errorHandler: (error: Error) => errors.push(error)
      } as any);
      
      count.value = 10;
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Too big!');
    });

    test('handles errors in signal updates', () => {
      const errors: Error[] = [];
      const count = signal(0, {
        errorHandler: (error) => errors.push(error)
      });
      
      // Simulate ECS error by providing invalid ECS manager
      (count as any)._ecsManager = {
        addComponent: () => { throw new Error('ECS Error'); }
      };
      (count as any)._ecsEntity = 1;
      
      count.value = 5; // Should trigger error in ECS update
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('ECS Error');
    });
  });
});
