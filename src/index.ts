/**
 * ZenithKernel Main Entry Point
 * Complete quantum-decentralized framework
 */

import { createZenithRouter } from '@core/router/integration';
import { quickBootstrap } from './bootstrap/ZenithBootstrap';
import zenithKernel from './vite/plugin';

// Core exports
export * from './core/ZenithKernel';
export * from './core/router';
export * from './core/signals';
export * from '@core/ECS';

export * from './core/SystemManager';
export * from './core/Scheduler';
export * from './core/MessagingSystem';
export * from './core/WasmModuleProxy';

// Bootstrap system
export * from './bootstrap/ZenithBootstrap';
export * from './bootstrap/integration';

// Vite plugin
export * from './vite/plugin';

// Type definitions
export type {
  ZenithBootstrapConfig,
  ZenithBootstrapResult,
  BootstrapState,
  ZenithPlugin
} from './bootstrap/ZenithBootstrap';

export type {
  ZenithVitePluginConfig
} from './vite/plugin';

export type {
  RouteDefinition,
  RouteParams,
  QueryParams,
  RouteMatch,
  RouterState,
  NavigationOptions,
  ZKRouteGuard,
  RoleBasedGuard,
  TimeBasedGuard,
  RateLimitGuard
} from './core/router';

// Main convenience exports for common use cases
export { 

  bootstrapWithConfig
} from './bootstrap/integration';

export {
  zenithKernel as vitePlugin,
  zenithKernel
} from './vite/plugin';

export {
  createZenithRouter,
  ZenithRouter,
  RouterProvider,
  useRouter,
  useNavigate,
  useCurrentRoute,
  useParams,
  useQuery,
  Link,
  NavLink,
  RouterOutlet
} from './core/router';

// Version info
export const version = '1.0.0';
export const codename = 'Quantum Wave';

// Default export for convenience
export default {
  version,
  codename,
  quickBootstrap,
  createZenithRouter,
  vitePlugin: zenithKernel
};
