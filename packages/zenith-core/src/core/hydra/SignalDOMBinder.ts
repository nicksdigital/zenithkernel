/**
 * SignalDOMBinder - Advanced DOM binding utilities for reactive signals
 * Extends DOM binding capabilities with performance optimizations and complex binding types
 */

import { Signal, isSignal, effect, computed, signal, Computation } from '../signals';



export interface DOMBindingOptions {
  debounce?: number; // Debounce updates in milliseconds
  immediate?: boolean; // Apply binding immediately (defaults to true)
  priority?: 'low' | 'normal' | 'high'; // (Currently conceptual, not deeply implemented for scheduling)
  transform?: (value: any) => any; // Value transformation
  validator?: (value: any, oldValue?: any) => boolean; // Value validation
  fallback?: any; // Fallback value on error or validation failure
}

export interface AnimationBindingOptions extends DOMBindingOptions {
  duration?: number; // Animation duration in ms
  easing?: string; // CSS easing function (e.g., 'linear', 'ease-in-out', 'cubic-bezier(...)')
  keyframes?: Keyframe[] | PropertyIndexedKeyframes; // Custom keyframes
  // fill?: AnimationFillMode; // if more control over Web Animations API is needed
}

export interface ConditionalBindingOptions extends DOMBindingOptions {
  condition: Signal<boolean> | (() => boolean); // Condition signal or function
  alternate?: any; // Value when condition is false
}

interface ComputationEffect {
  dispose: () => void;
}

let bindingCounter = 0; // For generating unique binding IDs

/**
 * Advanced DOM binding utilities with signal reactivity
 */
export class SignalDOMBinder {
 private bindings = new Map<string, ComputationEffect>();  private debounceTimers = new Map<string, number>(); // bindingId -> timeoutId
  private elementIdCache = new WeakMap<Node, string>(); // Element -> generated unique ID
  private static nextElementId = 0;

  /**
   * Generic private helper to create and manage binding effects.
   */
  private _createBindingEffect(
    bindingId: string,
    updateFn: () => void,
    options: DOMBindingOptions
  ): Computation {
    // Apply immediately if requested (default is true)
    if (options.immediate !== false) {
      updateFn();
    }

    const disposeEffect = effect(() => {
      if (options.debounce && options.debounce > 0) {
        this.debounceUpdate(bindingId, updateFn, options.debounce);
      } else {
        // Consider priority here if implementing advanced scheduling
        updateFn();
      }
    });

    this.bindings.set(bindingId, disposeEffect);
    return disposeEffect;
  }

  /**
   * Bind signal to element attribute with advanced options
   */
  bindAttribute(
    element: HTMLElement,
    attribute: string,
    signalValue: Signal<any> | any, // Can bind a signal or a static value (though less common for "bind")
    options: DOMBindingOptions = {}
  ): string {
    const bindingId = this.generateBindingId(element, 'attr', attribute);
    const signal = isSignal(signalValue) ? signalValue : computed(() => signalValue);

    const updateFn = () => {
      try {
        let value = signal.value;
        const oldValue = element.getAttribute(attribute);

        if (options.transform) value = options.transform(value);
        if (options.validator && !options.validator(value, oldValue)) {
          value = options.fallback;
        }

        const stringValue = value != null ? String(value) : null;

        if (stringValue !== null) {
          if (element.getAttribute(attribute) !== stringValue) {
            element.setAttribute(attribute, stringValue);
          }
        } else {
          if (element.hasAttribute(attribute)) {
            element.removeAttribute(attribute);
          }
        }
      } catch (error) {
        console.error(`Error updating attribute ${attribute} for ${this.getElementId(element)}:`, error);
        if (options.fallback !== undefined) {
          if (element.getAttribute(attribute) !== String(options.fallback)) {
            element.setAttribute(attribute, String(options.fallback));
          }
        }
      }
    };

    this._createBindingEffect(bindingId, updateFn, options);
    return bindingId;
  }

