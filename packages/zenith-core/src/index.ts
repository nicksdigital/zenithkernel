/**
 * ZenithKernel Core Package
 * Foundational modules and types for the ZenithKernel framework
 */

// Core exports
export * from './core/ZenithKernel';
export * from './core/ECSManager';
export * from './core/ECS';
export * from './core/signals';
export * from './core/router';

// System exports
export * from './core/SystemManager';
export * from './core/Scheduler';
export * from './core/MessagingSystem';

// Bootstrap
export * from './bootstrap/ZenithBootstrap';

// Vite plugin
export * from './vite/plugin';

// Version info
export const version = '1.0.0';
export const codename = 'Quantum Wave';
