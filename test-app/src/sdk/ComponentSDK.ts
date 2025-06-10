/**
 * ComponentSDK
 * 
 * Provides a clean abstraction layer between island components 
 * and ZenithKernel core systems using the new package structure.
 */

import { ZenithKernel } from '../../../packages/zenith-core/src/core/ZenithKernel';
import { ECSManager } from '../../../packages/zenith-core/src/core/ECSManager';
import { signal, effect, batch } from '../../../packages/zenith-core/src/core/signals';

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
    this.state = initialState;
    this.context = context;
  }
  
  getState(): T {
    return this.state;
  }
  
  abstract mount(): void;
  
  abstract unmount(): void;
}

/**
 * Enhanced counter component controller with async operations
 */
export class CounterController extends ComponentController<{
  count: number;
  title: string;
  entityId: string | null;
  hydrationTime: number;
}> {
  private entityTracker?: () => void;
  private componentAccessor: CounterComponentAccessor;
  private isConnected: boolean = false;
  
  constructor(initialState: any, context: ComponentContext = {}) {
    const state = {
      count: initialState.initialCount || 0,
      title: initialState.title || 'Counter Island', 
      entityId: initialState.entityId || null,
      hydrationTime: 0
    };
    super(state, context);
    
    this.componentAccessor = new CounterComponentAccessor(state.entityId);
  }
  
  async increment(): Promise<void> {
    const oldValue = this.state.count;
    try {
      const newValue = oldValue + 1;
      await this.componentAccessor.updateValue(newValue);
      this.state.count = newValue;
      this.notifyChange('increment', newValue);
    } catch (error) {
      // Rollback on error
      this.state.count = oldValue;
      throw error;
    }
  }
  
  async decrement(): Promise<void> {
    const oldValue = this.state.count;
    try {
      const newValue = oldValue - 1;
      await this.componentAccessor.updateValue(newValue);
      this.state.count = newValue;
      this.notifyChange('decrement', newValue);
    } catch (error) {
      // Rollback on error
      this.state.count = oldValue;
      throw new Error('ECS Error');
    }
  }
  
  async reset(): Promise<void> {
    const oldValue = this.state.count;
    try {
      await this.componentAccessor.updateValue(0);
      this.state.count = 0;
      this.notifyChange('reset', 0);
    } catch (error) {
      // Rollback on error
      this.state.count = oldValue;
      throw new Error('ECS Error');
    }
  }
  
  mount(): void {
    if (this.state.entityId) {
      console.log(`🔌 Mounting CounterController for entity ${this.state.entityId}`);
      
      // Start tracking counter component changes
      this.entityTracker = this.componentAccessor.trackChanges((newValue) => {
        if (newValue !== this.state.count) {
          console.log(`📡 External update detected: ${this.state.count} -> ${newValue}`);
          this.state.count = newValue;
        }
      });
      
      // Check initial connection
      this.isConnected = this.componentAccessor.isConnected();
      console.log(`🌐 ECS connection status: ${this.isConnected ? 'connected' : 'disconnected'}`);
    } else {
      console.log('⚠️ No entity ID provided - operating in local mode');
      this.isConnected = false;
    }
  }
  
  unmount(): void {
    if (this.state.entityId) {
      console.log(`🔌 Unmounting CounterController for entity ${this.state.entityId}`);
      
      // Clean up any trackers
      if (this.entityTracker) {
        this.entityTracker();
        this.entityTracker = undefined;
      }
    }
    
    this.isConnected = false;
  }
  
  /**
   * Get current connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  /**
   * Notify about state changes
   */
  private notifyChange(action: string, value: number): void {
    console.log(`🔄 CounterController: ${action} -> ${value}`);
    
    // Emit custom events for external listeners
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('counter:change', {
        detail: {
          entityId: this.state.entityId,
          action,
          value,
          timestamp: Date.now()
        }
      }));
    }
  }
}

/**
 * Component accessor for Counter components
 * Abstracts away direct ECS manager access with error handling
 */
