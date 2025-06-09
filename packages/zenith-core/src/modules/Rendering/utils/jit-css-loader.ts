/**
 * JIT CSS Loader for ZenithKernel Islands
 * 
 * This module provides Just-In-Time CSS loading functionality for Hydra islands.
 * It dynamically loads CSS modules only when the corresponding island is about
 * to be hydrated, optimizing initial page load performance.
 */

export interface CSSLoadOptions {
  /** Island name for CSS module loading */
  islandName: string;
  /** Custom CSS path (overrides default path generation) */
  customPath?: string;
  /** Whether to preload the CSS (useful for above-the-fold islands) */
  preload?: boolean;
  /** Callback when CSS is loaded successfully */
  onLoad?: () => void;
  /** Callback when CSS loading fails */
  onError?: (error: Error) => void;
}

export interface CSSModuleRegistry {
  /** Map of loaded CSS modules to prevent duplicate loading */
  loadedModules: Set<string>;
  /** Map of pending CSS loads to prevent duplicate requests */
  pendingLoads: Map<string, Promise<void>>;
  /** Map of preloaded CSS modules */
  preloadedModules: Set<string>;
}

// Global registry for tracking CSS module loading
const cssRegistry: CSSModuleRegistry = {
  loadedModules: new Set(),
  pendingLoads: new Map(),
  preloadedModules: new Set()
};

/**
 * Generates the CSS module path for an island
 */
function generateCSSPath(islandName: string): string {
  // Remove 'Island' suffix if present for cleaner paths
  const cleanName = islandName.replace(/Island$/, '');
  return `/styles/${islandName}.module.css`;
}

/**
 * Creates a CSS link element with proper attributes
 */
function createCSSLinkElement(href: string, islandName: string, isPreload = false): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = isPreload ? 'preload' : 'stylesheet';
  if (isPreload) {
    link.as = 'style';
  }
  link.href = href;
  link.dataset.hydraCssFor = islandName;
  link.dataset.hydraJit = 'true';
  
  // Add integrity and crossorigin for security if needed
  // link.integrity = '...'; // Would be set by build process
  // link.crossOrigin = 'anonymous';
  
  return link;
}

/**
 * Loads CSS for a specific island using JIT approach
 */
export async function loadIslandCSS(options: CSSLoadOptions): Promise<void> {
  const { islandName, customPath, preload = false, onLoad, onError } = options;
  const cssPath = customPath || generateCSSPath(islandName);
  const cacheKey = `${islandName}:${cssPath}`;

  // Check if already loaded
  if (cssRegistry.loadedModules.has(cacheKey)) {
    onLoad?.();
    return Promise.resolve();
  }

  // Check if currently loading
  if (cssRegistry.pendingLoads.has(cacheKey)) {
    return cssRegistry.pendingLoads.get(cacheKey)!;
  }

  // Create the loading promise
  const loadPromise = new Promise<void>((resolve, reject) => {
    // Check if preloaded
    if (preload && cssRegistry.preloadedModules.has(cacheKey)) {
      // Convert preload to stylesheet
      const existingPreload = document.head.querySelector(
        `link[data-hydra-css-for="${islandName}"][rel="preload"]`
      ) as HTMLLinkElement;
      
      if (existingPreload) {
        existingPreload.rel = 'stylesheet';
        existingPreload.removeAttribute('as');
        cssRegistry.loadedModules.add(cacheKey);
        cssRegistry.preloadedModules.delete(cacheKey);
        onLoad?.();
        resolve();
        return;
      }
    }

    // Check if already exists as stylesheet
    const existingLink = document.head.querySelector(
      `link[data-hydra-css-for="${islandName}"][rel="stylesheet"]`
    ) as HTMLLinkElement;
    
    if (existingLink) {
      cssRegistry.loadedModules.add(cacheKey);
      onLoad?.();
      resolve();
      return;
    }

    // Create new CSS link element
    const link = createCSSLinkElement(cssPath, islandName, preload);
    
    const handleLoad = () => {
      cssRegistry.loadedModules.add(cacheKey);
      if (preload) {
        cssRegistry.preloadedModules.add(cacheKey);
      }
      onLoad?.();
      resolve();
    };

    const handleError = (event: Event | string) => {
      const error = new Error(`Failed to load CSS for island ${islandName}: ${cssPath}`);
      console.error('JIT CSS Load Error:', error, event);
      onError?.(error);
      reject(error);
    };

    link.onload = handleLoad;
    link.onerror = handleError;

    // Insert into document head
    document.head.appendChild(link);

    // Timeout fallback
    setTimeout(() => {
      if (!cssRegistry.loadedModules.has(cacheKey)) {
        handleError('CSS load timeout');
      }
    }, 10000); // 10 second timeout
  });

  // Cache the promise
  cssRegistry.pendingLoads.set(cacheKey, loadPromise);

  try {
    await loadPromise;
  } finally {
    // Clean up pending loads
    cssRegistry.pendingLoads.delete(cacheKey);
  }

  return loadPromise;
}

