import { RegisterSystem } from "@decorators/RegisterSystem";
import { SystemMeta } from "@components/SystemMeta";
import { routeMap } from "@decorators/HttpRoute";
import type { Entity } from "@core/ECS";
import type { BaseSystem } from "@core/BaseSystem";

interface SystemComponentConfig<T = any> {
    label: string;
    tags?: string[];
    version?: string;
    component?: new (...args: any[]) => T;
    props?: T;
}

type Constructor<T = {}> = new (...args: any[]) => T;

export function SystemComponent<T = any>(
    config: SystemComponentConfig<T>
): ClassDecorator {
    // @ts-ignore
    return <U extends Constructor<BaseSystem>>(Target: U): U => {
        @RegisterSystem(Target.name)
        // @ts-ignore
        class WrappedSystem extends Target {
            public entity!: Entity;

            constructor(...args: any[]) {
                super(...args);

                if (this.ecs) {
                    this.entity = this.ecs.createEntity();

                    const Ctor = config.component ?? SystemMeta;

                    const instance = new SystemMeta(config.label, config.tags ?? [], config.version ?? "0.1.0");
                    
                    this.ecs.addComponent<SystemMeta>(this.entity, SystemMeta, instance);
                }
            }
        }

        Object.defineProperty(WrappedSystem, "name", {
            value: Target.name,
            writable: false,
        });

        // ✅ Ensure routes on original class are carried forward
        if (routeMap.has(Target)) {
            routeMap.set(WrappedSystem, routeMap.get(Target)!);
        }

        return WrappedSystem as U;
    };
}
