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

// Component serialization/deserialization function types
export type ComponentSerializer<T> = (component: T) => any;
export type ComponentDeserializer<T> = (data: any) => T;

const DEFAULT_ENTITY_POOL_SIZE = 10000;
const DEBUG_ECS = false; // Set to true for verbose ECS logging

const logDebug = (message: string, ...args: any[]) => {
    if (DEBUG_ECS) console.log(`[ECSManager DEBUG] ${message}`, ...args);
};

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
      this.resize(Math.max(id + 1, this.sparse.length * 2)); // Resize more aggressively
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
    this.dense[this._count - 1] = 0; // Clear the last spot
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
    logDebug(`SparseSet resizing sparse from ${this.sparse.length} to ${newCapacity}`);
    const newSparse = new Uint32Array(newCapacity);
    newSparse.set(this.sparse);
    this.sparse = newSparse;

    if (newCapacity > this.dense.length) {
        logDebug(`SparseSet resizing dense from ${this.dense.length} to ${newCapacity}`);
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
    this._entities = new SparseSet(); // Each query has its own SparseSet for its entities
  }

  get id(): QueryId { return this._id; }
  get required(): string[] { return [...this._required]; }
  get excluded(): string[] { return [...this._excluded]; }
  get entities(): Uint32Array { return this._entities.entities; }
  get count(): number { return this._entities.count; }

  setBitflags(componentName: string, flag: number): void {
    this._bitflags.set(componentName, flag);
    this._recalculateMasks();
    this._dirty = true; // Mark query as dirty when its structure changes
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
    const matchesRequired = (entityMask & this._requiredMask) === this._requiredMask;
    const matchesExcluded = (entityMask & this._excludedMask) === 0;
    return matchesRequired && matchesExcluded;
  }

  addEntity(entityId: Entity): void { this._entities.add(entityId); }
  removeEntity(entityId: Entity): void { this._entities.remove(entityId); }
  hasEntity(entityId: Entity): boolean { return this._entities.has(entityId); }
  markDirty(): void { this._dirty = true; }
  isDirty(): boolean { return this._dirty; } // Queries can become dirty if component types are added/removed globally
  markClean(): void { this._dirty = false; }
}

export class ECSManager extends EventEmitter {
    // Component type registry for serialization/deserialization
    private componentTypes = new Map<string, ComponentType<any>>();
    private componentSerializers = new Map<string, ComponentSerializer<any>>();
    private componentDeserializers = new Map<string, ComponentDeserializer<any>>(); 
    private components = new Map<string, Map<Entity, any>>();
    private nextEntityId: Entity = 0;
    private removedEntities: Entity[] = [];
    private entities: SparseSet = new SparseSet(DEFAULT_ENTITY_POOL_SIZE);
    private entityMasks: Map<Entity, number> = new Map();
    private entityComponentNames: Map<Entity, Set<string>> = new Map();
    private componentNameBitflags: Map<string, number> = new Map();
    private nextComponentBitflag: number = 1;
    private queries: Map<QueryId, Query> = new Map();
    private kernelRef?: ZenithKernel;
    private systems: BaseSystem[] = [];
    private entityNames: Map<string, Entity> = new Map(); // For getEntityByName

    constructor() { super(); }

    setKernel(kernel: ZenithKernel) { this.kernelRef = kernel; }
    getSystems(): BaseSystem[] { return [...this.systems]; }

    get kernel(): ZenithKernel {
        if (!this.kernelRef) throw new Error("ECSManager: Kernel reference not set.");
        return this.kernelRef;
    }

    addSystem(system: BaseSystem) {
        if (!system) {
            console.warn('[ECSManager] Attempted to add undefined system');
            return;
        }
        
        this.systems.push(system);
        
        if (typeof system.init === 'function') {
            system.init();
        } else {
            logDebug(`System ${system.constructor.name} has no init method`);
        }
    }
    
    /**
     * Register a system with the ECS manager
     * @param system System instance to register
     */
    registerSystem(system: BaseSystem): void {
        if (!system) {
            console.warn('[ECSManager] Attempted to register undefined system');
            return;
        }
        
        // Check if system already exists
        if (this.systems.includes(system)) {
            console.warn('[ECSManager] System already registered', system);
            return;
        }
        
        this.addSystem(system);
        logDebug(`Registered system: ${system.constructor.name}`);
    }

    updateSystems() { 
        for (const system of this.systems) { system.update(); }
    }

