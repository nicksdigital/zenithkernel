/**
 * Hydration utilities for ZenithSDK
 * 
 * Provides helper functions for working with component hydration
 */

import type { ComponentContext } from '../components/ComponentController';

/**
 * Hydration strategy types
 */
export type HydrationStrategy = 
  | 'immediate'    // Component is hydrated immediately
  | 'visible'      // Component is hydrated when it becomes visible
  | 'intersection' // Component is hydrated when it intersects the viewport
  | 'idle'         // Component is hydrated during browser idle time
  | 'interaction'  // Component is hydrated on user interaction
  | 'media'        // Component is hydrated when a media query matches
  | 'none';        // Component is not hydrated (remains static)

/**
 * Hydration options
 */
export interface HydrationOptions {
  /**
   * Hydration strategy to use
   */
  strategy?: HydrationStrategy;
  
  /**
   * Priority (lower = more important)
   */
  priority?: number;
  
  /**
   * Trust level required for hydration
   */
  trustLevel?: 'high' | 'medium' | 'local' | 'none';
  
  /**
   * Additional hydration attributes
   */
  [key: string]: any;
}

/**
 * Hydration result interface
 */
export interface HydrationResult {
  /**
   * Time to hydrate in ms
   */
  time: number;
  
  /**
   * Hydration success or failure
   */
  success: boolean;
  
  /**
   * Strategy used for hydration
   */
  strategy: HydrationStrategy;
  
  /**
   * Error if hydration failed
   */
  error?: Error;
}

/**
 * Create hydration metadata for a component
 */
export function createHydrationMetadata(options: HydrationOptions = {}): Record<string, any> {
  return {
    hydrationStrategies: [options.strategy || 'visible'],
    trustLevel: options.trustLevel || 'local',
    priority: options.priority || 0,
    ...options
  };
}

/**
 * Check if element is visible in the viewport
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (typeof window === 'undefined') return false;
  
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Set up visibility observer for hydration
 */
export function observeVisibility(
  element: HTMLElement,
  onVisible: () => void,
  options: IntersectionObserverInit = {}
): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback for environments without IntersectionObserver
    if (isElementVisible(element)) {
      onVisible();
    }
    
    const handler = () => {
      if (isElementVisible(element)) {
        onVisible();
        window.removeEventListener('scroll', handler);
        window.removeEventListener('resize', handler);
      }
    };
    
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }
  
  // Use IntersectionObserver when available
  const observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      onVisible();
      observer.disconnect();
    }
  }, options);
  
  observer.observe(element);
  
  return () => observer.disconnect();
}

/**
 * Add interaction hydration trigger
 */
export function addInteractionTrigger(
  element: HTMLElement,
  onInteraction: () => void
): () => void {
  const events = ['mouseenter', 'click', 'touchstart', 'focus'];
  
  const handler = () => {
    onInteraction();
    events.forEach(event => element.removeEventListener(event, handler));
  };
  
  events.forEach(event => element.addEventListener(event, handler, { once: true, passive: true }));
  
  return () => {
    events.forEach(event => element.removeEventListener(event, handler));
  };
}

/**
 * Schedule hydration during idle time
 */
export function scheduleIdleHydration(onHydrate: () => void): () => void {
  if (typeof requestIdleCallback !== 'undefined') {
    const handle = requestIdleCallback(() => {
      onHydrate();
    });
    
    return () => cancelIdleCallback(handle);
  } else {
    // Fallback for browsers without requestIdleCallback
    const timeout = setTimeout(onHydrate, 200);
    return () => clearTimeout(timeout);
  }
}
