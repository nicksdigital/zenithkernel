import { ZenithKernel } from "./ZenithKernel"; // Assuming path is correct
import { BaseSystem } from "./BaseSystem"; // Assuming path is correct
// import { RegistryMeta } from "../components/registryMeta"; // Assuming path is correct
import { EventEmitter } from "./utils/EventEmitter"; // Assuming path is correct

// Assuming SignalComponentData and SignalECSComponent are defined elsewhere (e.g., signals.ts)
// and accessible for type checking if needed, or use generic constraints.
import { SignalComponentData, SignalECSComponent } from './signals'; // Example import

export type Entity = number;
// ComponentType now expects a constructor that produces T, and an optional static 'typeName' for mapping
export type ComponentType<T> = (new (...args: any[]) => T) & { typeName?: string };
export type QueryId = string;

const DEFAULT_ENTITY_POOL_SIZE = 10000;

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

  get count(): number { return this._count; }
  get entities(): Uint32Array { return this.dense.subarray(0, this._count); }

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

  get id(): QueryId { return this._id; }
  get required(): string[] { return [...this._required]; }
  get excluded(): string[] { return [...this._excluded]; }
  get entities(): Uint32Array { return this._entities.entities; }
  get count(): number { return this._entities.count; }

  setBitflags(componentName: string, flag: number): void {
    this._bitflags.set(componentName, flag);
    this._recalculateMasks();
    this._dirty = true;
  }
  
  private _recalculateMasks(): void {
    this._requiredMask = 0;
    for (const compName of this._required) {
      this._requiredMask |= (this._bitflags.get(compName) || 0);
    }
    this._excludedMask = 0;
    for (const compName of this._excluded) {
      this._excludedMask |= (this._bitflags.get(compName) || 0);
    }
  }

  matches(entityMask: number): boolean {
    return (entityMask & this._requiredMask) === this._requiredMask && (entityMask & this._excludedMask) === 0;
  }

  addEntity(entityId: Entity): void { this._entities.add(entityId); }
  removeEntity(entityId: Entity): void { this._entities.remove(entityId); }
  hasEntity(entityId: Entity): boolean { return this._entities.has(entityId); }
  markDirty(): void { this._dirty = true; }
  isDirty(): boolean { return this._dirty; }
  markClean(): void { this._dirty = false; }
}

export class ECSManager extends EventEmitter {
    // Using ComponentType.name as key for storing instances.
    // The value is a Map of Entity -> ComponentInstance (of type T)
    private components = new Map<string, Map<Entity, any>>();

    private nextEntityId: Entity = 0;
    private removedEntities: Entity[] = [];
    private entities: SparseSet = new SparseSet(DEFAULT_ENTITY_POOL_SIZE);
    private entityMasks: Map<Entity, number> = new Map();
    private entityComponentNames: Map<Entity, Set<string>> = new Map(); // Stores names of components for an entity
    private componentNameBitflags: Map<string, number> = new Map(); // Component name to bitflag
    private nextComponentBitflag: number = 1;

    private queries: Map<QueryId, Query> = new Map();
    private kernelRef?: ZenithKernel;
    private systems: BaseSystem[] = [];

    constructor() { super(); }

    setKernel(kernel: ZenithKernel) { this.kernelRef = kernel; }
    getSystems(): BaseSystem[] { return [...this.systems]; }

    get kernel(): ZenithKernel {
        if (!this.kernelRef) throw new Error("Kernel reference not set in ECSManager.");
        return this.kernelRef;
    }

    addSystem(system: BaseSystem) {
        this.systems.push(system);
        system.ecs = this; 
        if (typeof system?.onLoad === "function") { system.onLoad(); }
    }

    updateSystems() { // Renamed from update to avoid conflict if EventEmitter has update
        for (const system of this.systems) { system.update(); }
    }

    createEntity(): Entity {
        const entityId: Entity = this.removedEntities.length > 0 ? this.removedEntities.pop()! : this.nextEntityId++;
        this.entities.add(entityId);
        this.entityMasks.set(entityId, 0);
        this.entityComponentNames.set(entityId, new Set());
        this.emit('entityCreated', entityId);
        return entityId;
    }

