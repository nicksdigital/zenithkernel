
import {
  useState as reactiveUseState,
  useRef as reactiveUseRef,
  useEffect,
  useMemo,
  useCallback,
  initializeComponent,
  withComponent,
  getComponentInstance,
  cleanupComponent,
  bindStateToAttribute,
  bindStateToText,
  bindStateToClass,
  bindStateToStyle,
  type ComponentInstance
} from '../../core/reactive-state';

// Import signal system for enhanced reactivity
import {
  Signal,
  signal,
  computed,
  effect,
  isSignal,
  resolve,
  type MaybeSignal
} from '../../core/signals';

// Import SignalManager for coordinated reactivity
import {getSignalManager, SignalManager} from '../../core/SignalManager';
import { H } from 'vitest/dist/chunks/environment.d.Dmw5ulng';


export {
  reactiveUseState as useState,
  reactiveUseRef as useRef,
  useEffect,
  useMemo,
  useCallback,
  // Signal exports
  signal,
  computed,
  effect,
  isSignal,
  resolve
};

// Enhanced reactive attribute types
type ReactiveValue<T> = T | Signal<T> | (() => T);
type ReactiveClass = ReactiveValue<string | string[] | Record<string, boolean>>;
type ReactiveStyle = ReactiveValue<string | Record<string, string | number>>;
type ReactiveAttribute<T> = ReactiveValue<T>;

interface Attributes {
  [key: string]: any;

  children?: Children;
  // Enhanced reactive attributes
  signal?: boolean; // Enable signal-based reactivity
  signalId?: string; // Signal namespace ID
  hydraId?: string; // Hydra component ID for context
  // Reactive attribute prefixes
  $class?: ReactiveClass;
  $style?: ReactiveStyle;
  $textContent?: ReactiveValue<string | number>;
  $innerHTML?: ReactiveValue<string>;

  // Generic reactive attributes with $ prefix
  [K: `$${string}`]: ReactiveAttribute<any>;
}

/**
 * Create a signal-based reactive component with SignalManager integration
 */
function createSignalReactiveComponent(
    Component: (props: any) => HTMLElement | DocumentFragment,
    props: any
): HTMLElement | DocumentFragment {
  const {ecsEntity, ecsManager, signalId, hydraId, signal: enableSignals, ...componentProps} = props;
  const signalManager = getSignalManager();

  // Create wrapper element
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-signal-component', 'true');
  if (signalId) wrapper.setAttribute('data-signal-id', signalId);
  if (hydraId) wrapper.setAttribute('data-hydra-id', hydraId);

  // Create or get Hydra context for signal management
  let hydraContext;
  if (hydraId) {
    try {
      hydraContext = signalManager.createHydraContext(hydraId);
    } catch {
      // Context already exists, get signals
      hydraContext = {signals: signalManager.getHydraSignals(hydraId)};
    }
  }

  // Initialize legacy component instance for backward compatibility
  const componentInstance = initializeComponent(wrapper, ecsEntity, ecsManager);

  // Render component with signal context
  const result = withComponent(componentInstance, () => {
    return Component(componentProps);
  });

  // Handle result and apply signal reactivity
  let targetElement: HTMLElement;
  if (result instanceof DocumentFragment) {
    wrapper.appendChild(result);
    targetElement = wrapper;
  } else if (result instanceof HTMLElement) {
    targetElement = result;
    targetElement.setAttribute('data-signal-component', 'true');
    if (signalId) targetElement.setAttribute('data-signal-id', signalId);
    if (hydraId) targetElement.setAttribute('data-hydra-id', hydraId);
  } else {
    targetElement = wrapper;
  }

  // Setup cleanup for signals when component unmounts
  const cleanup = () => {
    if (hydraId) {
      signalManager.cleanupHydraContext(hydraId);
    }
    cleanupComponent(targetElement);
  };

  // Store cleanup function
  (targetElement as any).__signalCleanup = cleanup;

  return targetElement;
}

/**
 * Enhanced reactive binding using signals
 */
