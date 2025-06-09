/**
 * ZenithKernel Core Package
 * Foundational modules and types for the ZenithKernel framework
 */

// Core exports with named imports to avoid ambiguity
export * from './core/ZenithKernel';

// Explicitly re-export named types from ECS and ECSManager to avoid conflicts
import { ECSManager as ECM } from './core/ECSManager';
import { Entity, ComponentType, Constructor } from './core/ECS';
export { Entity, ComponentType, Constructor };
export { ECM as ECSManagerInstance };

export * from './core/signals';

// Re-export with paths that match the SDK imports
export * as ZenithKernel from './core/ZenithKernel';
export * as ECSManager from './core/ECSManager';

// Import router functions needed below
import { quickBootstrap } from './bootstrap/ZenithBootstrap';
import { createZenithRouter } from './core/router';
import zenithKernel from './vite/plugin';

// Module type exports for SDK compatibility
export * from './modules/Routing/types';
export * from './modules/Rendering/types';

// Module namespace exports
export * as Routing from './modules/Routing';
export * as Rendering from './modules/Rendering';

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
