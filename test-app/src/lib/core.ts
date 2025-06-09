/**
 * Core re-exports for test-app
 * This file provides direct access to ZenithKernel core modules
 */

// Re-export core modules with explicit paths
export { ZenithKernel } from '../../../packages/zenith-core/src/core/ZenithKernel';
export { createZenithRouter, type RouteDefinition } from '../../../packages/zenith-core/src/core/router';
export { BaseSystem } from '../../../packages/zenith-core/src/core/BaseSystem';

// Re-export other necessary core modules
export { jsx } from '../../../packages/zenith-core/src/modules/Rendering/jsx';

// Explicit type exports
export type { IslandComponent } from '../../../packages/zenith-core/src/modules/Rendering/types';

