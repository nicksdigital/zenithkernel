import { BehaviorSubject } from "rxjs";
import { Signal } from "../../../core/reactive-state";
import { RouteMatchResult, RouterState } from "../types";

/**
 * Stores the current routing state in the ECS
 */
export class RouterComponent {
  // Route definitions
  routes: any[] = [];
  
  // Current matched route
  currentRoute: RouteMatchResult | null = null;
  
  // Router state including navigation capabilities
  state: RouterState = {
    currentRoute: null,
    canGoBack: false,
    canGoForward: false,
    isLoading: false
  };
  
  // Reactive state for router (RxJS)
  routerState$ = new BehaviorSubject<RouterState>(this.state);
  currentRoute$ = new BehaviorSubject<RouteMatchResult | null>(null);
  
  // Reactive state for router (Signals)
  routerStateSignal = new Signal<RouterState>(this.state);
  currentRouteSignal = new Signal<RouteMatchResult | null>(null);
  
  // Navigation tracking for scroll restoration
  lastPosition: Map<string, { x: number, y: number }> = new Map();
  
  // Prefetch cache for route data
  prefetchCache: Map<string, { data: any, timestamp: number }> = new Map();
  
  // Router options
  options = {
    cacheTime: 300000, // 5 minutes
    scrollRestoration: true
  };
}
