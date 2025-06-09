/**
 * CounterController
 * 
 * Controller for counter components in the ZenithSDK.
 * Provides a clean abstraction over the Counter component.
 */

import { ComponentController, ComponentContext } from './ComponentController';

/**
 * Counter component state interface
 */
export interface CounterState {
  /**
   * Current counter value
   */
  count: number;
  
  /**
   * Counter title
   */
  title: string;
  
  /**
   * Entity ID if bound to an entity
   */
  entityId: string | null;
  
  /**
   * Time taken for hydration in milliseconds
   */
  hydrationTime: number;
}

/**
 * Counter controller for managing counter components
 */
export class CounterController extends ComponentController<CounterState> {
  /**
   * Create a new CounterController
   */
  constructor(initialState: Partial<CounterState> = {}, context: ComponentContext = {}) {
    super(initialState, context);
  }
  
  /**
   * Get the default counter state
   */
  protected getDefaultState(): Partial<CounterState> {
    return {
      count: 0,
      title: 'Counter',
      entityId: null,
      hydrationTime: 0
    };
  }
  
  /**
   * Set up the component
   */
  protected setupComponent(): void {
    // If we have an entity ID, set up syncing with the App
    if (this.state.entityId) {
      this.setupEntitySync(this.state.entityId);
    }
  }
  
  /**
   * Set up syncing between the controller and entity
   */
  private setupEntitySync(entityId: string): void {
    // Get current App instance
    const app = this.getApp()?.getAppManager();
    if (!app) return;
    
    // Set up polling to check for component updates
    const intervalId = setInterval(() => {
      const component = app.getComponent(entityId, 'Counter');
      if (component && component.value !== this.state.count) {
        this.state.count = component.value;
      }
    }, 100);
    
    // Add cleanup
    this.addCleanup(() => clearInterval(intervalId));
  }
  
  /**
   * Increment the counter
   */
  increment(): void {
    this.state.count++;
    this.syncToEntity();
  }
  
  /**
   * Decrement the counter
   */
  decrement(): void {
    this.state.count--;
    this.syncToEntity();
  }
  
  /**
   * Reset the counter
   */
  reset(): void {
    this.state.count = 0;
    this.syncToEntity();
  }
  
  /**
   * Set the counter to a specific value
   */
  setValue(value: number): void {
    this.state.count = value;
    this.syncToEntity();
  }
  
  /**
   * Sync the counter state to the entity
   */
  private syncToEntity(): void {
    if (!this.state.entityId) return;
    
    const app = this.getApp()?.getAppManager();
    if (!app) return;
    
    const component = app.getComponent(this.state.entityId, 'Counter');
    if (component) {
      component.value = this.state.count;
    }
  }
  
  /**
   * Record hydration time
   */
  recordHydration(startTime: number): void {
    this.state.hydrationTime = Math.round(performance.now() - startTime);
  }
}

/**
 * Create a counter controller
 */
export function createCounter(initialState: Partial<CounterState> = {}, context: ComponentContext = {}): CounterController {
  return new CounterController(initialState, context);
}
