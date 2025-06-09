import { Signal } from "../../../core/reactive-state";
import { currentRoute$, currentRouteSignal, navigate, back, forward, prefetch } from "../index";
import { RouteMatchResult } from "../types";

/**
 * Hook to access router functionality within islands or components
 */
export function useRouter() {
  // Return all router functions and state
  return {
    // Navigation functions
    navigate,
    back,
    forward,
    prefetch,
    
    // Current route (signal for reactivity)
    currentRoute: currentRouteSignal,
    
    // Helper method to get params from current route
    getParams: (): Record<string, string> => {
      return currentRouteSignal?.value?.params || {};
    },
    
    // Helper to get search params
    getSearchParams: (): URLSearchParams | undefined => {
      return currentRouteSignal?.value?.search;
    },
    
    // Helper to check if route is active
    isActive: (path: string, exact: boolean = false): boolean => {
      const current = currentRouteSignal?.value?.pathname;
      if (!current) return false;
      
      if (exact) {
        return current === path;
      }
      
      return current === path || current.startsWith(`${path}/`);
    }
  };
}

/**
 * Hook to get just the current route params
 */
export function useParams(): Record<string, string> {
  return currentRouteSignal?.value?.params || {};
}

/**
 * Hook to get search params
 */
export function useSearchParams(): URLSearchParams | undefined {
  return currentRouteSignal?.value?.search;
}

/**
 * Subscribe to route changes with a callback
 */
export function useRouteChange(callback: (route: RouteMatchResult | null) => void): () => void {
  if (!currentRoute$) return () => {};
  
  const subscription = currentRoute$.subscribe(callback);
  return () => subscription.unsubscribe();
}
