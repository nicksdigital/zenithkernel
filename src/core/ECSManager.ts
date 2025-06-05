import { ZenithKernel } from "./ZenithKernel";
import { BaseSystem } from "./BaseSystem";
import { RegistryMeta } from "../components/registryMeta";
import { EventEmitter } from "./utils/EventEmitter";

// Import types from the optimized ECS implementation
export type Entity = number;
export type ComponentType<T> = new (...args: any[]) => T;
export type QueryId = string;

// Constants for optimized ECS
const DEFAULT_ENTITY_POOL_SIZE = 10000;
const COMPONENT_RESIZE_MULTIPLIER = 2;

/**
 * SparseSet for efficient entity tracking
 * Provides O(1) operations for add, remove, and has
 */
class SparseSet {
  private sparse: Uint32Array;
  private dense: Uint32Array;
  private _count: number = 0;

  constructor(capacity: number = DEFAULT_ENTITY_POOL_SIZE) {
    this.sparse = new Uint32Array(capacity);
    this.dense = new Uint32Array(capacity);
  }

  add(id: number): boolean {
    if (id >= this.sparse.length) {
      this.resize(id + 1);
    }

    if (this.has(id)) return false;

    this.dense[this._count] = id;
    this.sparse[id] = this._count;
    this._count++;
    return true;
  }

  remove(id: number): boolean {
    if (!this.has(id)) return false;

    const denseIndex = this.sparse[id];
    const lastId = this.dense[this._count - 1];

    this.dense[denseIndex] = lastId;
    this.sparse[lastId] = denseIndex;
    this._count--;
    return true;
  }

  has(id: number): boolean {
    return id < this.sparse.length &&
           this.sparse[id] < this._count &&
           this.dense[this.sparse[id]] === id;
  }

  get count(): number {
    return this._count;
  }

  get entities(): Uint32Array {
    return this.dense.subarray(0, this._count);
  }

  private resize(newCapacity: number): void {
    const newSparse = new Uint32Array(newCapacity);
    newSparse.set(this.sparse);
    this.sparse = newSparse;

    if (newCapacity > this.dense.length) {
      const newDense = new Uint32Array(newCapacity);
      newDense.set(this.dense);
      this.dense = newDense;
    }
  }
}

/**
 * Query class for efficient entity filtering
 */
export class Query {
  private _id: QueryId;
  private _required: string[] = [];
  private _excluded: string[] = [];
  private _entities: SparseSet;
  private _dirty: boolean = true;
  private _bitflags: Map<string, number> = new Map();
  private _requiredMask: number = 0;
  private _excludedMask: number = 0;

  constructor(id: QueryId, required: string[] = [], excluded: string[] = []) {
    this._id = id;
    this._required = [...required];
    this._excluded = [...excluded];
    this._entities = new SparseSet();
  }

  get id(): QueryId {
    return this._id;
  }

  get required(): string[] {
    return [...this._required];
  }

  get excluded(): string[] {
    return [...this._excluded];
  }

  get entities(): Uint32Array {
    return this._entities.entities;
  }

  get count(): number {
    return this._entities.count;
  }

  setBitflags(componentId: string, flag: number): void {
    this._bitflags.set(componentId, flag);

    // Recalculate masks
    this._requiredMask = 0;
    for (const compId of this._required) {
      const flag = this._bitflags.get(compId);
      if (flag !== undefined) {
        this._requiredMask |= flag;
      }
    }

    this._excludedMask = 0;
    for (const compId of this._excluded) {
      const flag = this._bitflags.get(compId);
      if (flag !== undefined) {
        this._excludedMask |= flag;
      }
    }

    this._dirty = true;
  }

  matches(entityMask: number): boolean {
    // Entity must have all required components
    if ((entityMask & this._requiredMask) !== this._requiredMask) {
      return false;
    }

    // Entity must not have any excluded components
    if ((entityMask & this._excludedMask) !== 0) {
      return false;
    }

    return true;
  }

  addEntity(entityId: Entity): void {
    this._entities.add(entityId);
  }

  removeEntity(entityId: Entity): void {
    this._entities.remove(entityId);
  }

  hasEntity(entityId: Entity): boolean {
    return this._entities.has(entityId);
  }

  markDirty(): void {
    this._dirty = true;
  }

  isDirty(): boolean {
    return this._dirty;
  }

  markClean(): void {
    this._dirty = false;
  }
}

export class ECSManager extends EventEmitter {
    // Legacy storage for backward compatibility
    private components = new Map<string, Map<Entity, any>>();

    // Optimized storage
    private nextEntityId: Entity = 0;
    private removedEntities: Entity[] = [];
    private entities: SparseSet = new SparseSet(DEFAULT_ENTITY_POOL_SIZE);
    private entityMasks: Map<Entity, number> = new Map();
    private entityComponents: Map<Entity, Set<string>> = new Map();
    private componentBitflags: Map<string, number> = new Map();
    private nextComponentBitflag: number = 1;

