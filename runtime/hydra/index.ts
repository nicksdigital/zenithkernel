/**
 * ZenithKernel Hydra Runtime
 * 
 * Core types and functionality for the Hydra island rendering system.
 * This module provides the runtime context and utilities for island hydration.
 */

// Export the Hydra JSX component and related types
export * from './hydra-jsx';

/**
 * Hydra Context for template rendering and island hydration
 */
export interface HydraContext {
  /** The environment where the code is running (client/server) */
  env: 'client' | 'server';
  /** Hydration strategy */
  strategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
  /** Trust level for execution */
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
}

/**
 * Common Hydra types and utilities
 */
export const HydraUtils = {
  /** Check if we're in a browser environment */
  isBrowser: () => typeof window !== 'undefined',
  
  /** Get default trust level based on origin */
  getDefaultTrustLevel: (origin?: string): HydraContext['trustLevel'] => {
    if (!origin) return 'unverified';
    if (origin === 'localhost' || origin.includes('127.0.0.1')) return 'local';
    return 'unverified';
  }
};
