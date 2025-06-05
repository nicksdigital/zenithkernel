import { ExposeRest } from "@decorators/ExposeRest";
import { HttpRoute } from "@decorators/HttpRoute";
import { EntityBackedSystem } from "@core/EntityBackedSystem";
import { SystemComponent } from "@decorators/SystemComponent";
import type { Entity } from "@core/ECS";
import type { BaseSystem } from "@core/BaseSystem";
import { SystemMeta } from "@components/SystemMeta";

interface SystemInfo {
    name: string;
    entity: Entity | null;
    tags?: string[];
}

interface ComponentInfo {
    entity: Entity;
    component: string;
    value: unknown;
}

@ExposeRest("AdminServer")
@SystemComponent({
    label: "AdminServer",
    tags: ["admin", "dashboard", "monitoring"]
})
export class AdminServer extends EntityBackedSystem {
    private lastSystemsUpdate: SystemInfo[] = [];
    private lastUpdateTime = 0;
    private readonly CACHE_TTL = 5000; // 5 seconds cache TTL

    update(): void {
        // Optional: Perform any periodic admin operations here
    }

    @HttpRoute("GET", "/admin/systems")
    getSystems(): SystemInfo[] {
        try {
            // Use caching to improve performance for frequent calls
            const now = Date.now();
            if (now - this.lastUpdateTime < this.CACHE_TTL && this.lastSystemsUpdate.length > 0) {
                return this.lastSystemsUpdate;
            }

            const systems = this.ecs.getSystems().map(sys => ({
                name: sys.constructor.name,
                entity: (sys as unknown as { entity?: Entity }).entity ?? null,
                tags: this.getSystemTags(sys),
            }));

            // Update cache
            this.lastSystemsUpdate = systems;
            this.lastUpdateTime = now;
            
            return systems;
        } catch (error) {
            console.error("Error getting systems:", error);
            return [];
        }
    }

    @HttpRoute("GET", "/admin/entities")
    getEntities(): ComponentInfo[] {
        try {
            const components: ComponentInfo[] = [];
            
            // Using proper typing instead of @ts-ignore
            const componentMap = this.ecs.dumpComponentMap() as Map<string, Map<Entity, unknown>>;
            
            for (const [type, map] of componentMap.entries()) {
                for (const [entity, value] of map.entries()) {
                    components.push({ 
                        entity, 
                        component: type, 
                        value 
                    });
                }
            }
            
            return components;
        } catch (error) {
            console.error("Error getting entities:", error);
            return [];
        }
    }

    @HttpRoute("GET", "/admin/health")
    getHealthStatus() {
        return { 
            status: "healthy", 
            systemCount: this.ecs.getSystems().length,
            timestamp: new Date().toISOString()
        };
    }
    
    private getSystemTags(system: BaseSystem): string[] {
        try {
            const entityId = (system as unknown as { entity?: Entity }).entity;
            if (!entityId) return [];
            // Use getComponent with SystemMeta
            const metaComponent = this.ecs.getComponent(entityId, SystemMeta);
            return metaComponent?.tags || [];
        } catch {
            return [];
        }
    }
}
