// modules/HealthSystem.ts
import { BaseSystem } from "../core/BaseSystem";

class Health {
    constructor(public hp = 100) {}
}

export class HealthSystem extends BaseSystem {
    update(): void {
        for (const [entity, health] of this.query(Health)) {
            if (health.hp <= 0) {
                this.ecs.destroyEntity(entity);
            }
        }
    }
}
