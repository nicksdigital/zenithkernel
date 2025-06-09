/**
 * Context system for state sharing without prop drilling
 * Inspired by React's Context API but custom-built for our framework
 */

// Define a unique symbol for context ID generation
const contextIdSymbol = Symbol('context-id');
let nextContextId = 1;

/**
 * Context container class
 */
export class Context<T> {
  // Unique identifier for this context
  private id: number;
  
  // Default value for the context
  private defaultValue: T;
  
  // Current value for the context
  private currentValue: T;
  
  // Subscribers to context changes
  private subscribers: Set<(value: T) => void> = new Set();
  
  constructor(defaultValue: T) {
    this.id = nextContextId++;
    this.defaultValue = defaultValue;
    this.currentValue = defaultValue;
  }
  
  /**
   * Get context ID
   */
  getId(): number {
    return this.id;
  }
  
  /**
   * Get the current context value
   */
  getValue(): T {
    return this.currentValue;
  }
  
  /**
   * Set a new context value
   */
  setValue(value: T): void {
    if (this.currentValue === value) return;
    
    this.currentValue = value;
    
    // Notify all subscribers
    this.subscribers.forEach(subscriber => {
      subscriber(value);
    });
  }
  
  /**
   * Reset to default value
   */
  reset(): void {
    this.setValue(this.defaultValue);
  }
  
  /**
   * Subscribe to context changes
   * Returns a function to unsubscribe
   */
  subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    
    // Call callback with current value immediately
    callback(this.currentValue);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Create a provider instance for this context
   */
  createProvider(value: T): ContextProvider<T> {
    return new ContextProvider(this, value);
  }
}

/**
 * Context provider class
 */
export class ContextProvider<T> {
  private context: Context<T>;
  private value: T;
  
  constructor(context: Context<T>, value: T) {
    this.context = context;
    this.value = value;
  }
  
  /**
   * Get the context this provider is for
   */
  getContext(): Context<T> {
    return this.context;
  }
  
  /**
   * Get the provided value
   */
  getValue(): T {
    return this.value;
  }
  
  /**
   * Update the provided value
   */
  setValue(value: T): void {
    this.value = value;
  }
}

// Store active context providers
const contextProviderStack: Map<number, any[]> = new Map();

/**
 * Create a new context
 */
export function createContext<T>(defaultValue: T): Context<T> {
  return new Context<defaultValue>(defaultValue);
}

/**
 * Push a context provider onto the stack
 */
export function pushProvider<T>(provider: ContextProvider<T>): void {
  const contextId = provider.getContext().getId();
  const stack = contextProviderStack.get(contextId) || [];
  stack.push(provider.getValue());
  contextProviderStack.set(contextId, stack);
}

/**
 * Pop a context provider from the stack
 */
export function popProvider<T>(provider: ContextProvider<T>): void {
  const contextId = provider.getContext().getId();
  const stack = contextProviderStack.get(contextId) || [];
  stack.pop();
  contextProviderStack.set(contextId, stack);
}

/**
 * Use a context value (for components/hooks)
 */
export function useContext<T>(context: Context<T>): T {
  const contextId = context.getId();
  const stack = contextProviderStack.get(contextId) || [];
  
  // Get the most recent value from the stack, or use default
  return stack.length > 0 
    ? stack[stack.length - 1] 
    : context.getValue();
}

/**
 * Run a callback function with context provided
 */
export function withContext<T, R>(
  provider: ContextProvider<T>, 
  callback: () => R
): R {
  pushProvider(provider);
  try {
    return callback();
  } finally {
    popProvider(provider);
  }
}
