import { BaseSystem } from "../../../core/BaseSystem";
import { ECSManager } from "../../../core/ECSManager";
import { registerSystem } from "../../../decorators/RegisterSystem";
import { RoutingSystem } from "../RoutingSystem";
import { RouteMiddleware, RouteMatchResult } from "../types";

@registerSystem("routing-middleware")
export class MiddlewareSystem extends BaseSystem {
  private globalMiddleware: RouteMiddleware[] = [];
  private routeMiddleware: Map<string, RouteMiddleware[]> = new Map();
  private routingSystem: RoutingSystem | null = null;
  
  constructor(ecs: ECSManager) {
    super(ecs);
  }
  
  onLoad(): void {
    console.log("🛡️ Initializing RoutingMiddlewareSystem");
    
    // Get reference to the routing system
    const systems = this.ecs.getSystems();
    this.routingSystem = systems.find(s => s instanceof RoutingSystem) as RoutingSystem || null;
    
    if (!this.routingSystem) {
      console.warn("⚠️ RoutingSystem not found. Middleware will not function properly.");
      return;
    }
    
    // Listen for navigation events to apply middleware
    this.ecs.on('navigation', this.handleNavigation.bind(this));
  }
  
  /**
   * Add global middleware that applies to all routes
   */
  addGlobalMiddleware(middleware: RouteMiddleware): void {
    this.globalMiddleware.push(middleware);
  }
  
  /**
   * Add middleware specific to a route path
   */
  addRouteMiddleware(routePath: string, middleware: RouteMiddleware): void {
    if (!this.routeMiddleware.has(routePath)) {
      this.routeMiddleware.set(routePath, []);
    }
    
    this.routeMiddleware.get(routePath)!.push(middleware);
  }
  
  /**
   * Handle navigation event by running middleware chain
   */
  private async handleNavigation(event: { path: string, match: RouteMatchResult }): Promise<void> {
    const { path, match } = event;
    
    // Skip middleware if no routing system reference
    if (!this.routingSystem) return;
    
    // Collect applicable middleware
    const middleware = [
      ...this.globalMiddleware,
      ...(this.routeMiddleware.get(match.route.path) || [])
    ];
    
    if (middleware.length === 0) return;
    
    // Execute middleware chain
    let index = 0;
    const next = async () => {
      if (index >= middleware.length) return;
      
      const current = middleware[index++];
      await current(match, next);
    };
    
    try {
      await next();
    } catch (error) {
      console.error("Middleware error:", error);
      
      // Handle middleware errors (e.g., redirect to error page)
      if (match.route.path !== '/error') {
        this.routingSystem.navigate('/error');
      }
    }
  }
  
  update(): void {
    // No per-frame updates needed
  }
  
  dispose(): void {
    this.ecs.off('navigation', this.handleNavigation.bind(this));
    this.globalMiddleware = [];
    this.routeMiddleware.clear();
  }
}
