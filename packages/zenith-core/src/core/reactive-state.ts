/**
 * Reactive State Management System for Zenith Framework
 *
 * Provides useState and ref() functionality for dynamic variables
 * with automatic DOM updates and ECS integration.
 */

import { ECSManager } from './ECSManager';

// Global state management
let currentComponent: ComponentInstance | null = null;
let hookIndex = 0;
const componentInstances = new WeakMap<HTMLElement, ComponentInstance>();

export interface ComponentInstance {
  element: HTMLElement;
  hooks: Hook[];
  ecsEntity?: number;
  ecsManager?: ECSManager;
  isHydrated: boolean;
  updateQueue: Set<() => void>;
  isUpdating: boolean;
}

interface Hook {
  type: 'state' | 'ref' | 'effect' | 'memo';
  value: any;
  deps?: any[];
  cleanup?: () => void;
}

interface StateHook<T> extends Hook {
  type: 'state';
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => void;
  subscribers: Set<() => void>;
}

interface RefHook<T> extends Hook {
  type: 'ref';
  value: { current: T };
}

interface EffectHook extends Hook {
  type: 'effect';
  value: () => void | (() => void);
  deps: any[];
  cleanup?: () => void;
}

/**
 * useState hook for reactive state management
 */
export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prev: T) => T)) => void] {
  if (!currentComponent) {
    throw new Error('useState can only be called inside a component');
  }

  const component = currentComponent;
  const index = hookIndex++;

  // Initialize hook if it doesn't exist
  if (!component.hooks[index]) {
    const value = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;

    const hook: StateHook<T> = {
      type: 'state',
      value,
      setValue: (newValue: T | ((prev: T) => T)) => {
        const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(hook.value) : newValue;

        if (hook.value !== nextValue) {
          hook.value = nextValue;

          // Schedule component update
          scheduleUpdate(component);

          // Notify subscribers
          hook.subscribers.forEach(subscriber => subscriber());

          // Update ECS if connected
          if (component.ecsEntity && component.ecsManager) {
            component.ecsManager.addComponent(component.ecsEntity, 'ReactiveState', {
              hookIndex: index,
              value: nextValue,
              timestamp: Date.now()
            });
          }
        }
      },
      subscribers: new Set()
    };

    component.hooks[index] = hook;
  }

  const hook = component.hooks[index] as StateHook<T>;
  return [hook.value, hook.setValue];
}

/**
 * useRef hook for mutable references
 */
export function useRef<T>(initialValue: T): { current: T } {
  if (!currentComponent) {
    throw new Error('useRef can only be called inside a component');
  }

  const component = currentComponent;
  const index = hookIndex++;

  // Initialize hook if it doesn't exist
  if (!component.hooks[index]) {
    const hook: RefHook<T> = {
      type: 'ref',
      value: { current: initialValue }
    };
    component.hooks[index] = hook;
  }

  const hook = component.hooks[index] as RefHook<T>;
  return hook.value;
}

/**
 * useEffect hook for side effects
 */
export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  if (!currentComponent) {
    throw new Error('useEffect can only be called inside a component');
  }

  const component = currentComponent;
  const index = hookIndex++;

  // Initialize hook if it doesn't exist
  if (!component.hooks[index]) {
    const hook: EffectHook = {
      type: 'effect',
      value: effect,
      deps: deps || []
    };
    component.hooks[index] = hook;

    // Run effect immediately
    scheduleEffect(hook);
  } else {
    const hook = component.hooks[index] as EffectHook;

    // Check if dependencies changed
    const depsChanged = !deps || !hook.deps ||
      deps.length !== hook.deps.length ||
      deps.some((dep, i) => dep !== hook.deps![i]);

    if (depsChanged) {
      // Cleanup previous effect
      if (hook.cleanup) {
        hook.cleanup();
      }

      hook.value = effect;
      hook.deps = deps || [];

      // Schedule new effect
      scheduleEffect(hook);
    }
  }
}

/**
 * useMemo hook for memoized values
 */
export function useMemo<T>(factory: () => T, deps: any[]): T {
  if (!currentComponent) {
    throw new Error('useMemo can only be called inside a component');
  }

  const component = currentComponent;
  const index = hookIndex++;

  // Initialize hook if it doesn't exist
  if (!component.hooks[index]) {
    const hook = {
      type: 'memo' as const,
      value: factory(),
      deps
    };
    component.hooks[index] = hook;
  } else {
    const hook = component.hooks[index];

    // Check if dependencies changed
    const depsChanged = !hook.deps ||
      deps.length !== hook.deps.length ||
      deps.some((dep, i) => dep !== hook.deps![i]);

    if (depsChanged) {
      hook.value = factory();
      hook.deps = deps;
    }
  }

  return component.hooks[index].value;
}

/**
 * useCallback hook for memoized callbacks
 */
export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  return useMemo(() => callback, deps);
}

/**
 * Initialize a component instance for reactive state management
 */
export function initializeComponent(element: HTMLElement, ecsEntity?: number, ecsManager?: ECSManager): ComponentInstance {
  const component: ComponentInstance = {
    element,
    hooks: [],
    ecsEntity,
    ecsManager,
    isHydrated: false,
    updateQueue: new Set(),
    isUpdating: false
  };

  componentInstances.set(element, component);
  return component;
}

/**
 * Run a function within a component context
 */
export function withComponent<T>(component: ComponentInstance, fn: () => T): T {
  const prevComponent = currentComponent;
  const prevHookIndex = hookIndex;

  currentComponent = component;
  hookIndex = 0;

  try {
    return fn();
  } finally {
    currentComponent = prevComponent;
    hookIndex = prevHookIndex;
  }
}