function createSignalBinding<T>(
    element: HTMLElement,
    property: string,
    value: ReactiveValue<T>,
    transform?: (val: T) => string
): () => void {
  const signalManager = getSignalManager();
  const bindingId = `${element.tagName.toLowerCase()}-${property}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (isSignal(value)) {
    // Direct signal binding
    signalManager.bindToDOM(bindingId, element, property, value as Signal<T>, transform);
    return () => signalManager.removeDOMBinding(bindingId);
  } else if (typeof value === 'function') {
    // Create computed signal from function
    const computedSig = computed(value as () => T);
    signalManager.bindToDOM(bindingId, element, property, computedSig, transform);
    return () => {
      signalManager.removeDOMBinding(bindingId);
      computedSig.dispose();
    };
  } else {
    // Static value - set immediately
    const stringValue = transform ? transform(value as T) : String(value);
    if (property === 'textContent' || property === 'innerHTML') {
      (element as any)[property] = stringValue;
    } else {
      element.setAttribute(property, stringValue);
    }
    return () => {
    }; // No cleanup needed for static values
  }
}

/**
 * Enhanced class binding with signal support
 */
function createSignalClassBinding(
    element: HTMLElement,
    value: ReactiveClass
): () => void {
  const signalManager = getSignalManager();
  const bindingId = `${element.tagName.toLowerCase()}-class-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (isSignal(value)) {
    signalManager.bindClassList(bindingId, element, value as Signal<any>);
    return () => signalManager.removeDOMBinding(bindingId);
  } else if (typeof value === 'function') {
    const computedSig = computed(value as () => any);
    signalManager.bindClassList(bindingId, element, computedSig);
    return () => {
      signalManager.removeDOMBinding(bindingId);
      computedSig.dispose();
    };
  } else {
    // Static class value
    if (typeof value === 'string') {
      element.className = value;
    } else if (Array.isArray(value)) {
      element.className = value.filter(Boolean).join(' ');
    } else if (value && typeof value === 'object') {
      const classes: string[] = [];
      for (const [className, condition] of Object.entries(value)) {
        if (condition) classes.push(className);
      }
      element.className = classes.join(' ');
    }
    return () => {
    };
  }
}

/**
 * Enhanced style binding with signal support
 */
function createSignalStyleBinding(
    element: HTMLElement,
    value: ReactiveStyle
): () => void {
  if (isSignal(value)) {
    return effect(() => {
      const styleValue = (value as Signal<any>).value;
      applyStyles(element, styleValue);
    }).dispose;
  } else if (typeof value === 'function') {
    return effect(() => {
      const styleValue = (value as () => any)();
      applyStyles(element, styleValue);
    }).dispose;
  } else {
    applyStyles(element, value as any);
    return () => {
    };
  }
}

function applyStyles(element: HTMLElement, styleValue: any): void {
  if (typeof styleValue === 'string') {
    element.setAttribute('style', styleValue);
  } else if (styleValue && typeof styleValue === 'object') {
    for (const [property, val] of Object.entries(styleValue)) {
      if (val != null) {
        const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        element.style.setProperty(cssProperty, String(val));
      } else {
        const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        element.style.removeProperty(cssProperty);
      }
    }
  }
}

// ZenithKernel JSX Runtime - Core implementation
type Children = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | HTMLElement 
  | DocumentFragment 
  | Children[];

// Type definitions for special Hydra components
interface HydraProps extends Attributes {
  type: 'island' | 'system' | 'wasm';
  id: string;
  entry: string;
  execType: 'local' | 'remote' | 'edge';
  context?: Record<string, any>;
  strategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
  zkProof?: string;
  manifestUrl?: string;
  props?: Record<string, any>;
}

interface MetaProps extends Attributes {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  viewport?: string;
  layout?: string;
  // OpenGraph properties
  'og:title'?: string;
  'og:description'?: string;
  'og:image'?: string;
  'og:type'?: string;
  'og:url'?: string;
  // Twitter Card properties
  'twitter:card'?: string;
  'twitter:title'?: string;
  'twitter:description'?: string;
  'twitter:image'?: string;
}

interface SafeScriptProps extends Attributes {
  type?: 'on_load' | 'on_before_load' | 'lifecycle_id';
  src?: string;
  integrity?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
  nonce?: string;
  async?: boolean;
  defer?: boolean;
}

interface CSSProps extends Attributes {
  href?: string;
  media?: string;
  integrity?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
}

/**
 * JSX Factory function - the core of the JSX runtime
 */
