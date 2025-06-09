/**
 * JSX Development Runtime for ZenithKernel Islands Architecture
 * 
 * This provides development-mode JSX runtime functions that include
 * additional debugging information and validation for development builds.
 */

  import { jsx, Fragment, JSX } from './jsx-runtime';

// Re-export JSX namespace for type compatibility
export type { JSX, Fragment } from './jsx-runtime';

interface DevAttributes {
  [key: string]: any;
  children?: any;
}

interface DebugInfo {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * JSX Development factory function with debugging support
 * This is used by TypeScript/Babel in development mode when jsx: 'react-jsx' is set
 */
export function jsxDEV(
  type: string | ((props: any) => HTMLElement | DocumentFragment),
  props: DevAttributes,
  key?: string,
  isStaticChildren?: boolean,
  source?: DebugInfo,
  self?: any
): HTMLElement | DocumentFragment {
  // In development mode, we can add additional debugging information
  if (process.env.NODE_ENV === 'development' && source) {
    // Add debug attributes for development tools
    const result = jsx(type, props, key);
    
    if (result instanceof HTMLElement) {
      // Add debug information as data attributes for development
      if (source.fileName) {
        result.setAttribute('data-jsx-source-file', source.fileName);
      }
      if (source.lineNumber) {
        result.setAttribute('data-jsx-source-line', String(source.lineNumber));
      }
      if (source.columnNumber) {
        result.setAttribute('data-jsx-source-column', String(source.columnNumber));
      }
    }
    
    return result;
  }
  
  // In production or without source info, just use the regular jsx function
  return jsx(type, props, key);
}

/**
 * JSX Development factory for static children (performance optimization)
 */
export const jsxsDEV = jsxDEV;

/**
 * Development mode createElement function for compatibility
 */
export function createElement(
  type: string | ((props: any) => HTMLElement | DocumentFragment),
  props: DevAttributes | null,
  ...children: any[]
): HTMLElement | DocumentFragment {
  return jsx(type, { ...props, children: children.flat() });
}

/**
 * Re-export runtime functions for compatibility
 */
export { jsx, jsx as jsxs } from './jsx-runtime';
