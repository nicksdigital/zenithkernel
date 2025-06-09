/**
 * Component that handles route-level errors in the ECS
 */
export class RouteErrorBoundaryComponent {
  hasError: boolean = false;
  error: Error | null = null;
  
  // Keep track of which routes have errors
  routeErrors: Map<string, Error> = new Map();
  
  // Error recovery handlers per route
  recoveryHandlers: Map<string, () => Promise<void>> = new Map();
  
  // Track error types for analytics and better error handling
  errorTypes: Map<string, string> = new Map();
  
  // Default fallback UI
  defaultFallback: (error: Error, retry?: () => void) => HTMLElement = (error: Error, retry?: () => void) => {
    const div = document.createElement('div');
    div.style.padding = '20px';
    div.style.backgroundColor = '#fff0f0';
    div.style.border = '1px solid #ffcccc';
    div.style.borderRadius = '4px';
    div.style.margin = '20px 0';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Something went wrong';
    heading.style.color = '#cc0000';
    div.appendChild(heading);
    
    const message = document.createElement('p');
    message.textContent = error.message;
    div.appendChild(message);
    
    const button = document.createElement('button');
    button.textContent = 'Try Again';
    button.onclick = retry ? retry : () => window.location.reload();
    div.appendChild(button);
    
    return div;
  };
  
  // Custom fallbacks per route
  routeFallbacks: Map<string, (error: Error, retry?: () => void) => HTMLElement> = new Map();
  
  // Error boundary configuration per route
  routeConfigs: Map<string, {
    retryLimit?: number,
    retryDelay?: number,
    shouldLog?: boolean,
    onError?: (error: Error) => void,
    fallthrough?: boolean, // Whether errors should propagate to parent routes
  }> = new Map();
  
  // Current retry counts per route
  retryAttempts: Map<string, number> = new Map();
  
  /**
   * Set a route-specific error
   */
  setRouteError(routePath: string, error: Error): void {
    this.routeErrors.set(routePath, error);
    this.hasError = true;
    this.error = error;
    
    // Capture error type for analytics
    this.errorTypes.set(routePath, error.constructor.name);
    
    // Execute onError callback if configured
    const config = this.routeConfigs.get(routePath);
    if (config?.onError) {
      try {
        config.onError(error);
      } catch (callbackError) {
        console.error('Error in error handler:', callbackError);
      }
    }
    
    // Log error if configured
    if (config?.shouldLog !== false) {
      console.error(`Route Error [${routePath}]:`, error);
    }
  }
  
  /**
   * Clear a route-specific error
   */
  clearRouteError(routePath: string): void {
    this.routeErrors.delete(routePath);
    this.errorTypes.delete(routePath);
    this.retryAttempts.delete(routePath);
    
    // If no more errors, reset the global error state
    if (this.routeErrors.size === 0) {
      this.hasError = false;
      this.error = null;
    } else {
      // Otherwise, set the global error to the most recent one
      const errors = Array.from(this.routeErrors.values());
      this.error = errors[errors.length - 1];
    }
  }
  
  /**
   * Register a custom fallback for a specific route
   */
  registerFallback(routePath: string, fallback: (error: Error, retry?: () => void) => HTMLElement): void {
    this.routeFallbacks.set(routePath, fallback);
  }
  
  /**
   * Register error boundary configuration for a route
   */
  registerErrorBoundary(routePath: string, config: {
    retryLimit?: number,
    retryDelay?: number,
    shouldLog?: boolean,
    onError?: (error: Error) => void,
    fallthrough?: boolean,
    fallback?: (error: Error, retry?: () => void) => HTMLElement
  }): void {
    this.routeConfigs.set(routePath, config);
    if (config.fallback) {
      this.registerFallback(routePath, config.fallback);
    }
  }
  
  /**
   * Register a recovery handler for a specific route
   */
  registerRecoveryHandler(routePath: string, handler: () => Promise<void>): void {
    this.recoveryHandlers.set(routePath, handler);
  }
  
  /**
   * Get the appropriate fallback for a route
   */
  getFallback(routePath: string): (error: Error, retry?: () => void) => HTMLElement {
    return this.routeFallbacks.get(routePath) || this.defaultFallback;
  }
  
  /**
   * Attempt to recover from an error for a specific route
   */
  async attemptRecovery(routePath: string): Promise<boolean> {
    const config = this.routeConfigs.get(routePath);
    const retryLimit = config?.retryLimit ?? 3;
    const retryDelay = config?.retryDelay ?? 1000;
    
    const currentAttempts = this.retryAttempts.get(routePath) || 0;
    if (currentAttempts >= retryLimit) {
      return false;
    }
    
    this.retryAttempts.set(routePath, currentAttempts + 1);
    
    // Wait for retry delay
    if (retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    // Execute recovery handler if available
    const handler = this.recoveryHandlers.get(routePath);
    if (handler) {
      try {
        await handler();
        this.clearRouteError(routePath);
        return true;
      } catch (error) {
        this.setRouteError(routePath, error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Check if error should fall through to parent route
   */
  shouldFallthrough(routePath: string): boolean {
    return this.routeConfigs.get(routePath)?.fallthrough ?? false;
  }
  
  /**
   * Render error UI for a specific route
   */
  renderErrorUI(routePath: string): HTMLElement | null {
    const error = this.routeErrors.get(routePath);
    if (!error) return null;
    
    const fallback = this.getFallback(routePath);
    const retry = () => this.attemptRecovery(routePath);
    
    return fallback(error, retry);
  }
}
