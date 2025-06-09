/**
 * ComponentSDK
 * 
 * Provides a clean abstraction layer between island components 
 * and Zenith application core systems.
 */

import { ZenithKernel } from '../../../src/core/ZenithKernel';
import { ECSManager as AppManager } from '../../../src/core/ECSManager';
import { signal, effect, batch } from '../../../src/core/signals';

/**
 * Interface for component context to avoid direct system dependencies
 */
export interface ComponentContext {
  strategy?: string;
  trustLevel?: string;
  entityId?: string | null;
  [key: string]: any;
}

/**
 * Abstract base class for island component controllers
 */
export abstract class ComponentController<T = any> {
  protected state: T;
  protected context: ComponentContext;
  
  constructor(initialState: T, context: ComponentContext = {}) {
    this.state = signal(initialState) as T;
    this.context = context;
  }
  
  getState(): T {
    return this.state;
  }
  
  protected abstract mount(): void;
  
  protected abstract unmount(): void;
}

/**
 * Standard counter component controller
 */
export class CounterController extends ComponentController<{
  count: number;
  title: string;
  entityId: string | null;
  hydrationTime: number;
}> {
  private entityTracker?: () => void;
  private componentAccessor: CounterComponentAccessor;
  
  constructor(initialState: any, context: ComponentContext = {}) {
    super({
      count: initialState.initialCount || 0,
      title: initialState.title || 'Counter Island',
      entityId: initialState.entityId || null,
      hydrationTime: 0
    }, context);
    
    this.componentAccessor = new CounterComponentAccessor(this.state.entityId);
  }
  
  increment(): void {
    this.state.count++;
    this.componentAccessor.updateValue(this.state.count);
  }
  
  decrement(): void {
    this.state.count--;
    this.componentAccessor.updateValue(this.state.count);
  }
  
  reset(): void {
    this.state.count = 0;
    this.componentAccessor.updateValue(0);
  }
  
  mount(): void {
    // Start tracking counter component changes
    if (this.state.entityId) {
      this.entityTracker = this.componentAccessor.trackChanges((newValue) => {
        if (newValue !== this.state.count) {
          this.state.count = newValue;
        }
      });
    }
  }
  
  unmount(): void {
    // Clean up any trackers
    if (this.entityTracker) {
      this.entityTracker();
    }
  }
}

/**
 * Component accessor for Counter components
 * Abstracts away direct App manager access
 */
class CounterComponentAccessor {
  private entityId: string | null;
  private pollingInterval: any = null;
  
  constructor(entityId: string | null) {
    this.entityId = entityId;
  }
  
  /**
   * Update the counter component value in the App
   */
  updateValue(value: number): void {
    if (!this.entityId) return;
    
    // Use the App manager accessor instead of direct access
    const app = getAppManager();
    if (!app) return;
    
    const component = app.getComponent(this.entityId, 'Counter');
    if (component) {
      component.value = value;
      console.log(`CounterComponentAccessor: Updated entity ${this.entityId} counter value to ${value}`);
    }
  }
  
  /**
   * Track changes to the counter component
   */
  trackChanges(callback: (value: number) => void): () => void {
    if (!this.entityId) return () => {};
    
    let lastValue = this.getCurrentValue();
    
    // Set up tracking
    this.pollingInterval = setInterval(() => {
      const newValue = this.getCurrentValue();
      if (newValue !== null && newValue !== lastValue) {
        callback(newValue);
        lastValue = newValue;
      }
    }, 100);
    
    // Return cleanup function
    return () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    };
  }
  
  /**
   * Get current counter component value
   */
  getCurrentValue(): number | null {
    if (!this.entityId) return null;
    
    const app = getAppManager();
    if (!app) return null;
    
    const component = app.getComponent(this.entityId, 'Counter');
    return component ? component.value : null;
  }
}

// Zenith and App accessor functions
// These encapsulate access to global objects and handle errors gracefully

let globalZenith: ZenithKernel | null = null;
let globalApp: AppManager | null = null;

/**
 * Set global zenith reference
 */
export function setZenithReference(zenith: ZenithKernel): void {
  globalZenith = zenith;
  globalApp = zenith.getECS();
}

/**
 * Get zenith instance with error handling
 */
export function getZenith(): ZenithKernel | null {
  return globalZenith;
}

/**
 * Get App manager with error handling
 */
export function getAppManager(): AppManager | null {
  return globalApp;
}

/**
 * Create a component controller factory
 */
export function createControllerFactory<T extends ComponentController>(
  ControllerClass: new (initialState: any, context: ComponentContext) => T
) {
  return (initialState: any, context: ComponentContext = {}): T => {
    return new ControllerClass(initialState, context);
  };
}

/**
 * Factory function for creating counter controllers
 */
export const createCounterController = createControllerFactory(CounterController);