    createEntity(): Entity {
        const entityId: Entity = this.removedEntities.length > 0 ? this.removedEntities.pop()! : this.nextEntityId++;
        this.entities.add(entityId);
        this.entityMasks.set(entityId, 0);
        this.entityComponentNames.set(entityId, new Set());
        logDebug(`Entity created: ${entityId}`);
        this.emit('entityCreated', entityId);
        return entityId;
    }

    destroyEntity(entity: Entity): void {
        if (!this.entities.has(entity)) {
            logDebug(`Attempted to destroy non-existent entity: ${entity}`);
            return;
        }

        const componentNames = this.entityComponentNames.get(entity);
        if (componentNames) {
            [...componentNames].forEach(compName => this.removeComponentByTypeName(entity, compName, true)); // Pass internal flag
        }

        this.entities.remove(entity);
        this.entityMasks.delete(entity);
        this.entityComponentNames.delete(entity);
        this.removedEntities.push(entity);
        logDebug(`Entity destroyed: ${entity}`);
        this.emit('entityRemoved', entity);
    }
    
    private _getComponentTypeName<T>(type: ComponentType<T>): string {
        return type.typeName || type.name;
    }

    addComponent<T>(entity: Entity, type: ComponentType<T>, instance: T): T {
        const typeName = this._getComponentTypeName(type);

        if (!this.entities.has(entity)) {
            logDebug(`Entity ${entity} not tracked, adding implicitly with component ${typeName}.`);
            this.entities.add(entity); 
            this.entityMasks.set(entity, 0); 
            this.entityComponentNames.set(entity, new Set()); 
            if (entity >= this.nextEntityId) {
                this.nextEntityId = entity + 1;
            }
        }
        
        let componentMap = this.components.get(typeName);
        if (!componentMap) {
            componentMap = new Map<Entity, T>();
            this.components.set(typeName, componentMap);
        }
        const existingInstance = componentMap.get(entity);
        componentMap.set(entity, instance); 

        if (!this.componentNameBitflags.has(typeName)) {
            const bitflag = this.nextComponentBitflag;
            this.nextComponentBitflag <<= 1; 
            if (this.nextComponentBitflag === 0) { // Overflowed bitflags
                console.error("ECSManager: Component bitflag overflow! Too many component types.");
                // Consider a different strategy or error handling here
            }
            this.componentNameBitflags.set(typeName, bitflag);
            logDebug(`Assigned bitflag ${bitflag} to component type ${typeName}`);
            // Mark all queries as dirty because a new component type might affect them
            this.queries.forEach(query => query.markDirty());
        }

        const entityComponentsSet = this.entityComponentNames.get(entity)!; 
        const hadComponentBefore = entityComponentsSet.has(typeName);
        entityComponentsSet.add(typeName);

        const bitflag = this.componentNameBitflags.get(typeName)!;
        const currentMask = this.entityMasks.get(entity)!; 
        const newMask = currentMask | bitflag;

        if (currentMask !== newMask) { // Mask changes only if component type was newly added
            this.entityMasks.set(entity, newMask);
            this._updateEntityQueries(entity);
        }
        
        logDebug(`Component ${typeName} ${existingInstance ? 'updated on' : 'added to'} entity ${entity}. Mask: ${newMask.toString(2)}`);
        this.emit('componentAdded', { entity, componentType: typeName, instance }); // Emits even if instance was replaced
        if (typeName === "EntityNameComponent" && instance && typeof (instance as any).name === 'string') {
            const entityName = (instance as any).name;
            if (this.entityNames.has(entityName) && this.entityNames.get(entityName) !== entity) {
                logDebug(`Warning: Entity name "${entityName}" was already registered to entity ${this.entityNames.get(entityName)}. Re-registering to ${entity}.`);
            }
            this.entityNames.set(entityName, entity);
            logDebug(`Entity ${entity} named "${entityName}"`);
        }

        return instance;
    }