  /**
   * Bind signal to element style with CSS property support
   */
  bindStyle(
    element: HTMLElement,
    property: string, // Can be camelCase or kebab-case
    signalValue: Signal<any> | any,
    options: DOMBindingOptions = {}
  ): string {
    const bindingId = this.generateBindingId(element, 'style', property);
    const signal = isSignal(signalValue) ? signalValue : computed(() => signalValue);
    const cssProperty = property.includes('-') ? property : property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

    const updateFn = () => {
      try {
        let value = signal.value;
        const oldValue = element.style.getPropertyValue(cssProperty);

        if (options.transform) value = options.transform(value);
        if (options.validator && !options.validator(value, oldValue)) {
          value = options.fallback;
        }
        
        const stringValue = value != null ? String(value) : '';

        if (element.style.getPropertyValue(cssProperty) !== stringValue) {
            if (stringValue) {
                 element.style.setProperty(cssProperty, stringValue);
            } else {
                 element.style.removeProperty(cssProperty);
            }
        }
      } catch (error) {
        console.error(`Error updating style ${property} for ${this.getElementId(element)}:`, error);
        // Fallback for styles might be complex if it needs to revert, often just log.
      }
    };

    this._createBindingEffect(bindingId, updateFn, options);
    return bindingId;
  }

  /**
   * Bind signal to element class list with complex class logic
   */
  bindClassList(
    element: HTMLElement,
    signalValue: Signal<string | string[] | Record<string, boolean>> | any,
    options: DOMBindingOptions = {}
  ): string {
    const bindingId = this.generateBindingId(element, 'class');
    const signal = isSignal(signalValue) ? signalValue : computed(() => signalValue);
    let previousClasses = new Set<string>();

    const updateFn = () => {
      try {
        let value = signal.value;
        if (options.transform) value = options.transform(value);

        const newClasses = new Set<string>();
        if (typeof value === 'string') {
          value.split(/\s+/).filter(Boolean).forEach(cls => newClasses.add(cls));
        } else if (Array.isArray(value)) {
          (value as string[]).filter(Boolean).forEach(cls => newClasses.add(cls));
        } else if (value && typeof value === 'object') {
          for (const [className, condition] of Object.entries(value as Record<string, boolean>)) {
            if (condition) newClasses.add(className);
          }
        }
        
        // More efficient update:
        previousClasses.forEach(cls => {
          if (!newClasses.has(cls)) element.classList.remove(cls);
        });
        newClasses.forEach(cls => {
          if (!previousClasses.has(cls)) element.classList.add(cls);
        });
        
        previousClasses = newClasses;
      } catch (error) {
        console.error(`Error updating class list for ${this.getElementId(element)}:`, error);
      }
    };
    this._createBindingEffect(bindingId, updateFn, options);
    return bindingId;
  }

  /**
   * Bind signal to text content with formatting support
   */
  bindTextContent(
    node: Node, // HTMLElement or Text node
    signalValue: Signal<any> | any,
    options: DOMBindingOptions = {}
  ): string {
    const bindingId = this.generateBindingId(node, 'text');
    const signal = isSignal(signalValue) ? signalValue : computed(() => signalValue);

    const updateFn = () => {
      try {
        let value = signal.value;
        const oldValue = node.textContent;

        if (options.transform) value = options.transform(value);
        if (options.validator && !options.validator(value, oldValue)) {
          value = options.fallback;
        }
        
        const stringValue = String(value ?? '');
        if (node.textContent !== stringValue) {
          node.textContent = stringValue;
        }
      } catch (error) {
        console.error(`Error updating text content for ${this.getElementId(node)}:`, error);
        if (options.fallback !== undefined) {
          if (node.textContent !== String(options.fallback)) {
            node.textContent = String(options.fallback);
          }
        }
      }
    };
    this._createBindingEffect(bindingId, updateFn, options);
    return bindingId;
  }