/**
 * Get component instance for an element
 */
export function getComponentInstance(element: HTMLElement): ComponentInstance | undefined {
  return componentInstances.get(element);
}

/**
 * Schedule a component update
 */
function scheduleUpdate(component: ComponentInstance): void {
  if (component.isUpdating) return;

  // Use requestAnimationFrame for batched updates
  requestAnimationFrame(() => {
    if (component.updateQueue.size === 0) return;

    component.isUpdating = true;

    try {
      // Execute all queued updates
      component.updateQueue.forEach(update => update());
      component.updateQueue.clear();

      // Trigger re-render if component has a render function
      triggerRerender(component);
    } finally {
      component.isUpdating = false;
    }
  });
}

/**
 * Schedule an effect to run
 */
function scheduleEffect(hook: EffectHook): void {
  // Run effects after the current execution
  setTimeout(() => {
    const cleanup = hook.value();
    if (typeof cleanup === 'function') {
      hook.cleanup = cleanup;
    }
  }, 0);
}

/**
 * Trigger a re-render of the component
 */
function triggerRerender(component: ComponentInstance): void {
  // Emit custom event for re-render
  const event = new CustomEvent('zenith:rerender', {
    detail: { component }
  });
  component.element.dispatchEvent(event);
}

/**
 * Cleanup component instance
 */
export function cleanupComponent(element: HTMLElement): void {
  const component = componentInstances.get(element);
  if (!component) return;

  // Cleanup all effects
  component.hooks.forEach(hook => {
    if (hook.type === 'effect' && hook.cleanup) {
      hook.cleanup();
    }
  });

  componentInstances.delete(element);
}

/**
 * Create a reactive DOM element with state management
 */
export function createReactiveElement<T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  props: Partial<HTMLElementTagNameMap[T]> & {
    ecsEntity?: number;
    ecsManager?: ECSManager;
  } = {}
): HTMLElementTagNameMap[T] {
  const element = document.createElement(tagName);
  const { ecsEntity, ecsManager, ...domProps } = props;

  // Apply DOM properties
  Object.assign(element, domProps);

  // Initialize component instance
  const component = initializeComponent(element, ecsEntity, ecsManager);

  // Add cleanup listener
  element.addEventListener('zenith:cleanup', () => {
    cleanupComponent(element);
  });

  return element;
}

/**
 * Bind reactive state to DOM element attributes
 */
export function bindStateToAttribute<T>(
  element: HTMLElement,
  attribute: string,
  stateGetter: () => T,
  transform?: (value: T) => string
): () => void {
  const update = () => {
    const value = stateGetter();
    const stringValue = transform ? transform(value) : String(value);
    element.setAttribute(attribute, stringValue);
  };

  // Initial update
  update();

  // Return cleanup function
  return update;
}

/**
 * Bind reactive state to DOM element text content
 */
export function bindStateToText<T>(
  element: HTMLElement,
  stateGetter: () => T,
  transform?: (value: T) => string
): () => void {
  const update = () => {
    const value = stateGetter();
    const stringValue = transform ? transform(value) : String(value);
    element.textContent = stringValue;
  };

  // Initial update
  update();

  return update;
}

/**
 * Bind reactive state to DOM element class attribute with Vue-style class binding
 */
export function bindStateToClass(
  element: HTMLElement,
  stateGetter: () => string | string[] | Record<string, boolean> | (() => string | string[] | Record<string, boolean>)
): () => void {
  const update = () => {
    const value = typeof stateGetter === 'function' ? stateGetter() : stateGetter;

    if (typeof value === 'string') {
      // Simple string class
      element.className = value;
    } else if (Array.isArray(value)) {
      // Array of class names
      element.className = value.filter(Boolean).join(' ');
    } else if (value && typeof value === 'object') {
      // Object with conditional classes { 'class-name': boolean }
      const classes: string[] = [];
      for (const [className, condition] of Object.entries(value)) {
        if (condition) {
          classes.push(className);
        }
      }
      element.className = classes.join(' ');
    } else {
      element.className = String(value || '');
    }
  };

  // Initial update
  update();

  return update;
}

/**
 * Bind reactive state to DOM element style attribute with Vue-style style binding
 */
export function bindStateToStyle(
  element: HTMLElement,
  stateGetter: () => string | Record<string, string | number> | (() => string | Record<string, string | number>)
): () => void {
  const update = () => {
    const value = typeof stateGetter === 'function' ? stateGetter() : stateGetter;

    if (typeof value === 'string') {
      // CSS string
      element.setAttribute('style', value);
    } else if (value && typeof value === 'object') {
      // Style object { property: value }
      for (const [property, styleValue] of Object.entries(value)) {
        if (styleValue != null) {
          // Convert camelCase to kebab-case for CSS properties
          const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
          element.style.setProperty(cssProperty, String(styleValue));
        } else {
          // Remove property if value is null/undefined
          const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
          element.style.removeProperty(cssProperty);
        }
      }
    } else {
      // Clear all styles
      element.removeAttribute('style');
    }
  };

  // Initial update
  update();

  return update;
}

/**
 * Create a computed value that automatically updates
 */
export function computed<T>(fn: () => T): () => T {
  let cachedValue: T;
  let isValid = false;

  return () => {
    if (!isValid) {
      cachedValue = fn();
      isValid = true;
    }
    return cachedValue;
  };
}

// Export convenience functions
export { useState as state, useRef as ref };

// Export types
export type { ComponentInstance, StateHook, RefHook, EffectHook };