/**
 * Preloads CSS for islands that are likely to be hydrated soon
 */
export async function preloadIslandCSS(islandNames: string[]): Promise<void> {
  const preloadPromises = islandNames.map(islandName =>
    loadIslandCSS({
      islandName,
      preload: true
    }).catch(error => {
      console.warn(`Failed to preload CSS for ${islandName}:`, error);
      // Don't fail the entire preload operation for one failure
    })
  );

  await Promise.allSettled(preloadPromises);
}

/**
 * Loads multiple CSS modules concurrently
 */
export async function loadMultipleIslandCSS(islandNames: string[]): Promise<void> {
  const loadPromises = islandNames.map(islandName =>
    loadIslandCSS({ islandName })
  );

  await Promise.all(loadPromises);
}

/**
 * Unloads CSS for an island (useful for cleanup or dynamic module replacement)
 */
export function unloadIslandCSS(islandName: string): void {
  const links = document.head.querySelectorAll(`link[data-hydra-css-for="${islandName}"]`);
  links.forEach(link => {
    link.remove();
  });

  // Clean up registry
  Array.from(cssRegistry.loadedModules).forEach(key => {
    if (key.startsWith(`${islandName}:`)) {
      cssRegistry.loadedModules.delete(key);
    }
  });

  Array.from(cssRegistry.preloadedModules).forEach(key => {
    if (key.startsWith(`${islandName}:`)) {
      cssRegistry.preloadedModules.delete(key);
    }
  });
}

/**
 * Gets CSS loading statistics for debugging
 */
export function getCSSLoadingStats(): {
  loadedCount: number;
  preloadedCount: number;
  pendingCount: number;
  loadedModules: string[];
  preloadedModules: string[];
  pendingModules: string[];
} {
  return {
    loadedCount: cssRegistry.loadedModules.size,
    preloadedCount: cssRegistry.preloadedModules.size,
    pendingCount: cssRegistry.pendingLoads.size,
    loadedModules: Array.from(cssRegistry.loadedModules),
    preloadedModules: Array.from(cssRegistry.preloadedModules),
    pendingModules: Array.from(cssRegistry.pendingLoads.keys())
  };
}

/**
 * Detects if critical CSS is loaded
 */
export function isCriticalCSSLoaded(): boolean {
  if (typeof document === 'undefined') {
    return true;
  }
  return !!document.head.querySelector('link[href*="critical.css"], style[data-critical="true"]');
}

/**
 * Loads critical CSS if not already loaded
 */
export async function ensureCriticalCSS(): Promise<void> {
  if (isCriticalCSSLoaded()) {
    return;
  }

  return loadIslandCSS({
    islandName: 'critical',
    customPath: '/styles/critical.css'
  });
}

/**
 * CSS Media Query utilities for responsive CSS loading
 */
export const cssMediaQueries = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  darkMode: '(prefers-color-scheme: dark)',
  reducedMotion: '(prefers-reduced-motion: reduce)'
};

/**
 * Conditionally loads CSS based on media queries
 */
export async function loadConditionalCSS(
  islandName: string,
  mediaQuery: string,
  customPath?: string
): Promise<void> {
  if (window.matchMedia(mediaQuery).matches) {
    return loadIslandCSS({
      islandName: `${islandName}-${mediaQuery.replace(/[^\w]/g, '-')}`,
      customPath
    });
  }
}

// Export the CSS registry for debugging
export { cssRegistry };
