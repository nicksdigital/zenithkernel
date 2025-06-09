/**
 * Directives implementation for DOM manipulation and behavior attachment
 */

/**
 * Type for directive handler function
 */
export type DirectiveHandler = (
  element: HTMLElement,
  value: any,
  options?: Record<string, any>
) => void | (() => void);

/**
 * Interface for directive definition
 */
export interface DirectiveDefinition {
  name: string;
  handler: DirectiveHandler;
  options?: Record<string, any>;
}

/**
 * Global registry for directives
 */
export class DirectiveRegistry {
  private static instance: DirectiveRegistry;
  private directives: Map<string, DirectiveDefinition> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  static getInstance(): DirectiveRegistry {
    if (!DirectiveRegistry.instance) {
      DirectiveRegistry.instance = new DirectiveRegistry();
    }
    return DirectiveRegistry.instance;
  }
  
  /**
   * Register a directive
   */
  register(directive: DirectiveDefinition): void {
    this.directives.set(directive.name, directive);
  }
  
  /**
   * Get a directive by name
   */
  get(name: string): DirectiveDefinition | undefined {
    return this.directives.get(name);
  }
  
  /**
   * Check if a directive exists
   */
  has(name: string): boolean {
    return this.directives.has(name);
  }
  
  /**
   * Remove a directive
   */
  remove(name: string): boolean {
    return this.directives.delete(name);
  }
  
  /**
   * Get all registered directive names
   */
  getAllNames(): string[] {
    return Array.from(this.directives.keys());
  }
}

/**
 * Apply directives to an element
 */
export function applyDirectives(
  element: HTMLElement,
  directives: Record<string, any>
): Map<string, () => void> {
  const cleanupFunctions = new Map<string, () => void>();
  const registry = DirectiveRegistry.getInstance();
  
  for (const [directiveName, value] of Object.entries(directives)) {
    const directive = registry.get(directiveName);
    if (directive) {
      try {
        const cleanup = directive.handler(element, value, directive.options);
        if (typeof cleanup === 'function') {
          cleanupFunctions.set(directiveName, cleanup);
        }
      } catch (error) {
        console.error(`Error applying directive "${directiveName}":`, error);
      }
    } else {
      console.warn(`Unknown directive "${directiveName}"`);
    }
  }
  
  return cleanupFunctions;
}

/**
 * Parse and apply directives from element attributes
 */
export function parseAndApplyDirectives(element: HTMLElement): Map<string, () => void> {
  const directives: Record<string, any> = {};
  const directivePrefix = 'z-';
  
  // Parse directive attributes
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith(directivePrefix)) {
      const directiveName = attr.name.slice(directivePrefix.length);
      let value: any = attr.value;
      
      // Try to parse JSON value if possible
      if (value.startsWith('{') || value.startsWith('[') || 
          value === 'true' || value === 'false' || 
          !isNaN(Number(value))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      
      directives[directiveName] = value;
    }
  }
  
  // Apply parsed directives
  return applyDirectives(element, directives);
}

/**
 * Create and register a new directive
 */
export function createDirective(
  name: string,
  handler: DirectiveHandler,
  options?: Record<string, any>
): DirectiveDefinition {
  const directive: DirectiveDefinition = { name, handler, options };
  DirectiveRegistry.getInstance().register(directive);
  return directive;
}

/**
 * Built-in directives
 */

// On directive for event binding
createDirective('on', (element, value, options) => {
  if (typeof value !== 'object') {
    console.warn('z-on directive expects an object of event:handler pairs');
    return;
  }
  
  const handlers: Array<{ event: string, handler: EventListener }> = [];
  
  Object.entries(value).forEach(([event, handler]) => {
    if (typeof handler === 'function') {
      element.addEventListener(event, handler);
      handlers.push({ event, handler });
    }
  });
  
  // Cleanup function
  return () => {
    handlers.forEach(({ event, handler }) => {
      element.removeEventListener(event, handler);
    });
  };
});