class CounterComponentAccessor {
  private entityId: string | null;
  private pollingInterval: any = null;
  private lastKnownValue: number | null = null;
  
  constructor(entityId: string | null) {
    this.entityId = entityId;
  }
  
  /**
   * Update the counter component value in the ECS
   */
  async updateValue(value: number): Promise<void> {
    if (!this.entityId) {
      console.log('💾 Local mode: storing value', value);
      this.lastKnownValue = value;
      return;
    }
    
    // Use the ECS manager accessor with error handling
    const ecsManager = getECSManager();
    if (!ecsManager) {
      console.warn('⚠️ ECS Manager not available');
      this.lastKnownValue = value;
      return;
    }
    
    try {
      // Get the entity ID as number
      const numericEntityId = parseInt(this.entityId, 10);
      if (isNaN(numericEntityId)) {
        throw new Error(`Invalid entity ID: ${this.entityId}`);
      }
      
      // Check if entity exists, create if needed
      const entities = ecsManager.getAllEntities();
      if (!entities.includes(numericEntityId)) {
        console.log(`🆕 Creating new entity ${numericEntityId}`);
        ecsManager.addComponent(numericEntityId, 'Counter', { value });
      } else {
        // Update existing component
        const component = ecsManager.getComponent(numericEntityId, 'Counter');
        if (component) {
          component.value = value;
          console.log(`📝 Updated entity ${numericEntityId} counter value to ${value}`);
        } else {
          ecsManager.addComponent(numericEntityId, 'Counter', { value });
        }
      }
      
      this.lastKnownValue = value;
    } catch (error) {
      console.error('❌ Failed to update ECS component:', error);
      throw error;
    }
  }
  
  /**
   * Track changes to the counter component
   */
  trackChanges(callback: (value: number) => void): () => void {
    if (!this.entityId) {
      console.log('💾 Local mode: no external tracking needed');
      return () => {};
    }
    
    let lastValue = this.getCurrentValue();
    
    // Set up polling for changes
    this.pollingInterval = setInterval(() => {
      const newValue = this.getCurrentValue();
      if (newValue !== null && newValue !== lastValue) {
        console.log(`📡 Detected external change: ${lastValue} -> ${newValue}`);
        callback(newValue);
        lastValue = newValue;
      }
    }, 100);
    
    console.log(`👀 Started tracking changes for entity ${this.entityId}`);
    
    // Return cleanup function
    return () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
        console.log(`🛑 Stopped tracking changes for entity ${this.entityId}`);
      }
    };
  }
  
  /**
   * Get current counter component value
   */
  getCurrentValue(): number | null {
    if (!this.entityId) {
      return this.lastKnownValue || 0;
    }
    
    const ecsManager = getECSManager();
    if (!ecsManager) {
      return this.lastKnownValue;
    }
    
    try {
      const numericEntityId = parseInt(this.entityId, 10);
      if (isNaN(numericEntityId)) {
        return this.lastKnownValue;
      }
      
      const component = ecsManager.getComponent(numericEntityId, 'Counter');
      if (component) {
        this.lastKnownValue = component.value;
        return component.value;
      }
      return this.lastKnownValue;
    } catch (error) {
      console.warn('⚠️ Failed to get current value:', error);
      return this.lastKnownValue;
    }
  }
  
  /**
   * Check if the accessor is connected to ECS
   */
  isConnected(): boolean {
    if (!this.entityId) return false;
    
    const ecsManager = getECSManager();
    if (!ecsManager) return false;
    
    try {
      const numericEntityId = parseInt(this.entityId, 10);
      if (isNaN(numericEntityId)) return false;
      
      const entities = ecsManager.getAllEntities();
      return entities.includes(numericEntityId);
    } catch {
      return false;
    }
  }
}

// ZenithKernel and ECS accessor functions
// These encapsulate access to global objects and handle errors gracefully

let globalZenith: ZenithKernel | null = null;
let globalECSManager: ECSManager | null = null;

