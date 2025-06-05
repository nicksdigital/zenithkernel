import { BaseSystem } from "./BaseSystem";
import { ECSManager } from "./ECSManager";
import { Entity } from "./ECS";

export abstract class EntityBackedSystem extends BaseSystem {
    protected entity!: Entity;

    onLoad(): void {
        this.entity = this.ecs.createEntity();
    }

    onUnload(): void {
        this.ecs.destroyEntity(this.entity);
    }
}
