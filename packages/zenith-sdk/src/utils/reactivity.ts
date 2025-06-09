/**
 * Reactivity utilities for ZenithSDK
 * 
 * Provides helper functions for working with reactive state
 */

import { ref, reactive, computed, watch } from '../core/signals';

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      lastCall = now;
      return fn(...args);
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeout = null;
      }, wait - timeSinceLastCall);
    }
  };
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after wait milliseconds have elapsed since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Creates a reactive object that syncs its state with localStorage
 */
export function persistedState<T extends Record<string, any>>(
  key: string,
  defaultValue: T
): T {
  // Load initial state from localStorage if available
  let savedState: T | null = null;
  
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        savedState = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading persisted state:', e);
    }
  }
  
  // Create reactive state with default values or saved state
  const state = reactive({
    ...defaultValue,
    ...(savedState || {})
  }) as T;
  
  // Set up watcher to save changes to localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    watch(
      () => JSON.stringify(state),
      (newValue) => {
        try {
          window.localStorage.setItem(key, newValue);
        } catch (e) {
          console.error('Error saving persisted state:', e);
        }
      }
    );
  }
  
  return state;
}