  /**
   * Animated binding with CSS transitions or Web Animations API
   */
  bindAnimated(
    element: HTMLElement,
    property: string, // CSS property to animate (e.g., 'opacity', 'transform')
    signalValue: Signal<any> | any,
    options: AnimationBindingOptions = {}
  ): string {
    const bindingId = this.generateBindingId(element, 'animated', property);
    const signal = isSignal(signalValue) ? signalValue : computed(() => signalValue);

    const { duration = 300, easing = 'ease', keyframes, ...baseOptions } = options;

    const updateFn = () => {
      try {
        let value = signal.value;
        if (baseOptions.transform) value = baseOptions.transform(value);
        // Validator could also be used here if needed

        if (keyframes) {
          // This assumes 'value' might influence the keyframes or be one of them.
          // More typically, keyframes are predefined and the signal triggers the animation.
          // If signal.value IS the target state for a simpler property animation:
          const dynamicKeyframes = Array.isArray(keyframes) 
            ? keyframes // Use as is
            : { ...keyframes, [property]: value } as PropertyIndexedKeyframes; // Or merge if value is target

          element.animate(dynamicKeyframes, { duration, easing, fill: 'forwards' });
        } else {
          const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
          if (!element.style.transition) { // Avoid overwriting existing complex transitions unintentionally
            element.style.transition = `${cssProperty} ${duration}ms ${easing}`;
          }
          // Check current value before setting to avoid re-triggering if value is same
          if (element.style.getPropertyValue(cssProperty) !== String(value)) {
            element.style.setProperty(cssProperty, String(value));
          }
        }
      } catch (error) {
        console.error(`Error animating property ${property} for ${this.getElementId(element)}:`, error);
      }
    };

    this._createBindingEffect(bindingId, updateFn, baseOptions);
    return bindingId;
  }
  
  /**
   * Conditional binding that only updates when condition is met
   */
  bindConditional(
    element: HTMLElement,
    attribute: string,
    signalValue: Signal<any> | any, // Value to set when condition is true
    options: ConditionalBindingOptions
  ): string {
    const bindingId = this.generateBindingId(element, 'conditional', attribute);
    const dataSignal = isSignal(signalValue) ? signalValue : computed(() => signalValue);
    const conditionSignal = typeof options.condition === 'function' ? computed(options.condition) : options.condition;

    const updateFn = () => {
      try {
        if (conditionSignal.value) {
          let value = dataSignal.value;
          if (options.transform) value = options.transform(value);
          // Validator could be added here too
          if (element.getAttribute(attribute) !== String(value)) {
            element.setAttribute(attribute, String(value));
          }
        } else if (options.alternate !== undefined) {
          if (element.getAttribute(attribute) !== String(options.alternate)) {
            element.setAttribute(attribute, String(options.alternate));
          }
        } else {
            if (element.hasAttribute(attribute)) {
                 element.removeAttribute(attribute);
            }
        }
      } catch (error) {
        console.error(`Error in conditional binding for ${attribute} on ${this.getElementId(element)}:`, error);
      }
    };
    
    // Create effect based on both dataSignal and conditionSignal
    const disposeEffect = effect(() => {
        // Access both signals to ensure effect re-runs when either changes
        dataSignal.value; 
        conditionSignal.value;
      if (options.debounce && options.debounce > 0) {
        this.debounceUpdate(bindingId, updateFn, options.debounce);
      } else {
        updateFn();
      }
    });
    this.bindings.set(bindingId, disposeEffect);
    if (options.immediate !== false) updateFn(); // Initial sync

    return bindingId;
  }

  /**
   * Bind to element visibility with intersection observer
   */
  bindVisibility(
    element: HTMLElement,
    visibilitySignal: Signal<boolean>, // This signal will be UPDATED by the observer
    options: Pick<DOMBindingOptions, 'priority'> & { threshold?: number | number[] } = {}
  ): string {
    const bindingId = this.generateBindingId(element, 'visibility');
    if (!isSignal(visibilitySignal)) {
        console.warn(`bindVisibility expects a writable Signal to update. Provided value is not a Signal for element ${this.getElementId(element)}.`);
        return bindingId; // Or throw error
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (visibilitySignal.value !== entry.isIntersecting) {
          visibilitySignal.value = entry.isIntersecting;
        }
      },
      { threshold: options.threshold || 0.1 } // Default to 10% visibility
    );

    observer.observe(element);

