import { RoutingSystem } from "./RoutingSystem";
import { RouteDefinition, RouteMatchResult, RouterState } from "./types";
import { HistoryAdapter } from "./adapters/HistoryAdapter";
import { BrowserHistoryAdapter } from "./adapters/BrowserHistoryAdapter";
import { MemoryHistoryAdapter } from "./adapters/MemoryHistoryAdapter";
import { MiddlewareSystem } from "./middleware/MiddlewareSystem";

// Get reference to the routing system for public API
import { getECS } from "../../modules/Rendering/utils/kernel-access";

const ecs = getECS();
const systems = ecs?.getSystems() || [];
const router = systems.find(s => s instanceof RoutingSystem) as RoutingSystem;

// Export public API
export const navigate = router ? router.navigate.bind(router) : () => {};
export const back = router ? router.back.bind(router) : () => {};
export const forward = router ? router.forward.bind(router) : () => {};
export const prefetch = router ? router.prefetch.bind(router) : async () => {};

// Export reactive state
export const routerState$ = router ? router.getState() : null;
export const currentRoute$ = router ? router.getCurrentRoute() : null;
export const routerStateSignal = router ? router.getStateSignal() : null;
export const currentRouteSignal = router ? router.getCurrentRouteSignal() : null;

// Export types
export { 
  RouteDefinition, 
  RouteMatchResult, 
  RouterState,
  HistoryAdapter,
  BrowserHistoryAdapter,
  MemoryHistoryAdapter,
  RoutingSystem,
  MiddlewareSystem
};
