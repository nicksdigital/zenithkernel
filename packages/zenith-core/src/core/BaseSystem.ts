import { ECSManager } from "./ECSManager";
import { Entity, ComponentType } from "./ECSManager";
import { ZenithKernel } from "./ZenithKernel";

export abstract class BaseSystem {
    public ecs!: ECSManager;
    protected kernel: ZenithKernel;

    abstract onLoad?():void;
    abstract onUnload?():void;

    constructor(kernel: ZenithKernel) {
        this.kernel = kernel;
        this.ecs = kernel.getECS();
    }

    /**
     * Called every tick, intended to be invoked by the scheduler.
     * @param deltaTime Time elapsed since the last update in milliseconds
     */
    abstract update(deltaTime?: number): void;

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
