/**
 * HydraLoader Component
 * Handles loading and hydrating Hydra components in the client
 */

import { HydraComponentDefinition } from '../types';

/**
 * Configuration options for the HydraLoader
 */
export interface HydraLoaderOptions {
  /**
   * Strategy for loading components
   */
  strategy?: 'immediate' | 'visible' | 'idle' | 'interaction';
  
  /**
   * Trust level required for components
   */
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
  
  /**
   * Maximum time to wait for hydration in ms
   */
  timeout?: number;
  
  /**
   * Whether to use SSR if available
   */
  ssr?: boolean;
}

/**
 * HydraLoader component for loading and hydrating island components
 */
export class HydraLoader {
  private components: Map<string, HydraComponentDefinition> = new Map();
  private options: HydraLoaderOptions;
  
  constructor(options: HydraLoaderOptions = {}) {
    this.options = {
      strategy: 'immediate',
      trustLevel: 'local',
      timeout: 2000,
      ssr: true,
      ...options
    };
  }
  
  /**
   * Register a component with the loader
   */
  registerComponent(id: string, component: HydraComponentDefinition): void {
    this.components.set(id, component);
  }
  
  /**
   * Get a registered component by ID
   */
  getComponent(id: string): HydraComponentDefinition | undefined {
    return this.components.get(id);
  }
  
  /**
   * Hydrate a component in the specified element
   */
  async hydrate(
    elementId: string, 
    componentId: string, 
    props: Record<string, any> = {}, 
    options?: HydraLoaderOptions
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID ${elementId} not found for hydration`);
      return;
    }
    
    const component = this.components.get(componentId);
    if (!component) {
      console.error(`Component ${componentId} not registered for hydration`);
      return;
    }
    
    const mergedOptions = { ...this.options, ...options };
    
    try {
      // Apply hydration based on strategy
      switch (mergedOptions.strategy) {
        case 'visible':
          await this.hydrateWhenVisible(element, component, props, mergedOptions);
          break;
        case 'idle':
          await this.hydrateWhenIdle(element, component, props, mergedOptions);
          break;
        case 'interaction':
          this.hydrateOnInteraction(element, component, props, mergedOptions);
          break;
        case 'immediate':
        default:
          await this.hydrateImmediate(element, component, props, mergedOptions);
      }
    } catch (error) {
      console.error(`Error hydrating component ${componentId}:`, error);
    }
  }
  
  private async hydrateImmediate(
    element: HTMLElement,
    component: HydraComponentDefinition,
    props: Record<string, any>,
    options: HydraLoaderOptions
  ): Promise<void> {
    await component.component.mount(element, props, { 
      env: 'client',
      strategy: options.strategy,
      trustLevel: options.trustLevel
    });
  }
  
  private async hydrateWhenVisible(
    element: HTMLElement,
    component: HydraComponentDefinition,
    props: Record<string, any>,
    options: HydraLoaderOptions
  ): Promise<void> {
    // Use Intersection Observer to detect when element is visible
    return new Promise((resolve) => {
      const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          await this.hydrateImmediate(element, component, props, options);
          resolve();
        }
      });
      
      observer.observe(element);
    });
  }
  
  private async hydrateWhenIdle(
    element: HTMLElement,
    component: HydraComponentDefinition,
    props: Record<string, any>,
    options: HydraLoaderOptions
  ): Promise<void> {
    // Use requestIdleCallback to hydrate when browser is idle
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(async () => {
          await this.hydrateImmediate(element, component, props, options);
          resolve();
        });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(async () => {
          await this.hydrateImmediate(element, component, props, options);
          resolve();
        }, 200);
      }
    });
  }
  
  private hydrateOnInteraction(
    element: HTMLElement,
    component: HydraComponentDefinition,
    props: Record<string, any>,
    options: HydraLoaderOptions
  ): void {
    // Add placeholder until user interaction
    element.setAttribute('data-hydra-pending', 'true');
    
    const hydrateNow = async () => {
      element.removeEventListener('click', hydrateNow);
      element.removeEventListener('mouseover', hydrateNow);
      element.removeEventListener('focus', hydrateNow);
      element.removeAttribute('data-hydra-pending');
      
      await this.hydrateImmediate(element, component, props, options);
    };
    
    element.addEventListener('click', hydrateNow);
    element.addEventListener('mouseover', hydrateNow);
    element.addEventListener('focus', hydrateNow);
  }
}
