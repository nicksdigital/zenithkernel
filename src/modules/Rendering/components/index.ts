/**
 * ECS Component Types for Rendering Islands
 * 
 * This module exports all ECS component types used by the islands architecture.
 * These components integrate with ZenithKernel's ECS system for reactive state management.
 */

export { CounterComponent } from './CounterComponent';
export { 
  HydraStatusComponent, 
  HydraRegistryComponent,
  type HydraRegistryEntry 
} from './HydraComponents';

// Re-export for convenience
export type {
  CounterComponent as Counter
} from './CounterComponent';

export type {
  HydraStatusComponent as HydraStatus,
  HydraRegistryComponent as HydraRegistry
} from './HydraComponents';
