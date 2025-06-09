/**
 * ZenithKernel Hydra JSX Support
 * 
 * This file exports the Hydra JSX component and related types for use in JSX templates.
 */

import type { HydraContext } from './index';

/**
 * Hydra component props
 */
export interface HydraProps {
  /** Component type */
  type: 'island' | 'component' | 'fragment';
  /** Unique identifier for the component */
  id: string;
  /** Execution type */
  execType?: 'local' | 'remote' | 'hybrid';
  /** Component context */
  context?: Record<string, any>;
  /** Children elements */
  children?: any;
  /** Class name for styling */
  className?: string;
  /** Inline styles */
  style?: Record<string, any>;
}

/**
 * Hydra JSX component
 * Used as a marker for hydra-enabled components in JSX templates
 */
export const Hydra = (props: HydraProps, hydraContext?: HydraContext): any => {
  // This is just a marker component for the compiler/runtime
  // The actual implementation is handled by the hydra runtime
  return props.children;
};

// Export additional JSX helpers
export const HydraJSX = {
  createElement: (type: any, props: any, ...children: any[]): any => {
    if (type === Hydra) {
      return {
        type: 'HydraComponent',
        props: {
          ...props,
          children
        }
      };
    }
    return {
      type,
      props: {
        ...props,
        children
      }
    };
  }
};
