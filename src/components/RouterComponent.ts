import { Entity } from '@core/types';

/**
 * Component to store route-related data for an entity
 */
export class RouterComponent {
    public currentPath: string = '/';
    public history: string[] = [];
    public historyIndex: number = 0;
    public routes: Map<string, (params?: Record<string, string>) => void> = new Map();
    public listeners: Set<(path: string, params?: Record<string, string>) => void> = new Set();
    public prefetchedRoutes: Set<string> = new Set();

    // NotFound handler for unmatched routes
    public notFoundHandler: (path: string) => void = () => {};
    
    // Catch-all routes with patterns like /* or /some/path/*
    public catchAllRoutes: Map<string, (path: string, params?: Record<string, string>) => void> = new Map();
    
    // Cache for pattern-matching results
    private matchCache: Map<string, { handler: Function, params: Record<string, string> } | null> = new Map();

    constructor() {
        // Initialize with current path if in browser
        if (typeof window !== 'undefined') {
            this.currentPath = window.location.pathname;
            this.history.push(this.currentPath);
        }
    }

    /**
     * Register a route handler
     */
    registerRoute(path: string, handler: (params?: Record<string, string>) => void) {
        // Clear cache when routes change
        this.matchCache.clear();
        
        if (path.includes('*')) {
            // It's a catch-all route
            const basePath = path.replace('*', '');
            this.catchAllRoutes.set(basePath, handler);
        } else {
            this.routes.set(path, handler);
        }
    }
    
    /**
     * Register a NotFound handler
     */
    registerNotFound(handler: (path: string) => void) {
        this.notFoundHandler = handler;
    }

    /**
     * Add a route change listener
     */
    addListener(listener: (path: string, params?: Record<string, string>) => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Extract params from a route path
     */
    extractParams(path: string, routePath: string): Record<string, string> | null {
        const routeParts = routePath.split('/');
        const pathParts = path.split('/');

        if (routeParts.length !== pathParts.length) {
            return null;
        }

        const params: Record<string, string> = {};

        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (routePart.startsWith(':')) {
                const paramName = routePart.substring(1);
                params[paramName] = pathPart;
            } else if (routePart !== pathPart) {
                return null;
            }
        }

        return params;
    }
    
    /**
     * Extract catch-all params with wildcard segments
     */
    extractCatchAllParams(path: string, basePath: string): Record<string, string> {
        const params: Record<string, string> = {};
        
        if (path.startsWith(basePath)) {
            // Extract the wildcard part
            const wildcardSegment = path.slice(basePath.length);
            
            // Store the whole wildcard segment
            params['*'] = wildcardSegment;
            
            // Also store individual path segments
            const segments = wildcardSegment.split('/').filter(s => s);
            segments.forEach((segment, index) => {
                params[`$${index}`] = segment;
            });
            
            return params;
        }
        
        return params;
    }

    /**
     * Find a matching route handler for a path
     */
    findRouteHandler(path: string): { handler: (params?: Record<string, string>) => void, params: Record<string, string> } | null {
        // Check cache first
        if (this.matchCache.has(path)) {
            return this.matchCache.get(path);
        }
        
        let result = null;
        
        // First try exact match
        if (this.routes.has(path)) {
            result = { 
                handler: this.routes.get(path)!,
                params: {} 
            };
        }
        
        // Then try with params
        if (!result) {
            for (const [routePath, handler] of this.routes.entries()) {
                if (routePath.includes(':')) {
                    const params = this.extractParams(path, routePath);
                    if (params) {
                        result = { handler, params };
                        break;
                    }
                }
            }
        }
        
        // Then try catch-all routes, ordered by specificity (longest match first)
        if (!result) {
            const catchAllEntries = Array.from(this.catchAllRoutes.entries())
                .sort((a, b) => b[0].length - a[0].length); // Sort by path length, descending
                
            for (const [basePath, handler] of catchAllEntries) {
                if (path === basePath || path.startsWith(basePath)) {
                    const params = this.extractCatchAllParams(path, basePath);
                    result = { handler: handler as any, params };
                    break;
                }
            }
        }
        
        // Cache the result (including null) for future lookups
        this.matchCache.set(path, result);
        
        return result;
    }
    
    /**
     * Clear the route matching cache
     */
    clearCache(): void {
        this.matchCache.clear();
    }
    
    /**
     * Check if the path matches any registered route or catch-all
     */
    hasMatchingRoute(path: string): boolean {
        return this.findRouteHandler(path) !== null;
    }
}
