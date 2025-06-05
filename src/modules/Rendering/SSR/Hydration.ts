/**
 * Enhanced SSR & Hydration implementation
 */

import { createAsyncRenderer, RenderPriority } from '../AsyncRenderer';

/**
 * Types of hydration strategies
 */
export enum HydrationStrategy {
  // Hydrate everything at once
  FULL = 'full',
  
  // Hydrate only visible components first, then the rest
  PROGRESSIVE = 'progressive',
  
  // Only hydrate components when they become visible
  LAZY = 'lazy',
  
  // Only hydrate on user interaction
  INTERACTION = 'interaction',
  
  // Hydrate critical components first, then progressively the rest
  CRITICAL_FIRST = 'critical-first',
  
  // Server controls hydration timing via special directives
  SERVER_CONTROLLED = 'server-controlled'
}

/**
 * Interface for hydration options
 */
export interface HydrationOptions {
  strategy?: HydrationStrategy;
  rootElement?: HTMLElement;
  timeout?: number;
  priority?: RenderPriority;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  debug?: boolean;
  idPrefix?: string;
}

/**
 * Hydration state for tracking progress
 */
interface HydrationState {
  isHydrating: boolean;
  completed: Set<string>;
  failed: Set<string>;
  pending: Set<string>;
  startTime: number;
}

/**
 * Enhanced hydration controller for SSR
 */
export class HydrationController {
  private options: HydrationOptions;
  private state: HydrationState;
  private asyncRenderer = createAsyncRenderer();
  private intersectionObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private eventListeners: Map<string, [string, EventListener][]> = new Map();
  
  constructor(options: HydrationOptions = {}) {
    this.options = {
      strategy: HydrationStrategy.PROGRESSIVE,
      rootElement: typeof document !== 'undefined' ? document.documentElement : undefined,
      timeout: 10000,
      priority: RenderPriority.NORMAL,
      debug: false,
      idPrefix: 'hydrate-',
      ...options
    };
    
    this.state = {
      isHydrating: false,
      completed: new Set(),
      failed: new Set(),
      pending: new Set(),
      startTime: 0
    };
  }
  
  /**
   * Start the hydration process
   */
  start(): void {
    if (this.state.isHydrating || typeof document === 'undefined') {
      return;
    }
    
    this.state.isHydrating = true;
    this.state.startTime = performance.now();
    
    // Find all elements with hydration markers
    const rootElement = this.options.rootElement || document.documentElement;
    const hydrateElements = rootElement.querySelectorAll('[data-hydrate]');
    
    // Setup hydration based on strategy
    switch (this.options.strategy) {
      case HydrationStrategy.FULL:
        this.hydrateAll(hydrateElements);
        break;
      
      case HydrationStrategy.PROGRESSIVE:
        this.hydrateProgressive(hydrateElements);
        break;
      
      case HydrationStrategy.LAZY:
        this.hydrateLazy(hydrateElements);
        break;
      
      case HydrationStrategy.INTERACTION:
        this.hydrateOnInteraction(hydrateElements);
        break;
      
      case HydrationStrategy.CRITICAL_FIRST:
        this.hydrateCriticalFirst(hydrateElements);
        break;
      
      case HydrationStrategy.SERVER_CONTROLLED:
        this.hydrateServerControlled(hydrateElements);
        break;
      
      default:
        this.hydrateProgressive(hydrateElements);
    }
  }
  
  /**
   * Hydrate all elements at once
   */
  private hydrateAll(elements: NodeListOf<Element>): void {
    elements.forEach(element => {
      const id = element.getAttribute('data-hydrate');
      if (id) {
        this.hydrateElement(element as HTMLElement, id);
      }
    });
    
    // Start a timeout to check if hydration completed
    setTimeout(() => {
      if (this.state.pending.size > 0) {
        this.log('Hydration timeout reached, forcing completion');
        this.complete();
      }
    }, this.options.timeout);
  }
  
