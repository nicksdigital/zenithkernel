import { ComponentType, Entity } from "../types";

export class ECSManager {
    private nextEntityId: Entity = 0;
    private components = new Map<string, Map<Entity, any>>();

    createEntity(): Entity {
        return this.nextEntityId++;
    }

    destroyEntity(entity: Entity): void {
        for (const compMap of this.components.values()) {
            compMap.delete(entity);
        }
    }

    addComponent<T>(entity: Entity, type: ComponentType<T>, instance: T): void {
        const typeName = type.name;
        if (!this.components.has(typeName)) {
            this.components.set(typeName, new Map());
        }
        this.components.get(typeName)!.set(entity, instance);
    }

    getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
        return this.components.get(type.name)?.get(entity);
    }

    removeComponent<T>(entity: Entity, type: ComponentType<T>): void {
        this.components.get(type.name)?.delete(entity);
    }

    getEntitiesWith<T>(type: ComponentType<T>): [Entity, T][] {
        const map = this.components.get(type.name);
        if (!map) return [];
        return Array.from(map.entries()) as [Entity, T][];
    }
}