    const dispose = () => observer.disconnect();
    this.bindings.set(bindingId, { dispose } as ComputationEffect);
    return bindingId;
  }

  /**
   * Bind form input value with two-way data binding
   */
  bindInputValue(
    input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    valueSignal: Signal<string | number | string[]>, // string[] for select multiple
    options: DOMBindingOptions = {}
  ): string {
    const bindingId = this.generateBindingId(input, 'input-value');

    const updateInputFromSignal = () => {
      const signalVal = valueSignal.value;
      if (input.type === 'checkbox' && typeof signalVal === 'boolean') { // Should use bindCheckbox
        (input as HTMLInputElement).checked = signalVal;
      } else if (input.type === 'radio') {
        (input as HTMLInputElement).checked = (input.value === String(signalVal));
      } else if (input.tagName === 'SELECT' && (input as HTMLSelectElement).multiple && Array.isArray(signalVal)) {
        const selectedValues = new Set(signalVal as string[]);
        Array.from((input as HTMLSelectElement).options).forEach(opt => {
            opt.selected = selectedValues.has(opt.value);
        });
      } else if (input.value !== String(signalVal ?? '')) {
        input.value = String(signalVal ?? '');
      }
    };
    
    // Effect to update input when signal changes
    const disposeSignalEffect = effect(updateInputFromSignal);
    if (options.immediate !== false) updateInputFromSignal();


    const eventType = (input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT') ? 'change' : 'input';
    const inputUpdateHandler = (event: Event) => {
      const target = event.target as typeof input;
      let newValue: string | number | boolean | string[];

      if (target.type === 'checkbox') {
        newValue = (target as HTMLInputElement).checked;
      } else if (target.type === 'number') {
        newValue = (target as HTMLInputElement).valueAsNumber;
        if (isNaN(newValue)) newValue = (target as HTMLInputElement).value; // fallback if not a valid number
      } else if (target.tagName === 'SELECT' && (target as HTMLSelectElement).multiple) {
        newValue = Array.from((target as HTMLSelectElement).selectedOptions).map(opt => opt.value);
      }
      else {
        newValue = target.value;
      }

      const oldValue = valueSignal.value;
      if (options.validator && !options.validator(newValue, oldValue)) {
        updateInputFromSignal(); // Revert to signal value
        return;
      }
      // Type casting might be needed if signal has a stricter type than string/number
      if (valueSignal.value !== newValue) {
        (valueSignal as Signal<any>).value = newValue;
      }
    };

    input.addEventListener(eventType, inputUpdateHandler);

    const dispose = () => {
      disposeSignalEffect.dispose(); // Dispose the effect
      input.removeEventListener(eventType, inputUpdateHandler);
    };
    this.bindings.set(bindingId, { dispose });
    return bindingId;
  }
  
  // bindCheckbox is largely covered by bindInputValue with type='checkbox', but can be kept for explicitness
  bindCheckbox(
    checkbox: HTMLInputElement,
    checkedSignal: Signal<boolean>,
    options: DOMBindingOptions = {}
  ): string {
    if (checkbox.type !== 'checkbox') {
        console.warn("bindCheckbox should be used with input type='checkbox'.");
    }
    // Re-use bindInputValue, it handles checkboxes correctly if signal is boolean
    return this.bindInputValue(checkbox, checkedSignal as Signal<any>, options);
  }

  /**
   * Create a reactive list binding for dynamic element lists (Optimized)
   */
 // In SignalDOMBinder class
  bindList<T>(
    container: HTMLElement,
    itemsSignal: Signal<T[]>,
    renderItem: (item: T, index: number, itemConcreteSignal: Signal<T>) => HTMLElement, // itemConcreteSignal is guaranteed
    options: DOMBindingOptions & {
      keyFn: (item: T, index: number) => string | number;
      updateItem?: (element: HTMLElement, itemConcreteSignal: Signal<T>, index: number) => void; // itemConcreteSignal is guaranteed
      itemSignalCreator?: (initialValue: T) => Signal<T>;
    }
  ): string {
    if (!options.keyFn) {
        console.error("bindList requires a 'keyFn' option for efficient updates.");
        return this.generateBindingId(container, 'list-error');
    }
    const bindingId = this.generateBindingId(container, 'list');
    
    const elementMap = new Map<string | number, HTMLElement>();
    const itemSignalMap = new Map<string | number, Signal<T>>();
    let previousKeys: Array<string | number> = [];

    const updateList = () => {
      try {
        const items = itemsSignal.value || [];
        const newKeys: Array<string | number> = items.map(options.keyFn);
        const newElementMap = new Map<string | number, HTMLElement>();
        const newItemSignalMap = new Map<string | number, Signal<T>>();
        const fragment = document.createDocumentFragment();

        items.forEach((itemData, index) => {
          const key = newKeys[index];
          const existingElement = elementMap.get(key);
          let itemConcreteSignal = itemSignalMap.get(key); // This can be Signal<T> | undefined

          if (itemConcreteSignal) { // Existing item signal
            if (itemConcreteSignal.value !== itemData) itemConcreteSignal.value = itemData;
          } else { // New item signal
            // Use the imported 'signal' function (lowercase)
            itemConcreteSignal = options.itemSignalCreator ? options.itemSignalCreator(itemData) : signal(itemData);
          }
          newItemSignalMap.set(key, itemConcreteSignal); // itemConcreteSignal is now definitely Signal<T>
          
          let currentElement: HTMLElement;
          if (existingElement) { // Existing element
            currentElement = existingElement;
            if (options.updateItem) {
              // Pass the now-guaranteed Signal<T>
              options.updateItem(currentElement, itemConcreteSignal, index);
            }
          } else { // New element
            // Pass the now-guaranteed Signal<T>
            currentElement = renderItem(itemData, index, itemConcreteSignal);
          }
          newElementMap.set(key, currentElement);
          fragment.appendChild(currentElement);
        });

        previousKeys.forEach(key => {
          if (!newKeys.includes(key)) {
            const elementToRemove = elementMap.get(key);
            elementToRemove?.remove();
            elementMap.delete(key);
            itemSignalMap.delete(key);
          }
        });
        
        container.innerHTML = ''; 
        container.appendChild(fragment);

        elementMap.clear(); newElementMap.forEach((el, k) => elementMap.set(k, el));
        itemSignalMap.clear(); newItemSignalMap.forEach((sig, k) => itemSignalMap.set(k, sig));
        previousKeys = newKeys;

      } catch (error) {
        console.error(`Error updating list binding for ${this.getElementId(container)}:`, error);
      }
    };
    
    // The _createBindingEffect method will handle storing the ComputationEffect properly
    this._createBindingEffect(bindingId, updateList, options);
    return bindingId;
  }

 /**
   * Remove a specific binding
   */
  removeBinding(bindingId: string): void {
    const computationEffect = this.bindings.get(bindingId); // Renamed for clarity
    if (computationEffect) {
      computationEffect.dispose(); // Call the .dispose() method
      this.bindings.delete(bindingId);
      
      const timer = this.debounceTimers.get(bindingId);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(bindingId);
      }
      // Removed animationFrames cleanup as it wasn't being used
    }
  }
  /**
   * Remove all bindings for a specific element/node
   */
  removeNodeBindings(node: Node): void {
    const elementIdPrefix = this.getElementId(node) + '-'; // Used as a prefix
    const bindingsToRemove: string[] = [];
    
    for (const bindingId of this.bindings.keys()) {
      // Check if the bindingId starts with the element's unique prefix part
      // This relies on generateBindingId's structure.
      if (bindingId.startsWith(elementIdPrefix)) {
        bindingsToRemove.push(bindingId);
      }
    }
    bindingsToRemove.forEach(id => this.removeBinding(id));
  }

  /**
   * Clean up all bindings
   */
  dispose(): void {
    this.bindings.forEach(computationEffect => computationEffect.dispose()); // Call .dispose()
    this.bindings.clear();
    
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.elementIdCache = new WeakMap(); 
  }

  /** Get binding statistics */
  getStats() {
    return {
      totalBindings: this.bindings.size,
      pendingDebounces: this.debounceTimers.size,
    };
  }

  private generateBindingId(node: Node, type: string, key?: string): string {
    const elementPart = this.getElementId(node);
    const keyPart = key ? `-${key.replace(/[^a-zA-Z0-9_-]/g, '')}` : ''; // Sanitize key
    return `${elementPart}-${type}${keyPart}-${bindingCounter++}`;
  }

  private getElementId(node: Node): string {
    if (node instanceof HTMLElement && node.id) {
      return node.id;
    }
    let generatedId = this.elementIdCache.get(node);
    if (!generatedId) {
      generatedId = `zenith-node-${SignalDOMBinder.nextElementId++}`;
      this.elementIdCache.set(node, generatedId);
    }
    return generatedId;
  }

  private debounceUpdate(bindingId: string, updateFn: () => void, delay: number): void {
    const existingTimer = this.debounceTimers.get(bindingId);
    if (existingTimer) clearTimeout(existingTimer);
    
    const timer = setTimeout(() => {
      updateFn();
      this.debounceTimers.delete(bindingId);
    }, delay) as any as number; // Cast for Node.js/browser timer ID compatibility
    this.debounceTimers.set(bindingId, timer);
  }
}


