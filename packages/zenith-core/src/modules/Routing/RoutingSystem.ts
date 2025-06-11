import { BaseSystem } from "../../core/BaseSystem";
import { ECSManager } from "../../core/ECSManager";
import { Entity } from "../../types";
import { RouterComponent } from "./components/RouterComponent";
import { RouteDefinition, RouteMatchResult } from "./types";
import { BrowserHistoryAdapter } from "./adapters/BrowserHistoryAdapter";
import { HistoryAdapter } from "./adapters/HistoryAdapter";
import { RegisterSystem } from "../../decorators/RegisterSystem";

@RegisterSystem("routing")
export class RoutingSystem extends BaseSystem {
  onUnload?(): void {
    
  }
  private routerEntity: Entity | null = null;
  private historyAdapter: HistoryAdapter;
  
  constructor(ecs: ECSManager) {
    super(ecs.kernel);
    this.historyAdapter = new BrowserHistoryAdapter();
  }
  
  onLoad(): void {
    console.log("🧭 Initializing RoutingSystem");
    
    // Create router entity
    this.routerEntity = this.ecs.createEntity();
    
    // Add router component
    const routerComponent = new RouterComponent();
    this.ecs.addComponent(this.routerEntity, RouterComponent, routerComponent);
    
    // Set up history events if in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handleHistoryChange.bind(this));
    }
  }
  
  update(): void {
    // System update logic runs every frame if needed
  }
  
  /**
   * Registers routes with the router
   */
  registerRoutes(routes: RouteDefinition[]): void {
    if (!this.routerEntity) return;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    if (router) {
      router.routes = [...routes];
      
      // Initial route matching on registration
      if (typeof window !== 'undefined') {
        const path = window.location.pathname + window.location.search;
        const match = this.matchRoute(path);
        if (match) {
          router.currentRoute = match;
          this.updateRouterState(match);
        }
      }
    }
  }
  
  /**
   * Navigate to a specific path
   */
  navigate(to: string, options: { replace?: boolean } = {}): void {
    if (!this.routerEntity) return;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    if (!router) return;
    
    // First check if the route exists
    const match = this.matchRoute(to);
    if (!match) {
      console.warn(`No route match found for: ${to}`);
      return;
    }
    
    // Update history
    this.historyAdapter.navigate(to, options.replace);
    
    // Update router state
    router.currentRoute = match;
    this.updateRouterState(match);
    
    // Emit navigation event
    this.ecs.emit('navigation', { path: to, match });
  }
  
  /**
   * Matches a path to a route definition
   */
  matchRoute(path: string): RouteMatchResult | null {
    if (!this.routerEntity) return null;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    if (!router) return null;
    
    // Parse the path and search params
    const [pathname, search] = path.split('?');
    const searchParams = new URLSearchParams(search);
    
    // Try to match each route
    for (const route of router.routes) {
      // Simple exact match for now
      if (route.path === pathname) {
        return {
          route,
          params: {},
          pathname,
          search: searchParams
        };
      }
      
      // Parse dynamic routes with path parameters
      if (route.path.includes(':')) {
        const routeParts = route.path.split('/').filter(Boolean);
        const pathParts = pathname.split('/').filter(Boolean);
        
        if (routeParts.length !== pathParts.length) continue;
        
        const params: Record<string, string> = {};
        let isMatch = true;
        
        for (let i = 0; i < routeParts.length; i++) {
          const routePart = routeParts[i];
          const pathPart = pathParts[i];
          
          if (routePart.startsWith(':')) {
            // Extract parameter
            const paramName = routePart.substring(1);
            params[paramName] = pathPart;
          } else if (routePart !== pathPart) {
            isMatch = false;
            break;
          }
        }
        
        if (isMatch) {
          return {
            route,
            params,
            pathname,
            search: searchParams
          };
        }
      }
    }
    
    // Check for not found route
    const notFoundRoute = router.routes.find(r => r.path === '*' || r.path === '404');
    if (notFoundRoute) {
      return {
        route: notFoundRoute,
        params: {},
        pathname,
        search: searchParams
      };
    }
    
    return null;
  }
  
  /**
   * Handles history navigation (back/forward)
   */
  private handleHistoryChange(): void {
    if (!this.routerEntity) return;
    
    const path = window.location.pathname + window.location.search;
    const match = this.matchRoute(path);
    
    if (match) {
      const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
      if (router) {
        router.currentRoute = match;
        this.updateRouterState(match);
        this.ecs.emit('navigation', { path, match });
      }
    }
  }
  
  /**
   * Updates the router state with new route information
   */
  private updateRouterState(match: RouteMatchResult): void {
    if (!this.routerEntity) return;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    if (router) {
      router.state = {
        ...router.state,
        currentRoute: match,
        canGoBack: this.historyAdapter.canGoBack(),
        canGoForward: this.historyAdapter.canGoForward()
      };
      
      // Update derived observables
      router.currentRoute$.next(match);
      router.currentRouteSignal.value = match;
      router.routerState$.next(router.state);
      router.routerStateSignal.value = router.state;
    }
  }
  
  /**
   * Navigates backwards in history
   */
  back(): void {
    this.historyAdapter.back();
  }
  
  /**
   * Navigates forwards in history
   */
  forward(): void {
    this.historyAdapter.forward();
  }
  
  /**
   * Prefetches a route data
   */
  async prefetch(to: string): Promise<void> {
    const match = this.matchRoute(to);
    if (!match) return;
    
    // If route has loader, prefetch data
    if (match.route.loader) {
      try {
        const data = await match.route.loader(match);
        
        // Store prefetched data
        if (!this.routerEntity) return;
        const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
        if (router) {
          router.prefetchCache.set(to, {
            data,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Failed to prefetch route ${to}:`, error);
      }
    }
  }
  
  /**
   * Get the current router state
   */
  getState() {
    if (!this.routerEntity) return null;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    return router?.routerState$;
  }
  
  /**
   * Get the current route
   */
  getCurrentRoute() {
    if (!this.routerEntity) return null;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    return router?.currentRoute$;
  }
  
  /**
   * Get the router state as a signal
   */
  getStateSignal() {
    if (!this.routerEntity) return null;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    return router?.routerStateSignal;
  }
  
  /**
   * Get the current route as a signal
   */
  getCurrentRouteSignal() {
    if (!this.routerEntity) return null;
    
    const router = this.ecs.getComponent(this.routerEntity, RouterComponent);
    return router?.currentRouteSignal;
  }
  
  /**
   * Set a custom history adapter for testing or SSR
   */
  setHistoryAdapter(adapter: HistoryAdapter): void {
    this.historyAdapter = adapter;
  }
  
  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handleHistoryChange.bind(this));
    }
    
    if (this.routerEntity) {
      this.ecs.destroyEntity(this.routerEntity);
      this.routerEntity = null;
    }
  }
}
