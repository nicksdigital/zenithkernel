/**
 * TestSystem
 * 
 * A simple system that demonstrates ZenithKernel system functionality.
 */

import { BaseSystem, ZenithKernel } from '../lib/core';

export class TestSystem extends BaseSystem {
  private tickCount: number = 0;
  private initialized: boolean = false;
  protected kernel: ZenithKernel;
  
  constructor(kernel: ZenithKernel) {
    super(kernel);
    this.kernel = kernel;
    console.log('TestSystem: Created');
  }
  
  /**
   * Called when the system is loaded
   */
  onLoad(): void {
    console.log('TestSystem: Loaded');
    this.initialized = true;
    
    // Register a message handler for test messages
    this.kernel.registerMessageHandler('test', (message) => {
      console.log('TestSystem: Received test message:', message);
      this.handleTestMessage(message);
    });
    
    // Create a test entity with the Counter component
    const ecs = this.kernel.getECS();
    const testEntity = ecs.createEntity();
    ecs.addComponent(testEntity, 'Counter', { value: 0 });
    
    console.log(`TestSystem: Created test entity with ID ${testEntity}`);
  }
  
  /**
   * Called when the system is unloaded
   */
  onUnload(): void {
    console.log('TestSystem: Unloaded');
    this.initialized = false;
  }
  
  /**
   * Called on each update tick
   */
  update(deltaTime: number): void {
    if (!this.initialized) return;
    
    this.tickCount++;
    
    // Every 100 ticks, perform a test action
    if (this.tickCount % 100 === 0) {
      const ecs = this.kernel.getECS();
      
      // Find entities with Counter components
      const counterEntities = ecs.getEntitiesWith('Counter');
      
      // Update all counters
      for (const entity of counterEntities) {
        const counter = ecs.getComponent(entity, 'Counter');
        if (counter) {
          counter.value++;
          console.log(`TestSystem: Entity ${entity} counter value is now ${counter.value}`);
        }
      }
    }
  }
  
  /**
   * Handle test messages
   */
  private handleTestMessage(message: any): void {
    console.log('TestSystem: Processing message:', message);
    
    // If the message has an action, perform it
    if (message.action) {
      switch (message.action) {
        case 'increment':
          this.incrementAllCounters();
          break;
        case 'decrement':
          this.decrementAllCounters();
          break;
        case 'reset':
          this.resetAllCounters();
          break;
      }
    }
  }
  
  /**
   * Increment all counter components in the system
   */
  private incrementAllCounters(): void {
    const ecs = this.kernel.getECS();
    const counterEntities = ecs.getEntitiesWith('Counter');
    
    for (const entity of counterEntities) {
      const counter = ecs.getComponent(entity, 'Counter');
      if (counter) {
        counter.increment();
        console.log(`TestSystem: Incremented counter for entity ${entity} to ${counter.value}`);
      }
    }
  }
  
  /**
   * Decrement all counter components in the system
   */
  private decrementAllCounters(): void {
    const ecs = this.kernel.getECS();
    const counterEntities = ecs.getEntitiesWith('Counter');
    
    for (const entity of counterEntities) {
      const counter = ecs.getComponent(entity, 'Counter');
      if (counter) {
        counter.decrement();
        console.log(`TestSystem: Decremented counter for entity ${entity} to ${counter.value}`);
      }
    }
  }
  
  /**
   * Reset all counter components in the system
   */
  private resetAllCounters(): void {
    const ecs = this.kernel.getECS();
    const counterEntities = ecs.getEntitiesWith('Counter');
    
    for (const entity of counterEntities) {
      const counter = ecs.getComponent(entity, 'Counter');
      if (counter) {
        counter.reset();
        console.log(`TestSystem: Reset counter for entity ${entity} to ${counter.value}`);
      }
    }
  }
}
