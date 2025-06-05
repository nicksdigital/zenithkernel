/**
 * Custom JSX Runtime for ZenithKernel Islands Architecture
 *
 * This provides a lightweight JSX implementation that bypasses React's runtime
 * and directly creates DOM elements for efficient island hydration.
 */

export namespace JSX {
  export interface IntrinsicElements {
    [elemName: string]: any; // Allow any HTML element and custom attributes
    template: {
      children?: Children;
      'data-hydra-type'?: string;
      'data-hydra-id'?: string;
      'data-hydra-entry'?: string;
      'data-hydra-exec-type'?: 'local' | 'remote' | 'edge';
      'data-hydra-context'?: string;
    };
    Hydra: {
      type: 'island';
      id?: string;
      entry?: string;
      execType?: 'local' | 'remote' | 'edge';
      context?: Record<string, any>;
      children?: Children;
    };
    meta: {
      title?: string;
      layout?: string;
      description?: string;
      keywords?: string[];
      author?: string;
      viewport?: string;
      'og:title'?: string;
      'og:description'?: string;
      'og:image'?: string;
      'og:type'?: string;
      children?: Children;
    };
    safeScript: {
      type: 'on_load' | 'on_before_load' | 'lifecycle_id';
      src?: string;
      integrity?: string;
      crossorigin?: string;
      nonce?: string;
      async?: boolean;
      defer?: boolean;
      children?: string;
    };
    css: {
      href?: string;
      media?: string;
      integrity?: string;
      crossorigin?: string;
      children?: string;
    };
  }
  export interface ElementChildrenAttribute {
    children?: {};
  }
}

type Child = HTMLElement | DocumentFragment | string | number | boolean | null | undefined;
type Children = Child | Child[];

interface Attributes {
  [key: string]: any;
  children?: Children;
}

// Import enhanced reactive state management
import {
  useState as reactiveUseState,
  useRef as reactiveUseRef,
  useEffect,
  useMemo,
  useCallback,
  initializeComponent,
  withComponent,
  cleanupComponent,
  bindStateToAttribute,
  bindStateToText,
  bindStateToClass,
  bindStateToStyle,
  type ComponentInstance
} from '../../../../src/core/reactive-state';

// Re-export reactive hooks for convenience
export {
  reactiveUseState as useState,
  reactiveUseRef as useRef,
  useEffect,
  useMemo,
  useCallback
};

// Legacy simple state management for backward compatibility
type StateSubscriber<T> = (value: T) => void;

class LegacyState<T> {
  private value: T;
  private subscribers: Set<StateSubscriber<T>> = new Set();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T) {
    this.value = newValue;
    this.notifySubscribers();
  }

  subscribe(callback: StateSubscriber<T>) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(subscriber => subscriber(this.value));
  }
}

export function legacyUseState<T>(initialValue: T): [() => T, (value: T) => void] {
  const state = new LegacyState(initialValue);
  return [() => state.get(), (value: T) => state.set(value)];
}

/**
 * Create a reactive functional component
 */
function createReactiveComponent(
  Component: (props: any) => HTMLElement | DocumentFragment,
  props: any
): HTMLElement | DocumentFragment {
  const { ecsEntity, ecsManager, ...componentProps } = props;

  // Create a wrapper element for the component
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-reactive-component', 'true');

  // Initialize component instance
  const componentInstance = initializeComponent(wrapper, ecsEntity, ecsManager);

  // Render the component within the reactive context
  const result = withComponent(componentInstance, () => {
    return Component(componentProps);
  });

  // If result is a DocumentFragment, append its children to wrapper
  if (result instanceof DocumentFragment) {
    wrapper.appendChild(result);
  } else if (result instanceof HTMLElement) {
    // If result is an element, replace wrapper with it
    const resultElement = result;

    // Transfer reactive component data
    resultElement.setAttribute('data-reactive-component', 'true');

    // Update component instance to use the actual element
    cleanupComponent(wrapper);
    const newInstance = initializeComponent(resultElement, ecsEntity, ecsManager);
    // Copy hooks from old instance
    newInstance.hooks = componentInstance.hooks;

    return resultElement;
  }

  return wrapper;
}