export function jsx(
  type: string | Function,
  props: Attributes | null,
  ...children: Children[]
): HTMLElement | DocumentFragment {
  const allProps = props || {};
  const allChildren = children.length === 1 ? children[0] : children;
  
  // Handle special Hydra components
  if (typeof type === 'string') {
    switch (type) {
      case 'Hydra':
        return createHydraComponent(allProps as HydraProps, allChildren);
      case 'meta':
        return createMetaComponent(allProps as MetaProps);
      case 'safeScript':
        return createSafeScriptComponent(allProps as SafeScriptProps, allChildren);
      case 'css':
        return createCSSComponent(allProps as CSSProps, allChildren);
      default:
        return createStandardElement(type, allProps, allChildren) as HTMLElement | DocumentFragment;
    }
  }
  
  // Handle functional components
  if (typeof type === 'function') {
    const componentProps = { ...allProps, children: allChildren };
    
    // Check if component needs signal reactivity
    if (componentProps.signal || componentProps.signalId || componentProps.hydraId) {
      return createSignalReactiveComponent(type(),componentProps);
    }
    
    // Standard component with legacy reactive-state system
    const {  ...restProps } = componentProps;
    const element = document.createElement('div');
    const componentInstance = initializeComponent(element);
    
    const result = withComponent(componentInstance, () => {
      return type(restProps);
    });
    
    if (result instanceof DocumentFragment) {
      element.appendChild(result);
      return element;
    }
    
    return result as HTMLElement;
  }
  
  throw new Error(`Invalid JSX element type: ${type}`);
}

/**
 * Create standard HTML elements with enhanced reactivity
 */
function createStandardElement(
  tagName: string,
  props: Attributes,
  children: Children
): HTMLElement | void {
  const element = document.createElement(tagName);
  const cleanupFunctions: (() => void)[] = [];
  
  // Apply attributes and setup reactive bindings
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    
    // Handle reactive attributes with $ prefix
    if ((key.startsWith('$'))) {
      const property = key.slice(1); // Remove $ prefix
      
      if (property === 'class') {
        const cleanup = createSignalClassBinding(element, value as ReactiveClass);
        cleanupFunctions.push(cleanup);
      } else if (property === 'style') {
        const cleanup = createSignalStyleBinding(element, value as ReactiveStyle);
        cleanupFunctions.push(cleanup);
      } else {
        const cleanup = createSignalBinding(element, property, value);
        cleanupFunctions.push(cleanup);
      }
      continue;
    }
    
    // Handle legacy reactive attributes (for backward compatibility)
    if (isSignal(value)) {
      const cleanup = bindStateToAttribute(element, key, value as unknown as () => any);
      cleanupFunctions.push(cleanup);
      continue;
    }
    
    // Handle event listeners
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
      cleanupFunctions.push(() => {
        element.removeEventListener(eventName, value);
      });
      continue;
    }
    
    // Handle boolean attributes
    if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(key, '');
      }
      continue;
    }
    
    // Handle standard attributes
    if (value !== null && value !== undefined) {
      element.setAttribute(key, String(value));
    }
  }
  
  // Store cleanup functions
  (element as any).__jsxCleanup = () => {
    cleanupFunctions.forEach(fn => fn());
  };
  
  // Append children
  appendChildren(element, children);
  
  return element;
}

/**
 * Create Hydra island component
 */
function createHydraComponent(props: HydraProps, children: Children): HTMLElement {
  const {
    type,
    id,
    entry,
    execType,
    context = {},
    strategy = 'immediate',
    trustLevel = 'local',
    zkProof,
    manifestUrl,
    props: componentProps = {},
    ...attrs
  } = props;
  
  const element = document.createElement('div');
  element.className = 'hydra-island';
  element.setAttribute('data-hydra-id', id);
  element.setAttribute('data-hydra-entry', entry);
  element.setAttribute('data-hydra-exec-type', execType);
  element.setAttribute('data-hydra-strategy', strategy);
  element.setAttribute('data-hydra-trust-level', trustLevel);
  
  if (zkProof) {
    element.setAttribute('data-hydra-zk-proof', zkProof);
  }
  
  if (manifestUrl) {
    element.setAttribute('data-hydra-manifest', manifestUrl);
  }
  
  // Store hydration context and props
  (element as any).__hydraContext = context;
  (element as any).__hydraProps = componentProps;
  
  // Apply additional attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined) {
      element.setAttribute(key, String(value));
    }
  }
  
  // Add children as fallback content
  appendChildren(element, children);
  
  // Mark for hydration by the Hydra runtime
  element.setAttribute('data-hydra-state', 'pending');
  
  return element;
}