    // Query system
    private queries: Map<QueryId, Query> = new Map();

    // Systems
    private kernelRef?: ZenithKernel;
    private systems: BaseSystem[] = [];

    constructor() {
        super();
    }

    setKernel(kernel: ZenithKernel) {
        this.kernelRef = kernel;
    }

    getSystems(): BaseSystem[] {
        return [...this.systems];
    }


    get kernel(): ZenithKernel {
        if (!this.kernelRef) throw new Error("Kernel reference not set in ECSManager.");
        return this.kernelRef;
    }

    addSystem(system: BaseSystem) {
        this.systems.push(system);
        system.ecs = this; // 🔁 Inject ECS if needed
        if (typeof system?.onLoad === "function") {
            system.onLoad();
        }
    }

    update() {
        for (const system of this.systems) {
            system.update();
        }
    }

    /**
     * Create a new entity with optimized ID recycling
     */
    createEntity(): Entity {
        let entityId: Entity;

        // Reuse removed entity IDs if available
        if (this.removedEntities.length > 0) {
            entityId = this.removedEntities.pop()!;
        } else {
            entityId = this.nextEntityId++;
        }

        // Add to optimized storage
        this.entities.add(entityId);
        this.entityMasks.set(entityId, 0);
        this.entityComponents.set(entityId, new Set());

        this.emit('entityCreated', entityId);
        return entityId;
    }

    /**
     * Remove an entity and all its components
     */
    destroyEntity(entity: Entity): void {
        // Remove from legacy storage
        for (const compMap of this.components.values()) {
            compMap.delete(entity);
        }

        // Remove from optimized storage
        if (this.entities.has(entity)) {
            // Remove all components from this entity
            const components = this.entityComponents.get(entity);
            if (components) {
                for (const componentId of components) {
                    this.removeComponentById(entity, componentId);
                }
            }

            // Update entity collections
            this.entities.remove(entity);
            this.entityMasks.delete(entity);
            this.entityComponents.delete(entity);
            this.removedEntities.push(entity);

            this.emit('entityRemoved', entity);
        }
    }

    /**
     * Add a component to an entity
     */
    addComponent<T>(entity: Entity, type: ComponentType<T>, instance: T): void {
        const typeName = type.name;

        // Add to legacy storage
        if (!this.components.has(typeName)) {
            this.components.set(typeName, new Map());
        }
        this.components.get(typeName)!.set(entity, instance);

        // Add to optimized storage
        if (!this.entities.has(entity)) {
            // Create entity if it doesn't exist
            this.entities.add(entity);
            this.entityMasks.set(entity, 0);
            this.entityComponents.set(entity, new Set());
        }

        // Assign a bitflag for this component type if not already assigned
        if (!this.componentBitflags.has(typeName)) {
            const bitflag = this.nextComponentBitflag;
            this.nextComponentBitflag *= 2;
            this.componentBitflags.set(typeName, bitflag);

            // Update all queries with this component's bitflag
            for (const query of this.queries.values()) {
                if (query.required.includes(typeName) || query.excluded.includes(typeName)) {
                    query.setBitflags(typeName, bitflag);
                }
            }
        }

        // Update entity component tracking
        this.entityComponents.get(entity)!.add(typeName);

        // Update entity bitmask for efficient querying
        const bitflag = this.componentBitflags.get(typeName)!;
        const mask = this.entityMasks.get(entity)!;
        this.entityMasks.set(entity, mask | bitflag);

        // Update queries
        this.updateEntityQueries(entity);

        this.emit('componentAdded', { entity, componentType: typeName });
    }

