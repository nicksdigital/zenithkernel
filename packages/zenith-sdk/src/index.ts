/**
 * ZenithSDK - Developer-friendly interface for ZenithKernel
 * 
 * This SDK provides a clean abstraction layer for working with ZenithKernel,
 * hiding internal implementation details and providing a more intuitive API.
 */

// Core exports
export * from './core/ZenithApp';
export * from './core/AppManager';
export * from './core/signals';

// Component system exports
export * from './components/ComponentController';
export * from './components/CounterController';

// Utility exports
export * from './utils/reactivity';
export * from './utils/hydration';

/**
 * SDK Version
 */
export const VERSION = '0.1.0';
