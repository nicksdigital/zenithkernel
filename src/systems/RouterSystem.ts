import { BaseSystem } from '@core/BaseSystem';
import { ECSManager } from '@core/ECSManager';
import type { Entity } from '../types/ecs';
import { RouterComponent } from '../components/RouterComponent';
import { BehaviorSubject, map } from 'rxjs';
import { RouteErrorBoundaryComponent } from '@modules/Routing/components/RouteErrorBoundaryComponent';

export interface RouterState {
    currentRoute: string;
    previousRoute?: string;
    params?: Record<string, string>;
}

/**
 * System responsible for handling client-side routing
 */
export class RouterSystem extends BaseSystem {
    private routerEntity: Entity | null = null;
    private routerComponent: RouterComponent | null = null;
    private errorBoundaryComponent: RouteErrorBoundaryComponent | null = null;
    private state$ = new BehaviorSubject<RouterState>({ currentRoute: '/' });
    private stateSignal: { value: RouterState } = { value: { currentRoute: '/' } };

    constructor(ecs: ECSManager) {
        super(ecs);
    }

    onLoad() {
        // Create an entity for the router
        this.routerEntity = this.ecs.createEntity();
        this.routerComponent = new RouterComponent();
        this.ecs.addComponent(this.routerEntity, RouterComponent, this.routerComponent);
        
        // Add error boundary component to the router entity
        this.errorBoundaryComponent = new RouteErrorBoundaryComponent();
        this.ecs.addComponent(this.routerEntity, RouteErrorBoundaryComponent, this.errorBoundaryComponent);

        // Set up history API event listeners if in browser
        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', this.handlePopState.bind(this));
        }
    }

    onUnload() {
        // Clean up event listeners
        if (typeof window !== 'undefined') {
            window.removeEventListener('popstate', this.handlePopState.bind(this));
        }

        // Clean up entity
        if (this.routerEntity !== null) {
            this.ecs.destroyEntity(this.routerEntity);
            this.routerEntity = null;
            this.routerComponent = null;
            this.errorBoundaryComponent = null;
        }
    }

    update() {
        // System logic runs every tick
        // This could include checking for route changes or executing time-based redirects
    }

    // Handle browser history navigation
    private handlePopState(event: PopStateEvent) {
        if (!this.routerComponent) return;

        const path = window.location.pathname;
        this.routerComponent.currentPath = path;
        this.routerComponent.historyIndex = this.routerComponent.history.indexOf(path);
        
        this.handleRouteChange(path);
    }

    // Navigate to a new route
    navigate(path: string, options: { 
        replace?: boolean,
        state?: any,
        skipErrorBoundary?: boolean 
    } = {}) {
        if (!this.routerComponent) return;

        // Don't navigate if we're already on the path
        if (this.routerComponent.currentPath === path && !options.skipErrorBoundary) return;

        // Update browser history if in browser environment
        if (typeof window !== 'undefined') {
            if (options.replace) {
                window.history.replaceState(options.state || {}, '', path);
            } else {
                window.history.pushState(options.state || {}, '', path);
            }
        }

        // Update router state
        const previousPath = this.routerComponent.currentPath;
        this.routerComponent.currentPath = path;
        
        // Update history
        if (options.replace) {
            // Replace the current history entry
            this.routerComponent.history[this.routerComponent.historyIndex] = path;
        } else {
            // Remove any forward history if we're not at the end
            if (this.routerComponent.historyIndex < this.routerComponent.history.length - 1) {
                this.routerComponent.history = this.routerComponent.history.slice(0, this.routerComponent.historyIndex + 1);
            }
            // Add to history
            this.routerComponent.history.push(path);
            this.routerComponent.historyIndex = this.routerComponent.history.length - 1;
        }

        this.handleRouteChange(path, previousPath, options.skipErrorBoundary);
    }

    // Go back in history
    back() {
        if (!this.routerComponent) return;

        if (this.routerComponent.historyIndex > 0) {
            this.routerComponent.historyIndex--;
            const path = this.routerComponent.history[this.routerComponent.historyIndex];
            
            // Update browser history if in browser environment
            if (typeof window !== 'undefined') {
                window.history.back();
            } else {
                // Directly handle route change if not in browser
                this.routerComponent.currentPath = path;
                this.handleRouteChange(path);
            }
        }
    }

    // Go forward in history
    forward() {
        if (!this.routerComponent) return;

        if (this.routerComponent.historyIndex < this.routerComponent.history.length - 1) {
            this.routerComponent.historyIndex++;
            const path = this.routerComponent.history[this.routerComponent.historyIndex];
            
            // Update browser history if in browser environment
            if (typeof window !== 'undefined') {
                window.history.forward();
            } else {
                // Directly handle route change if not in browser
                this.routerComponent.currentPath = path;
                this.handleRouteChange(path);
            }
        }
    }

    // Prefetch a route (useful for performance optimization)
    prefetch(path: string) {
        if (!this.routerComponent) return;
        this.routerComponent.prefetchedRoutes.add(path);
        
        // Prefetching logic could be implemented here
        // For example, loading necessary data or components in advance
    }

    // Register a route handler
    registerRoute(path: string, handler: (params?: Record<string, string>) => void) {
        if (!this.routerComponent) return;
        this.routerComponent.registerRoute(path, handler);
    }
    
    // Register a NotFound handler
    registerNotFound(handler: (path: string) => void) {
        if (!this.routerComponent) return;
        this.routerComponent.registerNotFound(handler);
    }
    
    // Register a catch-all route handler
    registerCatchAll(path: string, handler: (path: string, params?: Record<string, string>) => void) {
        if (!this.routerComponent) return;
        this.routerComponent.registerRoute(path, handler as any);
    }

    // Add a route change listener
    addRouteListener(listener: (path: string, params?: Record<string, string>) => void) {
        if (!this.routerComponent) return () => {};
        return this.routerComponent.addListener(listener);
    }
    
    // Register error boundary for a route
    registerErrorBoundary(routePath: string, config: {
        fallback?: (error: Error, retry?: () => void) => HTMLElement,
        retryLimit?: number,
        retryDelay?: number,
        shouldLog?: boolean,
        onError?: (error: Error) => void,
        fallthrough?: boolean
    }) {
        if (!this.errorBoundaryComponent) return;
        this.errorBoundaryComponent.registerErrorBoundary(routePath, config);
    }
    
    // Register recovery handler for a route
    registerRecoveryHandler(routePath: string, handler: () => Promise<void>) {
        if (!this.errorBoundaryComponent) return;
        this.errorBoundaryComponent.registerRecoveryHandler(routePath, handler);
    }
    
    // Try to recover from an error for a specific route
    async recoverRoute(routePath: string): Promise<boolean> {
        if (!this.errorBoundaryComponent) return false;
        const success = await this.errorBoundaryComponent.attemptRecovery(routePath);
        
        if (success) {
            // Re-navigate to the route if recovery was successful
            this.navigate(routePath, { skipErrorBoundary: true });
        }
        
        return success;
    }

    // Handle route changes
    private async handleRouteChange(path: string, previousPath?: string, skipErrorBoundary: boolean = false) {
        if (!this.routerComponent) return;

        // Find matching route handler
        const match = this.routerComponent.findRouteHandler(path);
        
        // Update reactive state
        const newState: RouterState = {
            currentRoute: path,
            previousRoute: previousPath,
            params: match?.params || {}
        };
        
        this.state$.next(newState);
        this.stateSignal.value = newState;

        // Handle the route
        if (match) {
            try {
                if (this.errorBoundaryComponent && !skipErrorBoundary) {
                    // Clear previous error for this route
                    this.errorBoundaryComponent.clearRouteError(path);
                }
                
                match.handler(match.params);
            } catch (error) {
                if (this.errorBoundaryComponent && !skipErrorBoundary) {
                    // Handle error with error boundary
                    this.errorBoundaryComponent.setRouteError(
                        path, 
                        error instanceof Error ? error : new Error(String(error))
                    );
                    
                    // If configured to fall through to parent route
                    if (this.errorBoundaryComponent.shouldFallthrough(path) && previousPath) {
                        this.navigate(previousPath, { replace: true });
                    } else {
                        // Render error UI via the RouterView component
                        // (RouterView will check for errors and render the fallback)
                    }
                } else {
                    throw error; // Re-throw if error boundary is disabled
                }
            }
        } else {
            // No matching route found - use NotFound handler
            this.routerComponent.notFoundHandler(path);
        }

        // Notify listeners
        for (const listener of this.routerComponent.listeners) {
            listener(path, match?.params);
        }
    }

    // Get current router state as an observable
    getState() {
        return this.state$.asObservable();
    }

    // Get current route as an observable
    getCurrentRoute() {
        return this.state$.pipe(map(state => state.currentRoute));
    }

    // Get state as a signal (for frameworks that use signals)
    getStateSignal() {
        return this.stateSignal;
    }

    // Get current route as a signal
    getCurrentRouteSignal() {
        return { get: () => this.stateSignal.value.currentRoute };
    }
    
    // Get whether the current route is a NotFound route
    getIsNotFoundSignal() {
        return { get: () => this.stateSignal.value.currentRoute === '404' || this.stateSignal.value.currentRoute === 'not-found'};
    }
}