/**
 * Create meta component for page metadata
 */
function createMetaComponent(props: MetaProps): DocumentFragment {
  const fragment = document.createDocumentFragment();
  
  // Create title element
  if (props.title) {
    const titleElement = document.createElement('title');
    titleElement.textContent = props.title;
    fragment.appendChild(titleElement);
  }
  
  // Create meta tags
  const metaTags: Array<[string, string]> = [];
  
  if (props.description) {
    metaTags.push(['name', 'description'], ['content', props.description]);
  }
  
  if (props.keywords) {
    metaTags.push(['name', 'keywords'], ['content', props.keywords.join(', ')]);
  }
  
  if (props.author) {
    metaTags.push(['name', 'author'], ['content', props.author]);
  }
  
  if (props.viewport) {
    metaTags.push(['name', 'viewport'], ['content', props.viewport]);
  }
  
  // OpenGraph tags
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('og:') && value) {
      metaTags.push(['property', key], ['content', String(value)]);
    }
    if (key.startsWith('twitter:') && value) {
      metaTags.push(['name', key], ['content', String(value)]);
    }
  }
  
  // Create meta elements in pairs
  for (let i = 0; i < metaTags.length; i += 2) {
    const metaElement = document.createElement('meta');
    metaElement.setAttribute(metaTags[i][0], metaTags[i][1]);
    metaElement.setAttribute(metaTags[i + 1][0], metaTags[i + 1][1]);
    fragment.appendChild(metaElement);
  }
  
  // Layout meta tag
  if (props.layout) {
    const layoutMeta = document.createElement('meta');
    layoutMeta.setAttribute('name', 'layout');
    layoutMeta.setAttribute('content', props.layout);
    fragment.appendChild(layoutMeta);
  }
  
  return fragment;
}

/**
 * Create secure script component
 */
function createSafeScriptComponent(props: SafeScriptProps, children: Children): HTMLElement {
  const {
    type = 'on_load',
    src,
    integrity,
    crossorigin,
    nonce,
    async: isAsync,
    defer,
    ...attrs
  } = props;
  
  const script = document.createElement('script');
  
  // Set script type based on loading strategy
  script.setAttribute('data-script-type', type);
  
  if (src) {
    script.src = src;
    
    // Security attributes
    if (integrity) {
      script.integrity = integrity;
    }
    
    if (crossorigin) {
      script.crossOrigin = crossorigin;
    }
    
    if (nonce) {
      script.nonce = nonce;
    }
    
    if (isAsync) {
      script.async = true;
    }
    
    if (defer) {
      script.defer = true;
    }
  }
  
  // Add inline script content
  if (children) {
    const content = flattenChildren(children);
    if (content.trim()) {
      script.textContent = content;
    }
  }
  
  // Apply additional attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined) {
      script.setAttribute(key, String(value));
    }
  }
  
  return script;
}

/**
 * Create CSS component
 */
function createCSSComponent(props: CSSProps, children: Children): HTMLElement {
  if (props.href) {
    // External stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = props.href;
    
    if (props.media) {
      link.media = props.media;
    }
    
    if (props.integrity) {
      link.integrity = props.integrity;
    }
    
    if (props.crossorigin) {
      link.crossOrigin = props.crossorigin;
    }
    
    return link;
  } else {
    // Inline styles
    const style = document.createElement('style');
    
    if (props.media) {
      style.media = props.media;
    }
    
    if (children) {
      const content = flattenChildren(children);
      style.textContent = content;
    }
    
    return style;
  }
}

/**
 * Append children to an element
 */
function appendChildren(element: HTMLElement, children: Children): void {
  if (children == null) return;
  
  if (Array.isArray(children)) {
    children.forEach(child => appendChild(element, child));
  } else {
    appendChild(element, children);
  }
}

/**
 * Append a single child to an element
 */
function appendChild(element: HTMLElement, child: Children): void {
  if (child == null || typeof child === 'boolean') {
    return;
  }
  
  if (typeof child === 'string' || typeof child === 'number') {
    element.appendChild(document.createTextNode(String(child)));
    return;
  }
  
  if (child instanceof HTMLElement || child instanceof DocumentFragment) {
    element.appendChild(child);
    return;
  }
  
  if (Array.isArray(child)) {
    child.forEach(grandChild => appendChild(element, grandChild));
    return;
  }
  
  // Handle signals as text content
  if (isSignal(child)) {
    const textNode = document.createTextNode('');
    element.appendChild(textNode);
    
    // Create reactive binding for text content
    effect(() => {
      textNode.textContent = String((child as Signal<any>).value);
    });
    
    return;
  }
}

