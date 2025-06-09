import { EntityBackedSystem } from "@core/EntityBackedSystem";
import type { Entity } from "@core/ECS";
import { ECSManager } from "@core/ECSManager";
import { SignalManager } from "@core/SignalManager";

export interface SystemInfo {
    name: string;
    entity: Entity | null;
    tags?: string[];
}

export interface ComponentInfo {
    entity: Entity;
    component: string;
    value: unknown;
}

export interface Component {
    entity: Entity;
    component: string;
    value: unknown;
}

export abstract class ComponentEntity extends EntityBackedSystem implements Component {
    private lastComponentsUpdate: ComponentInfo[] = [];
    private lastUpdateTime = 0;
    private readonly CACHE_TTL = 5000; // 5 seconds cache TTL

    entity: Entity;
    component: string;
    value: unknown;

    constructor(
        ecs: ECSManager,
        signalManager: SignalManager,
        entity: Entity,
        component: string,
        value: unknown
    ) {
        super(ecs);
        this.entity = entity;
        this.component = component;
        this.value = value;
    }
}