/**
 * Signals - Reactive state management for ZenithSDK
 * 
 * This module abstracts ZenithKernel's reactivity system into
 * a simpler, Vue-inspired API for component development.
 */

// Import the underlying reactive system
// Note: In practice, this would use ZenithKernel's actual reactive system
import { signal, computed as _coreComputed, effect as _coreEffect, batch as _coreBatch } from '@zenithcore/core';

/**
 * Creates a reactive object that triggers updates when properties change
 */
export function reactive<T extends object>(obj: T): T {
  // For now, return the object as-is since ZenithKernel uses signals differently
  // In a full implementation, this would wrap object properties in signals
  return obj;
}

/**
 * Creates a reactive value
 */
export function ref<T>(value: T) {
  return signal(value);
}

/**
 * Creates a computed value that updates when its dependencies change
 */
export function computed<T>(getter: () => T) {
  return _coreComputed(getter);
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

  // Use ZenithKernel's effect system to watch for changes
  const computation = _coreEffect(() => {
    const newValue = getter();
    if (newValue !== oldValue) {
      callback(newValue, oldValue);
      oldValue = newValue;
    }
  });

  return () => computation.dispose();
}

/**
 * Batches multiple updates to be processed in a single render cycle
 */
export function batch(fn: () => void): void {
  return _coreBatch(fn);
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