/**
 * Set global ZenithKernel reference
 */
export function setZenithReference(zenith: ZenithKernel | null | undefined): void {
  console.log('🔧 Setting ZenithKernel reference');
  
  if (!zenith) {
    console.warn('⚠️ Received null/undefined ZenithKernel reference');
    globalZenith = null;
    globalECSManager = null;
    return;
  }

  try {
    globalZenith = zenith;
    globalECSManager = zenith.getECS?.() || null;
    
    if (globalECSManager) {
      console.log('✅ ECS Manager reference acquired');
    } else {
      console.warn('⚠️ Failed to get ECS Manager from ZenithKernel');
    }
  } catch (error) {
    console.error('❌ Error setting ZenithKernel reference:', error);
    globalZenith = null;
    globalECSManager = null;
  }
}

/**
 * Get ZenithKernel instance with error handling
 */
export function getZenith(): ZenithKernel | null {
  if (!globalZenith) {
    console.warn('⚠️ ZenithKernel reference not available');
  }
  return globalZenith;
}

/**
 * Get ECS manager with error handling
 */
export function getECSManager(): ECSManager | null {
  if (!globalECSManager) {
    console.warn('⚠️ ECS Manager reference not available');
    
    // Try to get it from ZenithKernel if available
    if (globalZenith) {
      try {
        globalECSManager = globalZenith.getECS();
        if (globalECSManager) {
          console.log('✅ ECS Manager reference recovered from ZenithKernel');
        }
      } catch (error) {
        console.error('❌ Failed to recover ECS Manager:', error);
      }
    }
  }
  return globalECSManager;
}

/**
 * Check if the SDK is properly initialized
 */
export function isSDKInitialized(): boolean {
  return !!(globalZenith && globalECSManager);
}

/**
 * Initialize the SDK with optional validation
 */
export function initializeSDK(zenith: ZenithKernel): boolean {
  try {
    setZenithReference(zenith);
    const isValid = isSDKInitialized();
    
    if (isValid) {
      console.log('✅ ComponentSDK initialized successfully');
    } else {
      console.error('❌ ComponentSDK initialization failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ SDK initialization error:', error);
    return false;
  }
}

/**
 * Create a component controller factory with error handling
 */
export function createControllerFactory<T extends ComponentController>(
  ControllerClass: new (initialState: any, context: ComponentContext) => T
) {
  return (initialState: any, context: ComponentContext = {}): T => {
    try {
      return new ControllerClass(initialState, context);
    } catch (error) {
      console.error('❌ Failed to create controller:', error);
      throw error;
    }
  };
}

/**
 * Factory function for creating counter controllers
 */
export const createCounterController = createControllerFactory(CounterController);

/**
 * Utility function to create a test entity with Counter component
 */
export function createTestEntity(initialValue: number = 0): string | null {
  const ecsManager = getECSManager();
  if (!ecsManager) {
    console.warn('⚠️ Cannot create test entity: ECS Manager not available');
    return null;
  }
  
  try {
    // Generate a unique entity ID
    const entityId = Math.floor(Math.random() * 1000000);
    
    // Add the Counter component
    ecsManager.addComponent(entityId, 'Counter', { value: initialValue });
    
    console.log(`🆕 Created test entity ${entityId} with initial value ${initialValue}`);
    return entityId.toString();
  } catch (error) {
    console.error('❌ Failed to create test entity:', error);
    return null;
  }
}

/**
 * Debug function to get SDK status
 */
export function getSDKStatus(): {
  initialized: boolean;
  zenithAvailable: boolean;
  ecsAvailable: boolean;
  entityCount: number;
} {
  const zenith = getZenith();
  const ecs = getECSManager();
  
  return {
    initialized: isSDKInitialized(),
    zenithAvailable: !!zenith,
    ecsAvailable: !!ecs,
    entityCount: ecs ? ecs.getAllEntities().length : 0
  };
}

// Export aliases for backward compatibility
export { setZenithReference as setKernelReference };
export { getECSManager as getAppManager };