// Model directive for two-way binding
createDirective('model', (element, value) => {
  if (!('value' in element)) {
    console.warn('z-model directive can only be used on input elements');
    return;
  }
  
  const inputElement = element as HTMLInputElement;
  let signalObject: any = null;
  let propertyName = 'value';
  
  // Parse the value to get the signal object and property name
  if (typeof value === 'object' && value !== null) {
    signalObject = value;
  } else if (typeof value === 'string') {
    const parts = value.split('.');
    if (parts.length > 1) {
      propertyName = parts.pop() || 'value';
      // This assumes the context is available globally or through a registry
      signalObject = window;
      for (const part of parts) {
        signalObject = signalObject[part];
        if (!signalObject) break;
      }
    }
  }
  
  if (!signalObject) {
    console.warn('z-model directive requires a valid signal object');
    return;
  }
  
  // Update input when signal changes
  const updateFromSignal = () => {
    inputElement.value = signalObject[propertyName] || '';
  };
  
  // Initial value
  updateFromSignal();
  
  // Update signal when input changes
  const handleInput = () => {
    signalObject[propertyName] = inputElement.value;
  };
  
  // Add event listeners
  inputElement.addEventListener('input', handleInput);
  
  // Subscribe to signal changes if it's an observable
  let unsubscribe: (() => void) | undefined;
  if (typeof signalObject.subscribe === 'function') {
    unsubscribe = signalObject.subscribe(updateFromSignal);
  }
  
  // Cleanup function
  return () => {
    inputElement.removeEventListener('input', handleInput);
    if (unsubscribe) unsubscribe();
  };
});

// If directive for conditional rendering
createDirective('if', (element, value) => {
  const originalDisplay = element.style.display;
  const update = (condition: boolean) => {
    element.style.display = condition ? originalDisplay : 'none';
  };
  
  // Initial update
  update(Boolean(value));
  
  // Subscribe to signal changes if it's an observable
  let unsubscribe: (() => void) | undefined;
  if (typeof value === 'object' && value !== null && typeof value.subscribe === 'function') {
    unsubscribe = value.subscribe(update);
  }
  
  // Cleanup function
  return () => {
    if (unsubscribe) unsubscribe();
    element.style.display = originalDisplay;
  };
});

// Each directive for list rendering
createDirective('each', (element, value, options) => {
  const parent = element.parentNode;
  if (!parent) return;
  
  // Store template content
  const template = element.cloneNode(true) as HTMLElement;
  parent.removeChild(element);
  
  const items: Array<any> = Array.isArray(value) ? value : [];
  const renderedItems: Array<HTMLElement> = [];
  
  const render = () => {
    // Remove all previously rendered items
    renderedItems.forEach(item => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    });
    renderedItems.length = 0;
    
    // Render new items
    items.forEach((item, index) => {
      const clone = template.cloneNode(true) as HTMLElement;
      
      // Replace special variables in text content and attributes
      const replaceVariables = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
          node.textContent = node.textContent
            .replace(/\$item/g, String(item))
            .replace(/\$index/g, String(index));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Process attributes
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            attr.value = attr.value
              .replace(/\$item/g, String(item))
              .replace(/\$index/g, String(index));
          }
          
          // Process child nodes
          for (let i = 0; i < element.childNodes.length; i++) {
            replaceVariables(element.childNodes[i]);
          }
        }
      };
      
      replaceVariables(clone);
      
      // Add to parent
      parent.appendChild(clone);
      renderedItems.push(clone);
    });
  };
  
  // Initial render
  render();
  
  // Subscribe to signal changes if it's an observable
  let unsubscribe: (() => void) | undefined;
  if (typeof value === 'object' && value !== null && typeof value.subscribe === 'function') {
    unsubscribe = value.subscribe((newItems: any[]) => {
      items.length = 0;
      items.push(...newItems);
      render();
    });
  }
  
  // Cleanup function
  return () => {
    if (unsubscribe) unsubscribe();
    renderedItems.forEach(item => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    });
  };
});
