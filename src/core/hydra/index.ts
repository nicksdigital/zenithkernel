/**
 * Enhanced Hydra System - Index
 * Exports all enhanced Hydra capabilities including context management,
 * signal-based DOM bindings, and the enhanced runtime integration
 */

import { enhancedHydra, getEnhancedHydraRuntime } from './EnhancedHydraRuntime';
import { getHydraContextManager } from './HydraContextManager';
import { getSignalDOMBinder } from './SignalDOMBinder';

// Core Enhanced Runtime
export {
  EnhancedHydraRuntime,
  getEnhancedHydraRuntime,
  hydrateLocalHydraEnhanced,
  enhancedHydra
} from './EnhancedHydraRuntime';

export type {
  EnhancedHydraContext
} from './EnhancedHydraRuntime';

// Context Management
export {
  HydraContextManager,
  getHydraContextManager,
  createReactiveHydraContext,
  getContextSignals
} from './HydraContextManager';

// Signal-Based DOM Bindings
export {
  SignalDOMBinder,
  getSignalDOMBinder,
  domBindings,
  createReactiveElement,
  createReactiveText
} from './SignalDOMBinder';

// Types
export type {
  
  HydraIslandContext,
  HydraContextOptions,
  HydraContextBinding
} from './HydraContextManager';

export type {
  DOMBindingOptions,
  AnimationBindingOptions,
  ConditionalBindingOptions
} from './SignalDOMBinder';

// Re-export core signals for convenience
export { signal, computed, effect, isSignal } from '../signals';
export type { Signal } from '../signals';

/**
 * Quick setup function for enhanced Hydra development
 */
export function setupEnhancedHydra() {
  console.log('🌊⚡ Enhanced Hydra System initialized');
  console.log('Features available:');
  console.log('  • Reactive context management');
  console.log('  • Signal-based DOM bindings');
  console.log('  • Advanced hydration strategies');
  console.log('  • Animation bindings');
  console.log('  • ZK proof integration');
  console.log('  • Trust score visualization');
  
  return {
    runtime: getEnhancedHydraRuntime(),
    contextManager: getHydraContextManager(),
    domBinder: getSignalDOMBinder(),
    utils: enhancedHydra
  };
}
