import { ZenithKernel } from "@core/ZenithKernel";
import { SystemMeta } from "@components/SystemMeta";
import { routeMap } from "@decorators/HttpRoute";
import { validationMap } from "@decorators/ValidateBody";
import {ComponentType} from "types"

export function generateSystemManifest(kernel: ZenithKernel) {
    const ecsManager = kernel.getECS();
    const systems = ecsManager.getSystems();
    
    function extractRoutes(system: any) {
        const routeBindings = routeMap.get(system.constructor) ?? [];
        return routeBindings.map(route => {
            const validationSchema = validationMap.get(system.constructor)?.get(route.handlerName);
            return {
                method: route.method,
                path: route.path,
                handler: route.handlerName,
                hasValidation: Boolean(validationSchema),
            };
        });
    }
    
    return systems.map(system => {
        const systemName = system.constructor.name;
        const associatedEntity = (system as any).entity;
        
        // Get component using the correctly imported SystemMeta class
        const meta = associatedEntity !== undefined
            ? ecsManager.getComponent(associatedEntity, SystemMeta as unknown as ComponentType<SystemMeta>)
            : undefined;
            
        const routes = extractRoutes(system);
        return {
            name: systemName,
            entity: associatedEntity,
            meta,
            routes,
        };
    });
}