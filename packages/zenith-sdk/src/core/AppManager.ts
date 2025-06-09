/**
 * AppManager
 * 
 * Provides a clean abstraction over ZenithKernel's ECS system
 * with developer-friendly methods for component registration and entity management.
 */

import type { ECSManager } from '@zenithkernel/core/core/ECSManager';
import type { Entity } from '@zenithkernel/core/core/Entity';

/**
 * Component registration options
 */
export interface ComponentOptions {
  /**
   * Serializable properties that should be included in saved state
   */
  serializable?: string[];
  
  /**
   * Default values for the component
   */
  defaults?: Record<string, any>;
  
  /**
   * Whether component updates should trigger reactivity
   */
  reactive?: boolean;
}

/**
 * AppManager provides a simplified interface to the ECS manager
 */
export class AppManager {
  private ecs: ECSManager;
  private componentRegistry: Map<string, any> = new Map();
  
  /**
   * Create a new AppManager instance
   */
  constructor(ecsManager: ECSManager) {
    this.ecs = ecsManager;
  }
  
  /**
   * Register a component type with the system
   */
  registerComponent(componentType: any, componentName: string, options: ComponentOptions = {}): void {
    // Store in our local registry
    this.componentRegistry.set(componentName, {
      type: componentType,
      options
    });
    
    // Register with the ECS system
    // Note: This abstraction handles potential API differences in the underlying ECS system
    if (typeof this.ecs.registerComponentType === 'function') {
      this.ecs.registerComponentType(componentType, componentName);
    } else if (typeof this.ecs.registerComponent === 'function') {
      this.ecs.registerComponent(componentName, componentType);
    } else {
      console.error(`[AppManager] Could not register component: ${componentName} - missing registration method`);
    }
  }
  
  /**
   * Create a new entity
   */
  createEntity(components: Record<string, any> = {}): string {
    const entity = this.ecs.createEntity();
    
    // Add any initial components
    for (const [componentName, componentData] of Object.entries(components)) {
      this.addComponent(entity.id, componentName, componentData);
    }
    
    return entity.id;
  }
  
  /**
   * Add a component to an entity
   */
  addComponent(entityId: string, componentName: string, data: any = {}): void {
    const entity = this.getEntityById(entityId);
    if (!entity) return;
    
    // Get registered component info
    const registration = this.componentRegistry.get(componentName);
    if (!registration) {
      console.error(`[AppManager] Component type not registered: ${componentName}`);
      return;
    }
    
    // Merge with defaults if available
    const mergedData = {
      ...(registration.options.defaults || {}),
      ...data
    };
    
    // Add component to entity
    this.ecs.addComponent(entity, componentName, mergedData);
  }
  
  /**
   * Get a component from an entity
   */
  getComponent(entityId: string, componentName: string): any | null {
    const entity = this.getEntityById(entityId);
    if (!entity) return null;
    
    return this.ecs.getComponent(entity, componentName);
  }
  
  /**
   * Update a component's data
   */
  updateComponent(entityId: string, componentName: string, data: any): void {
    const component = this.getComponent(entityId, componentName);
    if (!component) return;
    
    // Apply updates to the component
    Object.assign(component, data);
  }
  
  /**
   * Remove a component from an entity
   */
  removeComponent(entityId: string, componentName: string): void {
    const entity = this.getEntityById(entityId);
    if (!entity) return;
    
    this.ecs.removeComponent(entity, componentName);
  }
  
  /**
   * Get an entity by ID
   */
  getEntityById(entityId: string | Entity): Entity | null {
    if (typeof entityId === 'object') {
      return entityId;
    }
    return this.ecs.getEntityById(entityId);
  }
  
  /**
   * Delete an entity
   */
  deleteEntity(entityId: string): void {
    const entity = this.getEntityById(entityId);
    if (!entity) return;
    
    this.ecs.removeEntity(entity);
  }
  
  /**
   * Get all entities with a specific component
   */
  getEntitiesWith(componentName: string): Entity[] {
    return this.ecs.getEntitiesWith(componentName);
  }
  
  /**
   * Query entities based on component requirements
   */
  queryEntities(required: string[] = [], exclude: string[] = []): Entity[] {
    return this.ecs.query(required, exclude);
  }
}
