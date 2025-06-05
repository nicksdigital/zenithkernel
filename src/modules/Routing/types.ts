/**
 * A route definition in the application
 */
export interface RouteDefinition {
  // Route path pattern (e.g., '/users/:id')
  path: string;
  
  // Component to render for this route
  component: any;
  
  // Data loader function
  loader?: (match: RouteMatchResult) => Promise<any>;
  
  // Error handler for this route
  errorBoundary?: (error: Error) => any;
  
  // Whether the route should be rendered lazily
  lazy?: boolean;
  
  // Metadata for the route
  meta?: {
    title?: string;
    auth?: boolean;
    roles?: string[];
    [key: string]: any;
  };
  
  // Child routes (for nested routing)
  children?: RouteDefinition[];
}

/**
 * Result of a successful route match
 */
export interface RouteMatchResult {
  // The matched route definition
  route: RouteDefinition;
  
  // Parameters extracted from the route (e.g., { id: '123' })
  params: Record<string, string>;
  
  // The matched pathname
  pathname: string;
  
  // The search parameters
  search: URLSearchParams;
}

/**
 * Current state of the router
 */
export interface RouterState {
  // Currently matched route
  currentRoute: RouteMatchResult | null;
  
  // Whether we can go back in history
  canGoBack: boolean;
  
  // Whether we can go forward in history
  canGoForward: boolean;
  
  // Whether a navigation is in progress
  isLoading: boolean;
}

/**
 * Middleware function type for route guards
 */
export type RouteMiddleware = (
  match: RouteMatchResult, 
  next: () => Promise<void>
) => Promise<void>;

/**
 * Type for layout routes that wrap child routes
 */
export interface LayoutRouteDefinition extends RouteDefinition {
  // The component that wraps child routes
  layout: any;
  
  // Child routes that will be rendered inside the layout
  children: RouteDefinition[];
}