let globalSignalDOMBinder: SignalDOMBinder | undefined;
export function getSignalDOMBinder(): SignalDOMBinder {
  if (!globalSignalDOMBinder) {
    globalSignalDOMBinder = new SignalDOMBinder();
  }
  return globalSignalDOMBinder;
}

export const domBindings = {
  text: (node: Node, signal: Signal<any> | any, options?: DOMBindingOptions) =>
    getSignalDOMBinder().bindTextContent(node, signal, options),
  attr: (el: HTMLElement, attr: string, signal: Signal<any> | any, options?: DOMBindingOptions) =>
    getSignalDOMBinder().bindAttribute(el, attr, signal, options),
  style: (el: HTMLElement, prop: string, signal: Signal<any> | any, options?: DOMBindingOptions) =>
    getSignalDOMBinder().bindStyle(el, prop, signal, options),
  class: (el: HTMLElement, signal: Signal<any> | any, options?: DOMBindingOptions) =>
    getSignalDOMBinder().bindClassList(el, signal, options),
  input: (inputEl: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, signal: Signal<any>, options?: DOMBindingOptions) =>
    getSignalDOMBinder().bindInputValue(inputEl, signal, options),
  checkbox: (checkboxEl: HTMLInputElement, signal: Signal<boolean>, options?: DOMBindingOptions) =>
    getSignalDOMBinder().bindCheckbox(checkboxEl, signal, options),
  animate: (el: HTMLElement, prop: string, signal: Signal<any> | any, options?: AnimationBindingOptions) =>
    getSignalDOMBinder().bindAnimated(el, prop, signal, options),
  list: <T>(
    container: HTMLElement,
    itemsSignal: Signal<T[]>,
    renderItem: (item: T, index: number, itemSignal: Signal<T>) => HTMLElement,
    options: DOMBindingOptions & { 
        keyFn: (item: T, index: number) => string | number;
        updateItem?: (element: HTMLElement, itemSignal: Signal<T>, index: number) => void;
        itemSignalCreator?: (initialValue: T) => Signal<T>;
    }
  ) => getSignalDOMBinder().bindList(container, itemsSignal, renderItem, options),
  visible: (el: HTMLElement, visibilitySignal: Signal<boolean>, options?: Pick<DOMBindingOptions, 'priority'> & { threshold?: number | number[] }) =>
    getSignalDOMBinder().bindVisibility(el, visibilitySignal, options),
  conditional: (el: HTMLElement, attribute: string, signalValue: Signal<any> | any, options: ConditionalBindingOptions) =>
    getSignalDOMBinder().bindConditional(el, attribute, signalValue, options),
  remove: (bindingId: string) => getSignalDOMBinder().removeBinding(bindingId),
  removeAll: (node: Node) => getSignalDOMBinder().removeNodeBindings(node),
};