/**
 * Create a meta element with proper attributes
 */
function createMetaElement(props: Attributes): HTMLElement {
  const metaContainer = document.createElement('div');
  metaContainer.setAttribute('data-hydra-meta', 'true');

  // Handle standard meta tags
  const standardMeta = ['title', 'description', 'author', 'viewport'];
  standardMeta.forEach(name => {
    if (props[name]) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', name);
      meta.setAttribute('content', String(props[name]));
      metaContainer.appendChild(meta);
    }
  });

  // Handle OpenGraph meta tags
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('og:')) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', key);
      meta.setAttribute('content', String(value));
      metaContainer.appendChild(meta);
    }
  });

  // Handle keywords as array
  if (props.keywords && Array.isArray(props.keywords)) {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'keywords');
    meta.setAttribute('content', props.keywords.join(', '));
    metaContainer.appendChild(meta);
  }

  // Handle layout
  if (props.layout) {
    metaContainer.setAttribute('data-hydra-layout', String(props.layout));
  }

  return metaContainer;
}

/**
 * Create a safe script element with security attributes
 */
function createSafeScriptElement(props: Attributes): HTMLElement {
  const script = document.createElement('script');
  script.setAttribute('data-hydra-script-type', String(props.type));

  // Set security attributes
  if (props.integrity) script.setAttribute('integrity', String(props.integrity));
  if (props.crossorigin) script.setAttribute('crossorigin', String(props.crossorigin));
  if (props.nonce) script.setAttribute('nonce', String(props.nonce));
  if (props.async) script.setAttribute('async', '');
  if (props.defer) script.setAttribute('defer', '');

  // Handle source or inline script
  if (props.src) {
    script.setAttribute('src', String(props.src));
  } else if (props.children) {
    script.textContent = String(props.children);
  }

  return script;
}

/**
 * Create a CSS element with proper attributes
 */
function createCssElement(props: Attributes): HTMLElement {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');

  if (props.href) link.setAttribute('href', props.href);
  if (props.media) link.setAttribute('media', props.media);
  if (props.integrity) link.setAttribute('integrity', props.integrity);
  if (props.crossorigin) link.setAttribute('crossorigin', props.crossorigin);

  // Handle inline styles
  if (props.children) {
    const style = document.createElement('style');
    style.textContent = props.children as string;
    return style;
  }

  return link;
}

/**
 * Special handling for Hydra island components
 */
function createHydraIsland(props: Attributes): HTMLElement {
  const { type, id, entry, execType, context, children } = props;

  if (type !== 'island') {
    throw new Error('Hydra component must have type="island"');
  }

  const template = document.createElement('template');
  template.setAttribute('data-hydra-type', 'island');

  if (id) template.setAttribute('data-hydra-id', id);
  if (entry) template.setAttribute('data-hydra-entry', entry);
  if (execType) template.setAttribute('data-hydra-exec-type', execType);
  if (context) {
    template.setAttribute('data-hydra-context', JSON.stringify(context));
  }

  if (children) {
    appendChildren(template.content, children);
  }

  return template;
}

/**
 * JSX factory function for creating DOM elements
 * Handles both HTML elements and functional components
 */
