/**
 * Signals - Reactive state management for ZenithSDK
 * 
 * This module abstracts ZenithKernel's reactivity system into
 * a simpler, Vue-inspired API for component development.
 */

// Import the underlying reactive system
// Note: In practice, this would use ZenithKernel's actual reactive system
import { reactive as _coreReactive, watch as _coreWatch } from '@zenithcore/core/signals';

/**
 * Creates a reactive object that triggers updates when properties change
 */
export function reactive<T extends object>(obj: T): T {
  return _coreReactive(obj);
}

/**
 * Creates a reactive value
 */
export function ref<T>(value: T) {
  const r = reactive({ value });
  return r;
}

/**
 * Creates a computed value that updates when its dependencies change
 */
export function computed<T>(getter: () => T) {
  const result = ref<T>(getter());
  
  watch(getter, (newValue) => {
    result.value = newValue;
  });
  
  return result;
}

/**
 * Watches a value or getter function and runs a callback when it changes
 */
export function watch<T>(
  source: (() => T) | { value: T },
  callback: (newValue: T, oldValue: T) => void,
  options: { immediate?: boolean } = {}
): () => void {
  const getter = typeof source === 'function' ? source : () => source.value;
  let oldValue = getter();
  
  if (options.immediate) {
    callback(oldValue, oldValue);
  }
  
  // Use the underlying watch system or implement polling if not available
  if (typeof _coreWatch === 'function') {
    return _coreWatch(getter, callback);
  } else {
    // Fallback polling implementation
    const interval = setInterval(() => {
      const newValue = getter();
      if (newValue !== oldValue) {
        callback(newValue, oldValue);
        oldValue = newValue;
      }
    }, 100);
    
    return () => clearInterval(interval);
  }
}

/**
 * Batches multiple updates to be processed in a single render cycle
 */
export function batch(fn: () => void): void {
  // In a real implementation, this would batch updates
  fn();
}

/**
 * Pauses reactivity tracking temporarily
 */
export function pauseTracking(): void {
  // In a real implementation, this would pause reactivity tracking
  console.debug('[ZenithSDK] Pausing reactivity tracking');
}

/**
 * Resumes reactivity tracking
 */
export function resumeTracking(): void {
  // In a real implementation, this would resume reactivity tracking
  console.debug('[ZenithSDK] Resuming reactivity tracking');
}