  /**
   * Hydrate visible elements first, then others
   */
  private hydrateProgressive(elements: NodeListOf<Element>): void {
    const visibleElements: HTMLElement[] = [];
    const hiddenElements: HTMLElement[] = [];
    
    elements.forEach(element => {
      const el = element as HTMLElement;
      if (this.isElementVisible(el)) {
        visibleElements.push(el);
      } else {
        hiddenElements.push(el);
      }
    });
    
    // Hydrate visible elements with higher priority
    visibleElements.forEach(element => {
      const id = element.getAttribute('data-hydrate');
      if (id) {
        this.hydrateElement(element, id, RenderPriority.HIGH);
      }
    });
    
    // Hydrate hidden elements with lower priority
    hiddenElements.forEach(element => {
      const id = element.getAttribute('data-hydrate');
      if (id) {
        this.hydrateElement(element, id, RenderPriority.LOW);
      }
    });
    
    // Start a timeout to check if hydration completed
    setTimeout(() => {
      if (this.state.pending.size > 0) {
        this.log('Hydration timeout reached, forcing completion');
        this.complete();
      }
    }, this.options.timeout);
  }
  
  /**
   * Hydrate elements only when they become visible
   */
  private hydrateLazy(elements: NodeListOf<Element>): void {
    // Set up intersection observer
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const id = element.getAttribute('data-hydrate');
          
          if (id) {
            this.hydrateElement(element, id);
            
            // Stop observing this element
            this.intersectionObserver?.unobserve(element);
          }
        }
      });
    }, { rootMargin: '100px' }); // 100px margin to start hydrating just before it becomes visible
    
    // Start observing all elements
    elements.forEach(element => {
      this.intersectionObserver?.observe(element);
      
      const id = element.getAttribute('data-hydrate');
      if (id) {
        this.state.pending.add(id);
      }
    });
    
    // Start a timeout to ensure everything eventually gets hydrated
    setTimeout(() => {
      if (this.state.pending.size > 0) {
        this.log('Hydration timeout reached, hydrating remaining elements');
        
        // Hydrate all remaining elements
        elements.forEach(element => {
          const id = element.getAttribute('data-hydrate');
          if (id && !this.state.completed.has(id)) {
            this.hydrateElement(element as HTMLElement, id);
            this.intersectionObserver?.unobserve(element);
          }
        });
        
        // Complete hydration
        setTimeout(() => this.complete(), 500);
      }
    }, this.options.timeout);
  }
  
  /**
   * Hydrate elements on user interaction
   */
  private hydrateOnInteraction(elements: NodeListOf<Element>): void {
    const interactionEvents = ['mouseenter', 'focus', 'touchstart', 'click'];
    
    elements.forEach(element => {
      const id = element.getAttribute('data-hydrate');
      if (!id) return;
      
      this.state.pending.add(id);
      
      const el = element as HTMLElement;
      const listeners: [string, EventListener][] = [];
      
      // Create one listener for each event
      interactionEvents.forEach(eventName => {
        const listener = () => {
          this.hydrateElement(el, id);
          
          // Remove all event listeners after hydration
          listeners.forEach(([evt, listener]) => {
            el.removeEventListener(evt, listener);
          });
        };
        
        el.addEventListener(eventName, listener);
        listeners.push([eventName, listener]);
      });
      
      this.eventListeners.set(id, listeners);
    });
    
    // Start a timeout to ensure everything eventually gets hydrated
    setTimeout(() => {
      if (this.state.pending.size > 0) {
        this.log('Hydration timeout reached, hydrating remaining elements');
        
        // Hydrate all remaining elements
        elements.forEach(element => {
          const id = element.getAttribute('data-hydrate');
          if (id && !this.state.completed.has(id)) {
            this.hydrateElement(element as HTMLElement, id);
            
            // Remove associated event listeners
            const listeners = this.eventListeners.get(id);
            if (listeners) {
              listeners.forEach(([evt, listener]) => {
                element.removeEventListener(evt, listener);
              });
              this.eventListeners.delete(id);
            }
          }
        });
        
        // Complete hydration
        setTimeout(() => this.complete(), 500);
      }
    }, this.options.timeout);
  }
  
  /**
   * Hydrate critical elements first, then others progressively
   */
  private hydrateCriticalFirst(elements: NodeListOf<Element>): void {
    const critical: HTMLElement[] = [];
    const important: HTMLElement[] = [];
    const normal: HTMLElement[] = [];
    const deferred: HTMLElement[] = [];
    
    elements.forEach(element => {
      const el = element as HTMLElement;
      const priority = el.getAttribute('data-hydrate-priority');
      
      switch (priority) {
        case 'critical':
          critical.push(el);
          break;
        case 'important':
          important.push(el);
          break;
        case 'deferred':
          deferred.push(el);
          break;
        default:
          normal.push(el);
          break;
      }
    });
    
    // Schedule hydration in priority order
    const scheduleGroup = (elements: HTMLElement[], priority: RenderPriority) => {
      elements.forEach(element => {
        const id = element.getAttribute('data-hydrate');
        if (id) {
          this.hydrateElement(element, id, priority);
        }
      });
    };
    
    // Hydrate in order of priority
    scheduleGroup(critical, RenderPriority.IMMEDIATE);
    
    setTimeout(() => {
      scheduleGroup(important, RenderPriority.HIGH);
      
      setTimeout(() => {
        scheduleGroup(normal, RenderPriority.NORMAL);
        
        setTimeout(() => {
          scheduleGroup(deferred, RenderPriority.IDLE);
        }, 200);
      }, 100);
    }, 20);
    
    // Start a timeout to check if hydration completed
    setTimeout(() => {
      if (this.state.pending.size > 0) {
        this.log('Hydration timeout reached, forcing completion');
        this.complete();
      }
    }, this.options.timeout);
  }
  
  /**
   * Server-controlled hydration based on special directives
   */
  private hydrateServerControlled(elements: NodeListOf<Element>): void {
    const immediateElements: HTMLElement[] = [];
    const delayedElements: Map<number, HTMLElement[]> = new Map();
    
    elements.forEach(element => {
      const el = element as HTMLElement;
      const id = el.getAttribute('data-hydrate');
      if (!id) return;
      
      const delay = el.getAttribute('data-hydrate-delay');
      
      if (!delay) {
        immediateElements.push(el);
      } else {
        const delayMs = parseInt(delay, 10);
        if (isNaN(delayMs)) {
          immediateElements.push(el);
        } else {
          if (!delayedElements.has(delayMs)) {
            delayedElements.set(delayMs, []);
          }
          delayedElements.get(delayMs)?.push(el);
        }
      }
    });
    
    // Hydrate immediate elements first
    immediateElements.forEach(element => {
      const id = element.getAttribute('data-hydrate');
      if (id) {
        this.hydrateElement(element, id, RenderPriority.HIGH);
      }
    });
    
    // Schedule delayed elements
    delayedElements.forEach((elements, delay) => {
      setTimeout(() => {
        elements.forEach(element => {
          const id = element.getAttribute('data-hydrate');
          if (id) {
            this.hydrateElement(element, id);
          }
        });
      }, delay);
    });
    
    // Start a timeout to check if hydration completed
    setTimeout(() => {
      if (this.state.pending.size > 0) {
        this.log('Hydration timeout reached, forcing completion');
        this.complete();
      }
    }, this.options.timeout);
  }
  
  /**
   * Hydrate a specific element
   */
  private hydrateElement(
    element: HTMLElement,
    id: string,
    priority: RenderPriority = this.options.priority || RenderPriority.NORMAL
  ): void {
    if (this.state.completed.has(id) || this.state.failed.has(id)) {
      return;
    }
    
    this.state.pending.add(id);
    this.log(`Hydrating element: ${id}`);
    
    // Get hydration function by ID
    const hydrateFunction = this.getHydrationFunction(id);
    
    if (!hydrateFunction) {
      this.log(`No hydration function found for ${id}`, 'error');
      this.state.pending.delete(id);
      this.state.failed.add(id);
      return;
    }
    
    // Schedule the hydration
    this.asyncRenderer.scheduleTask(
      async () => {
        try {
          await hydrateFunction(element);
          this.state.pending.delete(id);
          this.state.completed.add(id);
          
          // Mark as hydrated
          element.setAttribute('data-hydrated', 'true');
          element.removeAttribute('data-hydrate');
          
          this.log(`Hydrated element: ${id}`);
          
          // Check if all hydration is complete
          if (this.state.pending.size === 0 && this.state.isHydrating) {
            this.complete();
          }
          
          return true;
        } catch (error) {
          this.log(`Error hydrating element ${id}: ${error}`, 'error');
          this.state.pending.delete(id);
          this.state.failed.add(id);
          
          // Mark as failed
          element.setAttribute('data-hydration-failed', 'true');
          
          if (this.options.onError) {
            this.options.onError(error instanceof Error ? error : new Error(String(error)));
          }
          
          return false;
        }
      },
      {
        priority,
        onError: (error) => {
          this.log(`Error in hydration task ${id}: ${error}`, 'error');
          this.state.pending.delete(id);
          this.state.failed.add(id);
          
          // Mark as failed
          element.setAttribute('data-hydration-failed', 'true');
          
          if (this.options.onError) {
            this.options.onError(error);
          }
        }
      }
    );
  }
  
  /**
   * Get hydration function by ID
   */
  private getHydrationFunction(id: string): ((element: HTMLElement) => Promise<void>) | null {
    // This would typically lookup from a global registry of hydration functions
    // In this example, we'll check for a global object with registered hydrators
    const globalHydrators = (window as any).__HYDRATORS__ || {};
    return globalHydrators[id] || null;
  }
  
  /**
   * Check if an element is visible
   */
  private isElementVisible(element: HTMLElement): boolean {
    if (!element.offsetParent && element.offsetHeight === 0 && element.offsetWidth === 0) {
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
  }
  
  /**
   * Complete the hydration process
   */
  private complete(): void {
    if (!this.state.isHydrating) return;
    
    this.state.isHydrating = false;
    const duration = performance.now() - this.state.startTime;
    
    this.log(`Hydration completed in ${duration.toFixed(2)}ms. Successful: ${this.state.completed.size}, Failed: ${this.state.failed.size}`);
    
    // Cleanup resources
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // Remove all remaining event listeners
    this.eventListeners.forEach((listeners, id) => {
      const elements = document.querySelectorAll(`[data-hydrate="${id}"]`);
      elements.forEach(element => {
        listeners.forEach(([evt, listener]) => {
          element.removeEventListener(evt, listener);
        });
      });
    });
    this.eventListeners.clear();
    
    // Call the completion callback
    if (this.options.onComplete) {
      this.options.onComplete();
    }
  }
  
  /**
   * Logger function
   */
  private log(message: string, level: 'info' | 'error' = 'info'): void {
    if (!this.options.debug) return;
    
    if (level === 'error') {
      console.error(`[HydrationController] ${message}`);
    } else {
      console.log(`[HydrationController] ${message}`);
    }
  }
}

/**
 * Register a hydration function for an island component
 */
export function registerHydrator(
  id: string,
  hydrateFunction: (element: HTMLElement) => Promise<void>
): void {
  if (typeof window !== 'undefined') {
    (window as any).__HYDRATORS__ = (window as any).__HYDRATORS__ || {};
    (window as any).__HYDRATORS__[id] = hydrateFunction;
  }
}

/**
 * Create a default hydration controller
 */
export function createHydrationController(options?: HydrationOptions): HydrationController {
  return new HydrationController(options);
}
