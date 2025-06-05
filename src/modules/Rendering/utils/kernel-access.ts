/**
 * Kernel Access Utility for Islands
 * 
 * Provides utilities for islands to access the ZenithKernel instance and ECS system.
 * This bridges the gap between the islands architecture and the main kernel.
 */

import { ZenithKernel } from '@core/ZenithKernel';
import { ECSManager } from '@core/ECSManager';

// Global kernel instance reference
let globalKernel: ZenithKernel | null = null;

/**
 * Set the global kernel instance
 * This should be called during island system initialization
 */
export function setGlobalKernel(kernel: ZenithKernel): void {
  globalKernel = kernel;
}

/**
 * Get the global kernel instance
 * Throws an error if kernel is not set
 */
export function getKernel(): ZenithKernel {
  if (!globalKernel) {
    throw new Error('ZenithKernel instance not available. Make sure setGlobalKernel() was called during initialization.');
  }
  return globalKernel;
}

/**
 * Get the ECS manager from the kernel
 * Convenience method for accessing the ECS system
 */
export function getECS(): ECSManager {
  return getKernel().getECS();
}

/**
 * Check if kernel is available
 */
export function isKernelAvailable(): boolean {
  return globalKernel !== null;
}

/**
 * Clear the global kernel reference
 * Used for cleanup and testing
 */
export function clearKernel(): void {
  globalKernel = null;
}

/**
 * Island-specific ECS utilities
 */
export class IslandECSUtils {
  private ecs: ECSManager;
  
  constructor(ecs?: ECSManager) {
    this.ecs = ecs || getECS();
  }
  
  /**
   * Create or get an entity for an island
   * If entityId is provided as string, it will create a numeric entity with that as metadata
   */
  getOrCreateEntity(entityId: string, autoCreate: boolean = true): number {
    // For now, use a simple hash of the entityId string to get a numeric ID
    // In a real implementation, you might want a more sophisticated mapping
    const numericId = this.stringToEntityId(entityId);
    
    // Check if entity exists, if not create it (if autoCreate is true)
    if (!this.entityExists(numericId) && autoCreate) {
      const newEntity = this.ecs.createEntity();
      // TODO: Add metadata component to map string ID to numeric ID
      return newEntity;
    }
    
    return numericId;
  }
  
  /**
   * Check if an entity exists in the ECS
   */
  entityExists(entityId: number): boolean {
    // Use the ECS internal method to check if entity exists
    const entities = this.ecs.getAllEntities();
    return entities.includes(entityId);
  }
  
  /**
   * Convert string entity ID to numeric ID
   * Simple hash function for demo purposes
   */
  private stringToEntityId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Create a reactive state subscription for ECS components
   * This simulates the useECSState hook behavior for islands
   */
  createComponentSubscription<T>(
    entityId: number,
    componentType: new (...args: any[]) => T,
    onChange: (data: T | undefined) => void
  ): () => void {
    // Get initial value
    const initialData = this.ecs.getComponent(entityId, componentType);
    onChange(initialData);
    
    // Listen for ECS component changes
    const handleComponentChange = (event: any) => {
      if (event.entity === entityId && event.componentType === componentType.name) {
        const newData = this.ecs.getComponent(entityId, componentType);
        onChange(newData);
      }
    };
    
    // Subscribe to ECS events
    this.ecs.on('componentAdded', handleComponentChange);
    this.ecs.on('componentUpdated', handleComponentChange);
    this.ecs.on('componentRemoved', handleComponentChange);
    
    // Return unsubscribe function
    return () => {
      this.ecs.off('componentAdded', handleComponentChange);
      this.ecs.off('componentUpdated', handleComponentChange);
      this.ecs.off('componentRemoved', handleComponentChange);
    };
  }
}
