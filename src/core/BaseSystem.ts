import { ECSManager } from "./ECSManager";
import { Entity, ComponentType } from "./ECSManager";

export abstract class BaseSystem {
    public ecs!: ECSManager;

    abstract onLoad?():void;
    abstract onUnload?():void;

    constructor(ecs: ECSManager) {}

    /**
     * Called every tick, intended to be invoked by the scheduler.
     */
    abstract update(): void;

    /**
     * Convenience method to query all entities with a given component.
     */
    protected query<T>(component: ComponentType<T>): [Entity, T][] {
        return this.ecs.getEntitiesWith(component);
    }

    /**
     * Optional: override to run on system start.
     */
    init?(): void;

    /**
     * Optional: cleanup logic
     */
    dispose?(): void;
}