export function createReactiveElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  staticProps: Partial<Omit<HTMLElementTagNameMap[K], 'style' | 'classList' | 'dataset' | 'textContent' | 'innerHTML'>> & {
    style?: Partial<CSSStyleDeclaration> | Record<string, string | number>;
    className?: string; // For static classes
    class?: string; // Alias for className
    textContent?: string;
    innerHTML?: string;
    ref?: (el: HTMLElementTagNameMap[K]) => void;
    children?: Array<Node | string>;
  } = {},
  reactiveBindings?: { // More specific reactive bindings
    text?: Signal<any> | any;
    html?: Signal<string> | string; // For binding innerHTML reactively (use with caution)
    visible?: Signal<boolean>; // Bind visibility
    class?: Signal<string | string[] | Record<string, boolean>> | any;
    attrs?: Record<string, Signal<any> | any>;
    styles?: Record<string, Signal<any> | any>; // PropertyName: SignalOrValue
    events?: Record<string, (event: Event) => void>; // Static event listeners
  },
  optionsStore: { // Global options for these bindings
    attrs?: DOMBindingOptions;
    styles?: DOMBindingOptions;
    text?: DOMBindingOptions;
    class?: DOMBindingOptions;
  } = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  const binder = getSignalDOMBinder();

  for (const [key, value] of Object.entries(staticProps)) {
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === 'className' || key === 'class') {
      element.className = String(value);
    } else if (key === 'textContent') {
      element.textContent = String(value);
    } else if (key === 'innerHTML' && typeof value === 'string') { // DANGEROUSLY_SET_INNER_HTML
        element.innerHTML = value;
    } else if (key === 'style' && typeof value === 'object' && value !== null) {
        Object.entries(value as Record<string, string | number>).forEach(([styleProp, styleVal]) => {
            (element.style as any)[styleProp.includes('-') ? styleProp.replace(/-(\w)/g, (_, c) => c.toUpperCase()) : styleProp] = styleVal;
        });
    } else if (key === 'ref' && typeof value === 'function') {
        (value as (el: HTMLElementTagNameMap[K]) => void)(element);
    } else if (key === 'children' && Array.isArray(value)) {
        (value as Array<Node | string>).forEach(child => {
            element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });
    }
    else {
      element.setAttribute(key, String(value));
    }
  }

  if (reactiveBindings) {
    if (reactiveBindings.text !== undefined) binder.bindTextContent(element, reactiveBindings.text, optionsStore.text);
    if (reactiveBindings.html !== undefined) { // DANGEROUSLY_BIND_INNER_HTML
        const htmlSignal = isSignal(reactiveBindings.html) ? reactiveBindings.html : computed(() => reactiveBindings.html);
        effect(() => { element.innerHTML = String(htmlSignal.value ?? ''); }); // Simple effect, could be expanded
    }
    if (reactiveBindings.visible !== undefined) binder.bindVisibility(element, reactiveBindings.visible);
    if (reactiveBindings.class !== undefined) binder.bindClassList(element, reactiveBindings.class, optionsStore.class);
    
    if (reactiveBindings.attrs) {
      Object.entries(reactiveBindings.attrs).forEach(([attrName, signalValue]) => {
        binder.bindAttribute(element, attrName, signalValue, optionsStore.attrs);
      });
    }
    if (reactiveBindings.styles) {
      Object.entries(reactiveBindings.styles).forEach(([styleProp, signalValue]) => {
        binder.bindStyle(element, styleProp, signalValue, optionsStore.styles);
      });
    }
    if (reactiveBindings.events) { // Static event listeners from reactiveBindings, same as staticProps.on...
        Object.entries(reactiveBindings.events).forEach(([eventName, handler]) => {
            element.addEventListener(eventName.toLowerCase(), handler);
        });
    }
  }
  return element;
}

export function createReactiveText(textSignal: Signal<string | number | null | undefined>, options?: DOMBindingOptions): Text {
  const textNode = document.createTextNode('');
  getSignalDOMBinder().bindTextContent(textNode, textSignal, options);
  return textNode;
}