export function jsx(
    type: string | ((props: any) => HTMLElement | DocumentFragment), _p0: null, _p1: string, props: Attributes, _key?: string): HTMLElement | DocumentFragment {
  const { children, reactive, ecsEntity, ecsManager, ...restProps } = props || {};

  // Handle special components
  if (type === 'Hydra') {
    return createHydraIsland(props);
  } else if (type === 'meta') {
    return createMetaElement(props);
  } else if (type === 'safeScript') {
    return createSafeScriptElement(props);
  } else if (type === 'css') {
    return createCssElement(props);
  }

  // Handle functional components
  if (typeof type === 'function') {
    // Check if this is a reactive component
    if (reactive || ecsEntity || ecsManager) {
      return createReactiveComponent(type, { ...restProps, children, ecsEntity, ecsManager });
    }
    return type({ ...restProps, children });
  }

  // Create HTML element
  const element = document.createElement(type as string);

  // Initialize reactive state if requested
  let componentInstance: ComponentInstance | undefined;
  if (reactive || ecsEntity || ecsManager) {
    componentInstance = initializeComponent(element, ecsEntity, ecsManager);
  }

  // Set attributes and event listeners
  let refCallback: ((el: HTMLElement) => void) | undefined;
  const stateBindings: Array<() => void> = [];

  for (const [key, value] of Object.entries(restProps)) {
    if (key.startsWith('on') && typeof value === 'function') {
      // Convert onXxx to xxx event listener
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'className' || key === 'class') {
      // Handle reactive class names
      if (typeof value === 'function' && componentInstance) {
        const binding = bindStateToAttribute(element, 'class', value);
        stateBindings.push(binding);
      } else {
        element.className = value;
      }
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'ref') {
      if (typeof value === 'function') {
        // Defer ref callback until after children are set
        refCallback = value;
      } else if (value && typeof value === 'object' && 'current' in value) {
        // Handle useRef objects
        refCallback = (el) => { value.current = el; };
      }
    } else if (key.startsWith(':')) {
      // Handle reactive attribute bindings (:attribute={stateGetter}) - Vue style
      const attributeName = key.substring(1);

      if (typeof value === 'function' && componentInstance) {
        // Special handling for class and style
        if (attributeName === 'class' || attributeName === 'className') {
          const binding = bindStateToClass(element, value);
          stateBindings.push(binding);
        } else if (attributeName === 'style') {
          const binding = bindStateToStyle(element, value);
          stateBindings.push(binding);
        } else {
          const binding = bindStateToAttribute(element, attributeName, value);
          stateBindings.push(binding);
        }
      } else if (componentInstance) {
        // Handle static reactive bindings (:attribute="value")
        if (attributeName === 'class' || attributeName === 'className') {
          element.className = String(value);
        } else if (attributeName === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else {
          element.setAttribute(attributeName, String(value));
        }
      }
    } else if (key === 'textContent' && typeof value === 'function' && componentInstance) {
      // Handle reactive text content
      const binding = bindStateToText(element, value);
      stateBindings.push(binding);
    } else if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(key, ''); // Boolean attributes like 'checked', 'disabled'
      } else {
        element.removeAttribute(key);
      }
    } else if (value != null) {
      element.setAttribute(key, String(value));
    }
  }

  // Store state bindings for cleanup
  if (componentInstance && stateBindings.length > 0) {
    (element as any).__stateBindings = stateBindings;
  }

  // Append children (flattened)
  appendChildren(element, Array.isArray(children) ? children.flat(Infinity) : children);

  // Call ref callback after all attributes and children are set
  if (refCallback) refCallback(element);

  return element;
}

/**
 * JSX factory for elements with multiple children (optimization)
 */
export const jsxs = jsx;

/**
 * Fragment component for grouping elements without wrapper
 */
export function Fragment(props: { children?: Children }): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (props.children) {
    appendChildren(fragment, props.children);
  }
  return fragment;
}

/**
 * Helper function to append children to a parent element
 */
function appendChildren(parent: HTMLElement | DocumentFragment, children: Children) {
  if (Array.isArray(children)) {
    children.forEach(child => appendChildren(parent, child));
  } else if (children instanceof Node) {
    parent.appendChild(children);
  } else if (typeof children === 'string' || typeof children === 'number') {
    parent.appendChild(document.createTextNode(String(children)));
  }
  // null, undefined, or boolean children are ignored (standard JSX behavior)
}

/**
 * Helper function to create element from JSX (for compatibility)
 */
export function createElement(
  type: string | ((props: any) => HTMLElement | DocumentFragment),
  props: Attributes | null,
  ...children: Children[]
): HTMLElement | DocumentFragment {
  return jsx(type, { ...props, children: children.flat() });
}

/**
 * Legacy JSX factory function (h) for older configurations
 */
export function h(
  type: string | ((props: any) => HTMLElement | DocumentFragment),
  props: Attributes | null,
  ...children: Children[]
): HTMLElement | DocumentFragment {
  return jsx(type, { ...props, children: children.flat() });
}
