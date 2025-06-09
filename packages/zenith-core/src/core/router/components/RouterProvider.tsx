/**
 * RouterProvider - React Context Provider for ZenithRouter
 * Provides router state and navigation functions to components
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ZenithRouter, RouterState, RouteMatch, NavigationOptions } from '../router';
import { Observable } from 'rxjs';

// Router context type
export interface RouterContextValue {
  router: ZenithRouter;
  state: RouterState;
  currentRoute: RouteMatch | null;
  navigate: (path: string, options?: NavigationOptions) => Promise<void>;
  back: () => void;
  forward: () => void;
  prefetch: (path: string) => Promise<void>;
  isNavigating: boolean;
}

// Create context
const RouterContext = createContext<RouterContextValue | null>(null);

// Provider props
export interface RouterProviderProps {
  router: ZenithRouter;
  children: ReactNode;
  fallback?: ReactNode;
  errorBoundary?: (error: Error, retry: () => void) => ReactNode;
}

/**
 * RouterProvider component
 */
export function RouterProvider({ 
  router, 
  children, 
  fallback = <div>Loading...</div>,
  errorBoundary 
}: RouterProviderProps) {
  const [state, setState] = useState<RouterState>(router.getStateSignal().value);
  const [currentRoute, setCurrentRoute] = useState<RouteMatch | null>(
    router.getCurrentRouteSignal().value
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to router state changes
    const stateSubscription = router.getState().subscribe(setState);
    const routeSubscription = router.getCurrentRoute().subscribe(setCurrentRoute);

    return () => {
      stateSubscription.unsubscribe();
      routeSubscription.unsubscribe();
    };
  }, [router]);

  const contextValue: RouterContextValue = {
    router,
    state,
    currentRoute,
    navigate: router.navigate.bind(router),
    back: router.back.bind(router),
    forward: router.forward.bind(router),
    prefetch: router.prefetch.bind(router),
    isNavigating: state.isNavigating
  };

  // Error boundary handling
  if (error && errorBoundary) {
    return <>{errorBoundary(error, () => setError(null))}</>;
  }

  if (state.navigationError && errorBoundary) {
    return <>{errorBoundary(state.navigationError, () => router.clearCache())}</>;
  }

  // Show fallback during navigation
  if (state.isNavigating && !currentRoute) {
    return <>{fallback}</>;
  }

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}

/**
 * useRouter hook
 */
export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

/**
 * useNavigate hook
 */
export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

/**
 * useCurrentRoute hook
 */
export function useCurrentRoute() {
  const { currentRoute } = useRouter();
  return currentRoute;
}

/**
 * useParams hook - extracts parameters from current route
 */
export function useParams<T = Record<string, string>>(): T {
  const { currentRoute } = useRouter();
  return (currentRoute?.params as T) || ({} as T);
}

/**
 * useQuery hook - extracts query parameters from current route
 */
export function useQuery<T = Record<string, string | string[] | undefined>>(): T {
  const { currentRoute } = useRouter();
  return (currentRoute?.query as T) || ({} as T);
}

/**
 * useRouterState hook
 */
export function useRouterState(): RouterState {
  const { state } = useRouter();
  return state;
}

/**
 * usePrefetch hook - returns prefetch function
 */
export function usePrefetch() {
  const { prefetch } = useRouter();
  return prefetch;
}

export default RouterProvider;