/**
 * Flatten children array to text content
 */
function flattenChildren(children: Children): string {
  if (children == null || typeof children === 'boolean') {
    return '';
  }
  
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  
  if (Array.isArray(children)) {
    return children.map(flattenChildren).join('');
  }
  
  return '';
}

/**
 * JSX Fragment implementation
 */
export function Fragment(props: { children?: Children }): DocumentFragment {
  const fragment = document.createDocumentFragment();
  
  if (props.children) {
    appendChildren(fragment as any, props.children);
  }
  
  return fragment;
}

// Compatibility exports
export { jsx as jsxs, jsx as jsxDEV };

// Type definitions for JSX
export namespace JSX {
  export interface Element extends HTMLElement {}
  
  export interface IntrinsicElements {
    // Standard HTML elements with reactive support
    [elemName: string]: Attributes;
    
    // Special Hydra components
    Hydra: HydraProps;
    meta: MetaProps;
    safeScript: SafeScriptProps;
    css: CSSProps;
    
    // Common HTML elements with enhanced typing
    div: Attributes;
    span: Attributes;
    p: Attributes;
    h1: Attributes;
    h2: Attributes;
    h3: Attributes;
    h4: Attributes;
    h5: Attributes;
    h6: Attributes;
    button: Attributes & { type?: 'button' | 'submit' | 'reset' };
    input: Attributes & {
      type?: string;
      value?: ReactiveValue<string | number>;
      checked?: ReactiveValue<boolean>;
      placeholder?: string;
    };
    img: Attributes & {
      src?: ReactiveValue<string>;
      alt?: string;
      loading?: 'lazy' | 'eager';
    };
    a: Attributes & {
      href?: ReactiveValue<string>;
      target?: '_blank' | '_self' | '_parent' | '_top';
      rel?: string;
    };
  }
  
  export interface ElementChildrenAttribute {
    children: {};
  }
}

/**
 * Cleanup function for JSX elements
 */
export function cleanup(element: HTMLElement): void {
  // Cleanup JSX reactive bindings
  if ((element as any).__jsxCleanup) {
    (element as any).__jsxCleanup();
  }
  
  // Cleanup signal-based reactive bindings
  if ((element as any).__signalCleanup) {
    (element as any).__signalCleanup();
  }
  
  // Cleanup legacy reactive-state bindings
  cleanupComponent(element);
  
  // Recursively cleanup children
  const children = element.querySelectorAll('*');
  children.forEach(child => {
    if (child instanceof HTMLElement) {
      cleanup(child);
    }
  });
}

/**
 * Render JSX to string (for SSR)
 */
export function renderToString(element: HTMLElement | DocumentFragment): string {
  if (element instanceof DocumentFragment) {
    const div = document.createElement('div');
    div.appendChild(element.cloneNode(true));
    return div.innerHTML;
  }
  
  return element.outerHTML;
}

/**
 * Create a reactive text node that updates when signal changes
 */
export function createReactiveText(value: ReactiveValue<string | number>): Text {
  const textNode = document.createTextNode('');
  
  if (isSignal(value)) {
    effect(() => {
      textNode.textContent = String((value as Signal<any>).value);
    });
  } else if (typeof value === 'function') {
    effect(() => {
      textNode.textContent = String((value as () => any)());
    });
  } else {
    textNode.textContent = String(value);
  }
  
  return textNode;
}

/**
 * Hydra-specific utility functions
 */
export const hydra = {
  /**
   * Create a Hydra island programmatically
   */
  createIsland(
    id: string,
    entry: string,
    options: Partial<HydraProps> = {}
  ): HTMLElement {
    return jsx('Hydra', {
      type: 'island',
      id,
      entry,
      execType: 'local',
      ...options
    }) as HTMLElement;
  },
  
  /**
   * Create a meta tag set
   */
  createMeta(props: MetaProps): DocumentFragment {
    return createMetaComponent(props);
  },
  
  /**
   * Create a secure script
   */
  createScript(
    content: string,
    options: Partial<SafeScriptProps> = {}
  ): HTMLElement {
    return jsx('safeScript', options, content) as HTMLElement;
  }
};

// Default export for compatibility
export default jsx;