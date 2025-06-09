import { RouterSystem } from '../systems/RouterSystem';
import { getECS } from '@modules/Rendering/utils/kernel-access';

// Singleton instance of RouterSystem from the ECS
let routerSystem: RouterSystem | null = null;

/**
 * Get or initialize the router system from the ECS
 */
export function getRouterSystem(): RouterSystem {
    if (!routerSystem) {
        const ecs = getECS();
        if (!ecs) {
            throw new Error("ECS is not available. Make sure it's initialized");
        }
        
        // Find existing RouterSystem
        const systems = ecs.getSystems();
        routerSystem = systems.find(s => s instanceof RouterSystem) as RouterSystem || null;
        
        if (!routerSystem) {
            // Create new RouterSystem if not found
            routerSystem = new RouterSystem(ecs);
            ecs.addSystem(routerSystem);
        }
    }
    
    return routerSystem;
}

/**
 * Navigate to a path
 */
export function navigate(path: string, options: { replace?: boolean } = {}) {
    return getRouterSystem().navigate(path, options);
}

/**
 * Go back in history
 */
export function back() {
    return getRouterSystem().back();
}

/**
 * Go forward in history
 */
export function forward() {
    return getRouterSystem().forward();
}

/**
 * Prefetch a route
 */
export function prefetch(path: string) {
    return getRouterSystem().prefetch(path);
}

/**
 * Get router state observable
 */
export function getRouterState() {
    return getRouterSystem().getState();
}

/**
 * Get current route observable
 */
export function getCurrentRoute() {
    return getRouterSystem().getCurrentRoute();
}

/**
 * Get router state signal
 */
export function getRouterStateSignal() {
    return getRouterSystem().getStateSignal();
}

/**
 * Get current route signal
 */
export function getCurrentRouteSignal() {
    return getRouterSystem().getCurrentRouteSignal();
}
