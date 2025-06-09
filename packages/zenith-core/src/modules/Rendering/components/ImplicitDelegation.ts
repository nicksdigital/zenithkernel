/**
 * Implicit Delegation implementation for component behavior inheritance
 */

/**
 * Type for delegatable behaviors
 */
export type Behavior<T = any> = {
  name: string;
  methods: Record<string, Function>;
  state?: T;
};

/**
 * Registry for behaviors that can be implicitly delegated
 */
export class BehaviorRegistry {
  private static instance: BehaviorRegistry;
  private behaviors: Map<string, Behavior<any>> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  static getInstance(): BehaviorRegistry {
    if (!BehaviorRegistry.instance) {
      BehaviorRegistry.instance = new BehaviorRegistry();
    }
    return BehaviorRegistry.instance;
  }
  
  /**
   * Register a behavior
   */
  register<T = any>(behavior: Behavior<T>): void {
    this.behaviors.set(behavior.name, behavior);
  }
  
  /**
   * Get a behavior by name
   */
  get<T = any>(name: string): Behavior<T> | undefined {
    return this.behaviors.get(name);
  }
  
  /**
   * Check if a behavior exists
   */
  has(name: string): boolean {
    return this.behaviors.has(name);
  }
  
  /**
   * Remove a behavior
   */
  remove(name: string): boolean {
    return this.behaviors.delete(name);
  }
  
  /**
   * Get all registered behavior names
   */
  getAllNames(): string[] {
    return Array.from(this.behaviors.keys());
  }
}

/**
 * Component enhancer using implicit delegation
 */
export class DelegatingComponent {
  private element: HTMLElement;
  private behaviors: Map<string, any> = new Map();
  private behaviorInstances: Map<string, any> = new Map();
  
  constructor(element: HTMLElement) {
    this.element = element;
    
    // Initialize based on data attributes
    this.initializeFromAttributes();
  }
  
  /**
   * Initialize behaviors from data attributes
   */
  private initializeFromAttributes(): void {
    const behaviorAttr = this.element.getAttribute('data-behaviors');
    if (behaviorAttr) {
      const behaviorNames = behaviorAttr.split(' ').map(b => b.trim()).filter(Boolean);
      
      behaviorNames.forEach(name => {
        this.addBehavior(name);
      });
    }
  }
  
  /**
   * Add a behavior to the component
   */
  addBehavior(name: string, state?: any): void {
    const registry = BehaviorRegistry.getInstance();
    const behavior = registry.get(name);
    
    if (!behavior) {
      console.warn(`Behavior "${name}" not found in registry`);
      return;
    }
    
    this.behaviors.set(name, behavior);
    
    // Initialize behavior state
    const behaviorState = state || behavior.state || {};
    this.behaviorInstances.set(name, behaviorState);
    
    // Add methods to the component
    Object.entries(behavior.methods).forEach(([methodName, method]) => {
      // @ts-ignore - dynamically adding methods
      this[methodName] = (...args: any[]) => {
        return method(this.element, behaviorState, ...args);
      };
    });
    
    // Mark the element with the behavior
    if (!this.element.hasAttribute('data-behaviors')) {
      this.element.setAttribute('data-behaviors', name);
    } else {
      const current = this.element.getAttribute('data-behaviors') || '';
      if (!current.includes(name)) {
        this.element.setAttribute('data-behaviors', `${current} ${name}`);
      }
    }
  }
  
  /**
   * Remove a behavior from the component
   */
  removeBehavior(name: string): void {
    const behavior = this.behaviors.get(name);
    if (!behavior) return;
    
    // Remove behavior methods
    Object.keys(behavior.methods).forEach(methodName => {
      // @ts-ignore - dynamically removing methods
      delete this[methodName];
    });
    
    this.behaviors.delete(name);
    this.behaviorInstances.delete(name);
    
    // Update data-behaviors attribute
    const current = this.element.getAttribute('data-behaviors') || '';
    const updated = current
      .split(' ')
      .filter(b => b !== name)
      .join(' ');
    
    if (updated) {
      this.element.setAttribute('data-behaviors', updated);
    } else {
      this.element.removeAttribute('data-behaviors');
    }
  }
  
  /**
   * Check if component has a behavior
   */
  hasBehavior(name: string): boolean {
    return this.behaviors.has(name);
  }
  
  /**
   * Get behavior state
   */
  getBehaviorState<T = any>(name: string): T | undefined {
    return this.behaviorInstances.get(name);
  }
  
  /**
   * Set behavior state
   */
  setBehaviorState<T = any>(name: string, state: T): void {
    if (this.behaviors.has(name)) {
      this.behaviorInstances.set(name, state);
    }
  }
  
  /**
   * Get the underlying DOM element
   */
  getElement(): HTMLElement {
    return this.element;
  }
}

/**
 * Create a behavior that can be implicitly delegated
 */
export function createBehavior<T = any>(
  name: string,
  methods: Record<string, (element: HTMLElement, state: T, ...args: any[]) => any>,
  initialState?: T
): Behavior<T> {
  const behavior: Behavior<T> = {
    name,
    methods,
    state: initialState
  };
  
  // Register the behavior
  BehaviorRegistry.getInstance().register(behavior);
  
  return behavior;
}

/**
 * Enhance an element with delegating behavior
 */
export function enhance(element: HTMLElement): DelegatingComponent {
  return new DelegatingComponent(element);
}