    destroyEntity(entity: Entity): void {
        if (!this.entities.has(entity)) return;

        const componentNames = this.entityComponentNames.get(entity);
        if (componentNames) {
            // Iterate over a copy for safe removal
            [...componentNames].forEach(compName => this.removeComponentByTypeName(entity, compName));
        }

        this.entities.remove(entity);
        this.entityMasks.delete(entity);
        this.entityComponentNames.delete(entity);
        this.removedEntities.push(entity);
        this.emit('entityRemoved', entity);
    }
    
    // Helper to get component name from type
    private _getComponentTypeName<T>(type: ComponentType<T>): string {
        return type.typeName || type.name;
    }

    /**
     * Add a component instance to an entity. If a component of this type already exists,
     * its instance is replaced with the new one.
     */
    addComponent<T>(entity: Entity, type: ComponentType<T>, instance: T): T {
        const typeName = this._getComponentTypeName(type);

        if (!this.entities.has(entity)) {
            console.warn(`ECSManager: Entity ${entity} does not exist. Component ${typeName} not added.`);
            // Optionally create entity: this.createEntity() if entity is this one.
            // Or throw an error if entities must pre-exist. For now, let's be lenient and just warn.
            // To strictly follow the previous logic where it might add entity:
            // if (!this.entities.has(entity)) this.createEntity(); // if entity === this.nextEntityId-1 for new
            // Better to ensure entity exists or handle its creation explicitly.
        }
        
        let componentMap = this.components.get(typeName);
        if (!componentMap) {
            componentMap = new Map<Entity, T>();
            this.components.set(typeName, componentMap);
        }
        componentMap.set(entity, instance); // Add or replace instance

        if (!this.componentNameBitflags.has(typeName)) {
            const bitflag = this.nextComponentBitflag;
            this.nextComponentBitflag <<= 1; // Use bitwise shift for powers of 2
            this.componentNameBitflags.set(typeName, bitflag);
            this.queries.forEach(query => {
                if (query.required.includes(typeName) || query.excluded.includes(typeName)) {
                    query.setBitflags(typeName, bitflag);
                }
            });
        }

        const entityComponents = this.entityComponentNames.get(entity) || new Set();
        entityComponents.add(typeName);
        this.entityComponentNames.set(entity, entityComponents); // Ensure map has the set

        const bitflag = this.componentNameBitflags.get(typeName)!;
        const currentMask = this.entityMasks.get(entity) || 0;
        this.entityMasks.set(entity, currentMask | bitflag);

        this._updateEntityQueries(entity);
        this.emit('componentAdded', { entity, componentType: typeName, instance });
        return instance;
    }

    /**
     * Updates an existing component's data on an entity.
     * Returns true if updated, false if component or entity not found.
     * For components like SignalECSComponent, this updates its 'data' property.
     */
    updateComponent<T extends { data?: any }>(
        entity: Entity,
        type: ComponentType<T>,
        updatedData: Partial<T extends SignalECSComponent ? T['data'] : T> // Prioritize T['data'] if T is SignalECSComponent
    ): boolean {
        const typeName = this._getComponentTypeName(type);
        const componentMap = this.components.get(typeName);
        if (!componentMap || !componentMap.has(entity)) {
            console.warn(`ECSManager: Component ${typeName} not found on entity ${entity} for update.`);
            return false;
        }

        const currentInstance = componentMap.get(entity) as T;

        // Special handling for SignalECSComponent: update its 'data' property
        if (currentInstance instanceof SignalECSComponent && typeof currentInstance.data === 'object' && currentInstance.data !== null) {
            Object.assign(currentInstance.data, updatedData as Partial<SignalComponentData>);
        } else if (typeof currentInstance === 'object' && currentInstance !== null) {
            // Generic update for other component types by merging properties
            Object.assign(currentInstance, updatedData as Partial<T>);
        } else {
            // If component is not an object or has no 'data', replace (though this path is less common for "updates")
            // This case would imply updatedData should be a full T instance
            // For now, we focus on object-based components
             console.warn(`ECSManager: Component ${typeName} on entity ${entity} is not an updatable object.`);
             return false;
        }
        
        this.emit('componentUpdated', { entity, componentType: typeName, instance: currentInstance });
        // Note: Query updates are typically based on component presence/absence (masks).
        // If queries depend on component *data values*, they need a different mechanism or re-filtering.
        return true;
    }


    getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
        const typeName = this._getComponentTypeName(type);
        return this.components.get(typeName)?.get(entity) as T | undefined;
    }

    removeComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
        const typeName = this._getComponentTypeName(type);
        return this.removeComponentByTypeName(entity, typeName);
    }

    private removeComponentByTypeName(entity: Entity, typeName: string): boolean {
        if (!this.entities.has(entity)) return false;

        const componentMap = this.components.get(typeName);
        const existed = componentMap?.delete(entity) || false;
        if (componentMap && componentMap.size === 0) {
            this.components.delete(typeName);
        }

        const entityComponents = this.entityComponentNames.get(entity);
        if (entityComponents?.delete(typeName)) {
            const bitflag = this.componentNameBitflags.get(typeName);
            if (bitflag !== undefined) {
                const currentMask = this.entityMasks.get(entity) || 0;
                this.entityMasks.set(entity, currentMask & ~bitflag);
                this._updateEntityQueries(entity);
            }
            this.emit('componentRemoved', { entity, componentType: typeName });
            return true;
        }
        return existed;
    }

    private _updateEntityQueries(entity: Entity): void {
        const mask = this.entityMasks.get(entity) || 0;
        this.queries.forEach(query => {
            const matches = query.matches(mask);
            const hasEntity = query.hasEntity(entity);
            if (matches && !hasEntity) query.addEntity(entity);
            else if (!matches && hasEntity) query.removeEntity(entity);
        });
    }

    removeSystem(system: BaseSystem) {
        const index = this.systems.indexOf(system);
        if (index !== -1) this.systems.splice(index, 1);
    }
    
    // Kept for API compatibility, but prefer query-based access
    getEntitiesWith<T>(type: ComponentType<T>): [Entity, T][] {
        const typeName = this._getComponentTypeName(type);
        const map = this.components.get(typeName);
        return map ? Array.from(map.entries()) as [Entity, T][] : [];
    }

    defineQuery(id: QueryId, requiredNames: string[] = [], excludedNames: string[] = []): Query {
        if (this.queries.has(id)) throw new Error(`Query ${id} already exists`);
        const query = new Query(id, requiredNames, excludedNames);
        
        const allQueryComponentNames = new Set([...requiredNames, ...excludedNames]);
        allQueryComponentNames.forEach(compName => {
            if (!this.componentNameBitflags.has(compName)) {
                const bitflag = this.nextComponentBitflag;
                this.nextComponentBitflag <<= 1;
                this.componentNameBitflags.set(compName, bitflag);
            }
            query.setBitflags(compName, this.componentNameBitflags.get(compName)!);
        });
        
        this.entities.entities.forEach(entityId => {
            const mask = this.entityMasks.get(entityId) || 0;
            if (query.matches(mask)) query.addEntity(entityId);
        });
        this.queries.set(id, query);
        return query;
    }

    getQuery(id: QueryId): Query | undefined { return this.queries.get(id); }
    removeQuery(id: QueryId): void { this.queries.delete(id); }
    
    dumpComponentMap(): Map<string, Map<number, any>> { return this.components; }

    getEntitiesWithQuery(queryId: QueryId): Entity[] {
        const query = this.queries.get(queryId);
        if (!query) throw new Error(`Query ${queryId} does not exist`);
        return Array.from(query.entities);
    }

    hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
        const typeName = this._getComponentTypeName(type);
        return this.entityComponentNames.get(entity)?.has(typeName) || false;
    }

    getEntityComponents(entity: Entity): string[] {
        return this.entities.has(entity) ? Array.from(this.entityComponentNames.get(entity)!) : [];
    }

    getEntitiesWithComponent(componentTypeName: string): Entity[] {
        const queryId = `__internal_query_for_${componentTypeName}`;
        if (!this.queries.has(queryId)) {
            this.defineQuery(queryId, [componentTypeName]);
        }
        return this.getEntitiesWithQuery(queryId);
    }

    getEntityCount(): number { return this.entities.count; }
    getComponentTypeCount(): number { return this.componentNameBitflags.size; }
    getAllEntities(): Entity[] { return Array.from(this.entities.entities); }

    getPerformanceStats(): { entities: number, components: number, queries: number, recycledEntities: number } {
        return {
            entities: this.entities.count,
            components: this.componentNameBitflags.size,
            queries: this.queries.size,
            recycledEntities: this.removedEntities.length
        };
    }

    static get SparseSet(): typeof SparseSet { return SparseSet; }
}
