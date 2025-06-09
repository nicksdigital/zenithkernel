/**
 * ZenithRouter - Complete router system with advanced features
 * @description Type-safe, reactive routing with ZK verification, ECS integration, and quantum consensus
 */

// Core router
export * from './router';

// React components
export * from './components/RouterProvider';
export * from './components/RouteComponent';

// Security and guards
export * from './guards';

// ZenithKernel integration
export * from './integration';

// Re-export main classes for convenience
export { ZenithRouter, TypeSafeRouteBuilder } from './router';
export { RouterProvider, useRouter, useNavigate, useCurrentRoute, useParams, useQuery } from './components/RouterProvider';
export { RouteComponent, RouterOutlet, Link, NavLink } from './components/RouteComponent';
export { AuthGuardFactory, CommonGuards } from './guards';
export { ZenithRouterIntegration, createZenithRouter, RouterMiddleware, RouteEnhancer } from './integration';

// Types
export type {
  RouteParams,
  QueryParams,
  RouteLoader,
  RouteLoaderResult,
  RouteDefinition,
  RouteGuard,
  NavigationOptions,
  RouteMatch,
  RouterState
} from './router';

export type {
  RouterContextValue,
  RouterProviderProps
} from './components/RouterProvider';

export type {
  RouteComponentProps,
  LinkProps,
  NavLinkProps
} from './components/RouteComponent';

export type {
  ZKRouteGuard,
  RoleBasedGuard,
  TimeBasedGuard,
  RateLimitGuard
} from './guards';
