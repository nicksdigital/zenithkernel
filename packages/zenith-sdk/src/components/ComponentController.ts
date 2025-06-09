/**
 * ComponentController
 * 
 * Base class for component controllers in the ZenithSDK.
 * Provides common functionality and lifecycle management.
 */

import { reactive } from '../core/signals';
import { ZenithApp } from '../core/ZenithApp';

/**
 * Component context interface
 */
export interface ComponentContext {
  /**
   * Hydration strategy used for the component
   */
  strategy?: string;
  
  /**
   * Trust level of the component
   */
  trustLevel?: string;
  
  /**
   * Entity ID if component is bound to an entity
   */
  entityId?: string | null;
  
  /**
   * Additional context properties
   */
  [key: string]: any;
}

/**
 * Base component lifecycle hooks
 */
export interface ComponentLifecycle {
  /**
   * Called before the component is mounted
   */
  onBeforeMount?: () => void;
  
  /**
   * Called when the component is mounted
   */
  onMounted?: () => void;
  
  /**
   * Called before the component is updated
   */
  onBeforeUpdate?: () => void;
  
  /**
   * Called after the component is updated
   */
  onUpdated?: () => void;
  
  /**
   * Called before the component is unmounted
   */
  onBeforeUnmount?: () => void;
  
  /**
   * Called when the component is unmounted
   */
  onUnmounted?: () => void;
}

/**
 * Abstract base class for component controllers
 */
export abstract class ComponentController<T extends Record<string, any> = Record<string, any>> implements ComponentLifecycle {
  /**
   * Reactive state object
   */
  protected state: T;
  
  /**
   * Component context
   */
  protected context: ComponentContext;
  
  /**
   * Cleanup functions to run on unmount
   */
  private cleanupFunctions: (() => void)[] = [];
  
  /**
   * Is the component mounted
   */
  private isMounted = false;
  
  /**
   * Create a new ComponentController
   */
  constructor(initialState: Partial<T>, context: ComponentContext = {}) {
    // Create reactive state
    this.state = reactive({
      ...this.getDefaultState(),
      ...initialState
    }) as T;
    
    this.context = context;
  }
  
  /**
   * Get the default state for the component
   */
  protected getDefaultState(): Partial<T> {
    return {};
  }
  
  /**
   * Get the current state
   */
  getState(): T {
    return this.state;
  }
  
  /**
   * Mount the component
   */
  mount(): void {
    if (this.isMounted) return;
    
    if (this.onBeforeMount) {
      this.onBeforeMount();
    }
    
    this.setupComponent();
    this.isMounted = true;
    
    if (this.onMounted) {
      this.onMounted();
    }
  }
  
  /**
   * Unmount the component
   */
  unmount(): void {
    if (!this.isMounted) return;
    
    if (this.onBeforeUnmount) {
      this.onBeforeUnmount();
    }
    
    // Run all cleanup functions
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    
    this.isMounted = false;
    
    if (this.onUnmounted) {
      this.onUnmounted();
    }
  }
  
  /**
   * Add a cleanup function to run on unmount
   */
  protected addCleanup(cleanupFn: () => void): void {
    this.cleanupFunctions.push(cleanupFn);
  }
  
  /**
   * Setup the component - implement in subclasses
   */
  protected abstract setupComponent(): void;
  
  // Lifecycle hooks - can be implemented by subclasses
  onBeforeMount?(): void;
  onMounted?(): void;
  onBeforeUpdate?(): void;
  onUpdated?(): void;
  onBeforeUnmount?(): void;
  onUnmounted?(): void;
  
  /**
   * Get the ZenithApp instance
   */
  protected getApp(): ZenithApp | null {
    return ZenithApp.getGlobal();
  }
}
