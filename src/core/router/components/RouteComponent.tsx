/**
 * RouteComponent - Component for rendering routes with advanced features
 * Supports lazy loading, error boundaries, and suspense
 */

import React, { Suspense, ComponentType, ReactNode, useEffect, useState } from 'react';
import { useRouter, useCurrentRoute } from './RouterProvider';
import { RouteDefinition, RouteLoaderResult } from '../router';

// Route component props
export interface RouteComponentProps {
  route: RouteDefinition;
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
  fallback?: ReactNode;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * ErrorBoundary for route components
 */
class RouteErrorBoundary extends React.Component<
  { 
    children: ReactNode; 
    fallback?: (error: Error, retry: () => void) => ReactNode;
    onError?: (error: Error) => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route component error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () => {
          this.setState({ hasError: false, error: null });
        });
      }
      
      return (
        <div className="route-error">
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteComponent - Main route rendering component
 */
export function RouteComponent({
  route,
  params = {},
  query = {},
  fallback = <div>Loading route...</div>,
  onLoadStart,
  onLoadEnd,
  onError
}: RouteComponentProps) {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        onLoadStart?.();

        // Load component (could be async import)
        let comp = route.component;
        if (typeof comp === 'function') {
          comp = await comp();
        }

        // Handle ES modules default export
        if (comp && comp.default) {
          comp = comp.default;
        }

        if (mounted) {
          setComponent(() => comp);
          setLoading(false);
          onLoadEnd?.();
        }
      } catch (err) {
        const error = err as Error;
        if (mounted) {
          setError(error);
          setLoading(false);
          onError?.(error);
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [route, onLoadStart, onLoadEnd, onError]);

  // Handle error state
  if (error) {
    if (route.errorBoundary) {
      return <>{route.errorBoundary(error)}</>;
    }
    
    return (
      <div className="route-error">
        <h2>Failed to load route</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  // Handle loading state
  if (loading || !Component) {
    if (route.suspenseFallback) {
      return <>{route.suspenseFallback()}</>;
    }
    return <>{fallback}</>;
  }

  // Render component with error boundary
  return (
    <RouteErrorBoundary 
      fallback={route.errorBoundary} 
      onError={onError}
    >
      <Suspense fallback={route.suspenseFallback?.() || fallback}>
        <Component params={params} query={query} />
      </Suspense>
    </RouteErrorBoundary>
  );
}

/**
 * RouterOutlet - Renders the current route
 */
export function RouterOutlet({ 
  fallback = <div>Loading...</div>,
  onRouteChange,
  onLoadError
}: {
  fallback?: ReactNode;
  onRouteChange?: (route: RouteDefinition) => void;
  onLoadError?: (error: Error) => void;
}) {
  const currentRoute = useCurrentRoute();

  useEffect(() => {
    if (currentRoute) {
      onRouteChange?.(currentRoute.route);
    }
  }, [currentRoute, onRouteChange]);

  if (!currentRoute) {
    return <>{fallback}</>;
  }

  return (
    <RouteComponent
      route={currentRoute.route}
      params={currentRoute.params}
      query={currentRoute.query}
      fallback={fallback}
      onError={onLoadError}
    />
  );
}

/**
 * Link component for navigation
 */
export interface LinkProps {
  to: string;
  replace?: boolean;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: (event: React.MouseEvent) => void;
  prefetch?: boolean;
  state?: any;
}

export function Link({
  to,
  replace = false,
  children,
  className = '',
  activeClassName = 'active',
  onClick,
  prefetch = false,
  state
}: LinkProps) {
  const { navigate, currentRoute, prefetch: prefetchRoute } = useRouter();
  const isActive = currentRoute?.pathname === to;

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    onClick?.(event);
    
    if (!event.defaultPrevented) {
      await navigate(to, { replace, state });
    }
  };

  const handleMouseEnter = () => {
    if (prefetch) {
      prefetchRoute(to).catch(console.warn);
    }
  };

  const finalClassName = `${className} ${isActive ? activeClassName : ''}`.trim();

  return (
    <a
      href={to}
      className={finalClassName}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </a>
  );
}

/**
 * NavLink - Link with additional navigation features
 */
export interface NavLinkProps extends LinkProps {
  end?: boolean;
  caseSensitive?: boolean;
}

export function NavLink({
  to,
  end = false,
  caseSensitive = false,
  ...props
}: NavLinkProps) {
  const { currentRoute } = useRouter();
  
  const isActive = React.useMemo(() => {
    if (!currentRoute) return false;
    
    const pathname = caseSensitive 
      ? currentRoute.pathname 
      : currentRoute.pathname.toLowerCase();
    const targetPath = caseSensitive ? to : to.toLowerCase();
    
    if (end) {
      return pathname === targetPath;
    }
    
    return pathname.startsWith(targetPath);
  }, [currentRoute, to, end, caseSensitive]);

  return (
    <Link 
      {...props} 
      to={to}
      className={`${props.className || ''} ${isActive ? (props.activeClassName || 'active') : ''}`.trim()}
    />
  );
}

export default RouteComponent;
