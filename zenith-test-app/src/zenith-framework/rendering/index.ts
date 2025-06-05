/**
 * ZenithKernel Rendering Module - Islands Architecture Implementation
 *
 * This module provides a complete islands architecture system integrated
 * with ZenithKernel's ECS and Hydra systems.
 */

// Core runtime and types
export * from './jsx-runtime';
export * from './types';

// Reactive state management
export {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
    legacyUseState
} from './jsx-runtime';

// Island components

// Convenience exports
import {initializeIslands} from './island-loader';

export {
    jsx,
    jsxs,
    Fragment,
    createElement,
    h
} from './jsx-runtime';

/**
 * Initialize the complete rendering module
 */
export function initializeRenderingModule(): void {
    console.log('ZenithKernel Rendering Module: Initializing islands architecture...');

    // Use the enhanced loader's initializeIslands
    initializeIslands();

    // Log successful initialization
    console.log('ZenithKernel Rendering Module: Islands architecture ready');
}

/**
 * Module metadata
 */
export const MODULE_INFO = {
    name: 'ZenithKernel Rendering Module',
    version: '1.0.0',
    description: 'Islands architecture implementation for ZenithKernel',
    features: [
        'Custom JSX Runtime',
        'JIT Island Hydration',
        'ECS Integration',
        'Hydra Event System',
        'Multiple Hydration Strategies',
        'TypeScript Support'
    ],
    exports: [
        'jsx-runtime',
        'types',
        'islands'
    ]
};

export {// @ts-ignore
islandLoader } from "./island-loader"