    updateComponent<T extends { data?: any }>(
        entity: Entity,
        type: ComponentType<T>,
        updatedData: Partial<T extends SignalECSComponent ? T['data'] : T> 
    ): boolean {
        const typeName = this._getComponentTypeName(type);
        const componentMap = this.components.get(typeName);
        if (!componentMap || !componentMap.has(entity)) {
            logDebug(`Update failed: Component ${typeName} not found on entity ${entity}.`);
            return false;
        }

        const currentInstance = componentMap.get(entity) as T;

        if (currentInstance instanceof SignalECSComponent && typeof currentInstance.data === 'object' && currentInstance.data !== null) {
            Object.assign(currentInstance.data, updatedData as Partial<SignalComponentData>);
             logDebug(`Component ${typeName} (SignalECSComponent data) updated on entity ${entity}.`);
        } else if (typeof currentInstance === 'object' && currentInstance !== null) {
            Object.assign(currentInstance, updatedData as Partial<T>);
            logDebug(`Component ${typeName} (generic object) updated on entity ${entity}.`);
        } else {
             console.warn(`ECSManager: Component ${typeName} on entity ${entity} is not an updatable object.`);
             return false;
        }
        
        this.emit('componentUpdated', { entity, componentType: typeName, instance: currentInstance });
        return true;
    }


    getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
        const typeName = this._getComponentTypeName(type);
        const instance = this.components.get(typeName)?.get(entity) as T | undefined;
        logDebug(`getComponent ${typeName} for entity ${entity}: ${instance ? 'found' : 'not found'}`);
        return instance;
    }

    removeComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
        const typeName = this._getComponentTypeName(type);
        return this.removeComponentByTypeName(entity, typeName);
    }

    private removeComponentByTypeName(entity: Entity, typeName: string, isDestroyingEntity: boolean = false): boolean {
        if (!this.entities.has(entity)) {
            logDebug(`Remove failed: Entity ${entity} not found.`);
            return false;
        }

        const componentMap = this.components.get(typeName);
        const existedInMap = componentMap?.delete(entity) || false;
        if (componentMap && componentMap.size === 0) {
            this.components.delete(typeName);
        }

        const entityComponents = this.entityComponentNames.get(entity);
        let existedInEntitySet = false;
        if (entityComponents?.delete(typeName)) {
            existedInEntitySet = true;
            const bitflag = this.componentNameBitflags.get(typeName);
            if (bitflag !== undefined) {
                const currentMask = this.entityMasks.get(entity) || 0;
                this.entityMasks.set(entity, currentMask & ~bitflag);
                if (!isDestroyingEntity) { // Avoid redundant query updates if entity is being destroyed anyway
                    this._updateEntityQueries(entity);
                }
            }
            logDebug(`Component ${typeName} removed from entity ${entity}.`);
            this.emit('componentRemoved', { entity, componentType: typeName });
        }
        return existedInMap || existedInEntitySet; 
    }

    private _updateEntityQueries(entity: Entity): void {
        const mask = this.entityMasks.get(entity) || 0;
        logDebug(`Updating queries for entity ${entity} with mask ${mask.toString(2)}`);
        this.queries.forEach(query => {
            const wasInQuery = query.hasEntity(entity);
            const shouldBeInQuery = query.matches(mask);

            if (shouldBeInQuery && !wasInQuery) {
                query.addEntity(entity);
                logDebug(`Entity ${entity} added to query ${query.id}`);
            } else if (!shouldBeInQuery && wasInQuery) {
                query.removeEntity(entity);
                logDebug(`Entity ${entity} removed from query ${query.id}`);
            }
        });
    }

    removeSystem(system: BaseSystem) {
        const index = this.systems.indexOf(system);
        if (index !== -1) this.systems.splice(index, 1);
        logDebug(`System removed: ${system.constructor.name}`);
    }
    
    getEntitiesWith<T>(type: ComponentType<T>): [Entity, T][] {
        const typeName = this._getComponentTypeName(type);
        const map = this.components.get(typeName);
        return map ? Array.from(map.entries()) as [Entity, T][] : [];
    }

    defineQuery(id: QueryId, requiredNames: string[] = [], excludedNames: string[] = []): Query {
        if (this.queries.has(id)) throw new Error(`Query ${id} already exists`);
        const query = new Query(id, requiredNames, excludedNames);
        logDebug(`Defining query ${id}: Required [${requiredNames.join(', ')}], Excluded [${excludedNames.join(', ')}]`);
        
        const allQueryComponentNames = new Set([...requiredNames, ...excludedNames]);
        allQueryComponentNames.forEach(compName => {
            if (!this.componentNameBitflags.has(compName)) {
                const bitflag = this.nextComponentBitflag;
                this.nextComponentBitflag <<= 1;
                 if (this.nextComponentBitflag === 0) console.error("ECSManager: Component bitflag overflow!");
                this.componentNameBitflags.set(compName, bitflag);
                logDebug(`Assigned new bitflag ${bitflag} to component type ${compName} for query ${id}`);
            }
            query.setBitflags(compName, this.componentNameBitflags.get(compName)!);
        });
        
        for(let i = 0; i < this.entities.count; i++) {
            const entityId = this.entities.entities[i];
            const mask = this.entityMasks.get(entityId) || 0;
            if (query.matches(mask)) query.addEntity(entityId);
        }
        this.queries.set(id, query);
        logDebug(`Query ${id} defined with ${query.count} initial entities.`);
        return query;
    }

    getQuery(id: QueryId): Query | undefined { return this.queries.get(id); }
    removeQuery(id: QueryId): void { this.queries.delete(id); logDebug(`Query ${id} removed.`); }
    
    dumpComponentMap(): Map<string, Map<number, any>> { return this.components; }

    getEntitiesWithQuery(queryId: QueryId): Entity[] {
        const query = this.queries.get(queryId);
        if (!query) throw new Error(`Query ${queryId} does not exist`);
        if (query.isDirty()) {
             logDebug(`Query ${queryId} was dirty, re-evaluating.`);
             // This re-evaluation logic should be efficient and correct.
             // It's generally better if _updateEntityQueries keeps queries consistent.
             // However, if a component type is added/removed *globally*, queries might become dirty.
             this.entities.entities.forEach(entityId => {
                 const mask = this.entityMasks.get(entityId) || 0;
                 const matches = query.matches(mask);
                 const hasEntityInQuery = query.hasEntity(entityId);
                 if(matches && !hasEntityInQuery) query.addEntity(entityId);
                 else if (!matches && hasEntityInQuery) query.removeEntity(entityId);
             });
            query.markClean();
        }
        return Array.from(query.entities);
    }

    hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
        const typeName = this._getComponentTypeName(type);
        return this.entityComponentNames.get(entity)?.has(typeName) || false;
    }

    getEntityComponents(entity: Entity): string[] {
        return this.entities.has(entity) ? Array.from(this.entityComponentNames.get(entity)!) : [];
    }

    /**
     * Register a component type for serialization/deserialization
     * @param typeName String identifier for the component type
     * @param componentType Constructor function for the component
     * @param serializer Optional function to serialize component data
     * @param deserializer Optional function to deserialize component data
     */
    registerComponentType<T>(
        typeName: string, 
        componentType: ComponentType<T>,
        serializer?: ComponentSerializer<T>,
        deserializer?: ComponentDeserializer<T>
    ): void {
        // Store the component type constructor
        if (componentType && typeof componentType === 'function') {
            // Add typeName property to the component constructor if not already there
            if (!componentType.typeName) {
                componentType.typeName = typeName;
            }
            
            this.componentTypes.set(typeName, componentType);
            
            // Log registration if debug mode is on
            if (DEBUG_ECS) {
                console.log(`[ECSManager] Registered component type: ${typeName}`);
            }
            
            // Register optional serializers/deserializers if provided
            if (serializer) {
                this.componentSerializers.set(typeName, serializer);
            }
            
            if (deserializer) {
                this.componentDeserializers.set(typeName, deserializer);
            }
        } else {
            throw new Error(`Invalid component type provided for ${typeName}`);
        }
    }
    
    /**
     * Get a registered component type by name
     * @param typeName Type name of the component
     */
    getComponentType<T>(typeName: string): ComponentType<T> | undefined {
        return this.componentTypes.get(typeName) as ComponentType<T> | undefined;
    }
    
    /**
     * Serialize a component instance
     * @param typeName Component type name
     * @param component Component instance
     */
    serializeComponent<T>(typeName: string, component: T): any {
        const serializer = this.componentSerializers.get(typeName);
        if (serializer) {
            return serializer(component);
        }
        return component; // Return as-is if no serializer registered
    }
    
    /**
     * Deserialize component data
     * @param typeName Component type name
     * @param data Serialized component data
     */
    deserializeComponent<T>(typeName: string, data: any): T {
        const deserializer = this.componentDeserializers.get(typeName);
        if (deserializer) {
            return deserializer(data);
        }
        
        // If no deserializer but we have the component type, try to instantiate it
        const componentType = this.componentTypes.get(typeName);
        if (componentType) {
            try {
                return new componentType(data) as T;
            } catch (e) {
                console.error(`Error deserializing component ${typeName}:`, e);
            }
        }
        
        // If all else fails, return the data as-is
        return data as T;
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