    /**
     * Get a component from an entity
     */
    getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
        // Use legacy storage for now
        return this.components.get(type.name)?.get(entity);
    }

    /**
     * Remove a component from an entity
     */
    removeComponent<T>(entity: Entity, type: ComponentType<T>): void {
        const typeName = type.name;

        // Remove from legacy storage
        this.components.get(typeName)?.delete(entity);

        // Remove from optimized storage
        this.removeComponentById(entity, typeName);
    }

    /**
     * Helper method to remove a component by ID
     */
    private removeComponentById(entity: Entity, componentId: string): void {
        if (!this.entities.has(entity)) return;

        // Update entity component tracking
        const components = this.entityComponents.get(entity);
        if (components && components.has(componentId)) {
            components.delete(componentId);

            // Update entity bitmask for efficient querying
            const bitflag = this.componentBitflags.get(componentId);
            if (bitflag !== undefined) {
                const mask = this.entityMasks.get(entity)!;
                this.entityMasks.set(entity, mask & ~bitflag);

                // Update queries
                this.updateEntityQueries(entity);
            }

            this.emit('componentRemoved', { entity, componentType: componentId });
        }
    }

    /**
     * Update all queries for an entity
     */
    private updateEntityQueries(entity: Entity): void {
        const mask = this.entityMasks.get(entity)!;

        for (const query of this.queries.values()) {
            const matches = query.matches(mask);
            const hasEntity = query.hasEntity(entity);

            if (matches && !hasEntity) {
                query.addEntity(entity);
            } else if (!matches && hasEntity) {
                query.removeEntity(entity);
            }
        }
    }

    /**
     * Remove a system
     */
    removeSystem(system: BaseSystem) {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
        }
    }

    /**
     * Get all entities with a specific component type
     */
    getEntitiesWith<T>(type: ComponentType<T>): [Entity, T][] {
        const map = this.components.get(type.name);
        if (!map) return [];
        return Array.from(map.entries()) as [Entity, T][];
    }

    /**
     * Define a query to efficiently filter entities
     */
    defineQuery(id: QueryId, required: string[] = [], excluded: string[] = []): Query {
        if (this.queries.has(id)) {
            throw new Error(`Query ${id} already exists`);
        }

        const query = new Query(id, required, excluded);

        // Set bitflags for all components in the query
        for (const componentId of required) {
            // If component type doesn't have a bitflag yet, assign one
            if (!this.componentBitflags.has(componentId)) {
                const bitflag = this.nextComponentBitflag;
                this.nextComponentBitflag *= 2;
                this.componentBitflags.set(componentId, bitflag);
            }

            query.setBitflags(componentId, this.componentBitflags.get(componentId)!);
        }

        for (const componentId of excluded) {
            // If component type doesn't have a bitflag yet, assign one
            if (!this.componentBitflags.has(componentId)) {
                const bitflag = this.nextComponentBitflag;
                this.nextComponentBitflag *= 2;
                this.componentBitflags.set(componentId, bitflag);
            }

            query.setBitflags(componentId, this.componentBitflags.get(componentId)!);
        }

        // Populate query with matching entities
        for (const entityId of this.entities.entities) {
            const mask = this.entityMasks.get(entityId)!;
            if (query.matches(mask)) {
                query.addEntity(entityId);
            }
        }

        this.queries.set(id, query);
        return query;
    }

    /**
     * Get a query by ID
     */
    getQuery(id: QueryId): Query | undefined {
        return this.queries.get(id);
    }

    /**
     * Remove a query
     */
    removeQuery(id: QueryId): void {
        this.queries.delete(id);
    }

    /**
     * Dump the component map (for debugging)
     */
    dumpComponentMap(): Map<string, Map<number, any>> {
        return this.components;
    }

    /**
     * Get all entities that match a specific query
     * This is much more efficient than filtering entities manually
     */
    getEntitiesWithQuery(queryId: QueryId): Entity[] {
        const query = this.queries.get(queryId);
        if (!query) {
            throw new Error(`Query ${queryId} does not exist`);
        }

        return Array.from(query.entities);
    }

    /**
     * Check if an entity has a specific component
     */
    hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
        const typeName = type.name;

        // Check in legacy storage
        if (this.components.get(typeName)?.has(entity)) {
            return true;
        }

        // Check in optimized storage
        if (this.entities.has(entity)) {
            return this.entityComponents.get(entity)?.has(typeName) || false;
        }

        return false;
    }

    /**
     * Get all components attached to an entity
     */
    getEntityComponents(entity: Entity): string[] {
        if (!this.entities.has(entity)) {
            return [];
        }

        return Array.from(this.entityComponents.get(entity)!);
    }

    /**
     * Get optimized entities with a component type
     * This is more efficient than the legacy getEntitiesWith method
     */
    getEntitiesWithComponent(componentType: string): Entity[] {
        // Create a query if one doesn't exist
        const queryId = `__internal_${componentType}`;

        if (!this.queries.has(queryId)) {
            this.defineQuery(queryId, [componentType], []);
        }

        return this.getEntitiesWithQuery(queryId);
    }

    /**
     * Get the total number of entities
     */
    getEntityCount(): number {
        return this.entities.count;
    }

    /**
     * Get the total number of component types
     */
    getComponentTypeCount(): number {
        return this.componentBitflags.size;
    }

    /**
     * Get all active entity IDs
     */
    getAllEntities(): Entity[] {
        return Array.from(this.entities.entities);
    }

    /**
     * Get performance statistics for the ECS system
     */
    getPerformanceStats(): { entities: number, components: number, queries: number, recycledEntities: number } {
        return {
            entities: this.entities.count,
            components: this.componentBitflags.size,
            queries: this.queries.size,
            recycledEntities: this.removedEntities.length
        };
    }

    /**
     * Export the SparseSet implementation for advanced users
     * This allows direct access to the optimized data structures
     */
    static get SparseSet(): typeof SparseSet {
        return SparseSet;
    }
}
