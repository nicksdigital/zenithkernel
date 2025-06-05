/**
 * Advanced Hydration Controller for Zenith Framework
 * 
 * Implements sophisticated hydration strategies based on archipelagoui patterns:
 * - immediate: Hydrate on page load
 * - visible: Hydrate when visible in viewport
 * - interaction: Hydrate on user interaction
 * - idle: Hydrate during browser idle time
 * - manual: Hydrate only when explicitly triggered
 */

import type { HydraContext } from '@lib/hydra-runtime';
import type { IslandRegistration } from './types';

export type HydrationStrategy = 
  | 'immediate'  // Hydrate on page load
  | 'visible'    // Hydrate when visible in viewport
  | 'interaction' // Hydrate on user interaction
  | 'idle'       // Hydrate during browser idle time
  | 'manual';    // Hydrate only when explicitly triggered

interface HydrationQueueItem {
  el: HTMLElement;
  entry: string;
  context: HydraContext;
  priority: number;
  strategy: HydrationStrategy;
}

export class HydrationController {
  private hydrationQueue: HydrationQueueItem[] = [];
  private intersectionObserver?: IntersectionObserver;
  private interactionListeners: Map<string, EventListener> = new Map();
  private isProcessing = false;
  private idleCallbackId?: number;

  constructor(
    private hydrateComponent: (elementId: string, entry: string, context: HydraContext) => Promise<void>
  ) {
    this.setupIntersectionObserver();
    this.setupIdleCallback();
  }

  /**
   * Queue an element for hydration based on strategy
   */
  public queueHydration(
    el: HTMLElement,
    entry: string,
    context: HydraContext,
    strategy: HydrationStrategy = 'immediate'
  ): void {
    const priority = this.getPriority(el, strategy);
    
    this.hydrationQueue.push({ el, entry, context, priority, strategy });
    this.hydrationQueue.sort((a, b) => a.priority - b.priority);
    
    // Setup appropriate listeners based on strategy
    if (strategy === 'visible') {
      this.intersectionObserver?.observe(el);
    } else if (strategy === 'interaction') {
      this.setupInteractionListeners(el, entry, context);
    } else if (strategy === 'idle') {
      this.scheduleIdleHydration();
    } else if (strategy === 'immediate') {
      this.startProcessing();
    }
  }

  /**
   * Process the hydration queue frame by frame
   */
  private processQueue(): void {
    if (this.hydrationQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const start = performance.now();
    const frameTimeBudget = 16; // ~60fps
    
    while (
      this.hydrationQueue.length > 0 && 
      performance.now() - start < frameTimeBudget
    ) {
      const next = this.hydrationQueue[0];
      
      // Skip if not ready for hydration based on strategy
      if (!this.isReadyForHydration(next)) {
        this.hydrationQueue.shift();
        this.hydrationQueue.push(next); // Move to end
        continue;
      }
      
      // Hydrate the component
      try {
        this.hydrateComponent(next.el.id, next.entry, next.context);
      } catch (error) {
        console.error('Hydration error:', error);
      }
      
      this.hydrationQueue.shift();
    }
    
    // Continue processing in next frame if needed
    if (this.hydrationQueue.length > 0) {
      requestAnimationFrame(() => this.processQueue());
    } else {
      this.isProcessing = false;
    }
  }

  /**
   * Start processing the hydration queue
   */
  private startProcessing(): void {
    if (!this.isProcessing) {
      requestAnimationFrame(() => this.processQueue());
    }
  }

  /**
   * Setup Intersection Observer for visibility-based hydration
   */
  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const queueItem = this.hydrationQueue.find(
              item => item.el === entry.target && item.strategy === 'visible'
            );
            if (queueItem) {
              queueItem.strategy = 'immediate';
              this.startProcessing();
            }
            this.intersectionObserver?.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  /**
   * Setup interaction listeners for interaction-based hydration
   */
  private setupInteractionListeners(
    el: HTMLElement,
    entry: string,
    context: HydraContext
  ): void {
    const listener = () => {
      const queueItem = this.hydrationQueue.find(
        item => item.el === el && item.strategy === 'interaction'
      );
      if (queueItem) {
        queueItem.strategy = 'immediate';
        this.startProcessing();
      }
      el.removeEventListener('click', listener);
      el.removeEventListener('mouseover', listener);
      el.removeEventListener('focus', listener);
    };

    el.addEventListener('click', listener);
    el.addEventListener('mouseover', listener);
    el.addEventListener('focus', listener);
    this.interactionListeners.set(el.id, listener);
  }

  /**
   * Setup idle callback for idle-based hydration
   */
  private setupIdleCallback(): void {
    if ('requestIdleCallback' in window) {
      this.scheduleIdleHydration();
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.processIdleQueue(), 1000);
    }
  }

  /**
   * Schedule idle hydration using requestIdleCallback
   */
  private scheduleIdleHydration(): void {
    if ('requestIdleCallback' in window) {
      this.idleCallbackId = window.requestIdleCallback(
        () => this.processIdleQueue(),
        { timeout: 1000 }
      );
    }
  }

  /**
   * Process items queued for idle hydration
   */
  private processIdleQueue(): void {
    const idleItems = this.hydrationQueue.filter(item => item.strategy === 'idle');
    idleItems.forEach(item => {
      item.strategy = 'immediate';
    });
    if (idleItems.length > 0) {
      this.startProcessing();
    }
  }

  /**
   * Get priority for hydration based on element and strategy
   */
  private getPriority(el: HTMLElement, strategy: HydrationStrategy): number {
    const basePriority = {
      immediate: 1,
      visible: 2,
      interaction: 3,
      idle: 4,
      manual: 5
    }[strategy] ?? 5;

    // Adjust priority based on viewport visibility
    const rect = el.getBoundingClientRect();
    const isInViewport = rect.top >= 0 && rect.top <= window.innerHeight;
    
    return isInViewport ? basePriority : basePriority + 5;
  }

  /**
   * Check if an item is ready for hydration
   */
  private isReadyForHydration(item: HydrationQueueItem): boolean {
    switch (item.strategy) {
      case 'immediate':
        return true;
      case 'visible':
        const rect = item.el.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight;
      case 'interaction':
      case 'idle':
      case 'manual':
        return false;
      default:
        return true;
    }
  }

  /**
   * Manually trigger hydration for an element
   */
  public triggerManualHydration(elementId: string): void {
    const queueItem = this.hydrationQueue.find(
      item => item.el.id === elementId && item.strategy === 'manual'
    );
    if (queueItem) {
      queueItem.strategy = 'immediate';
      this.startProcessing();
    }
  }

  /**
   * Clean up resources when controller is no longer needed
   */
  public destroy(): void {
    this.intersectionObserver?.disconnect();
    this.interactionListeners.forEach((listener, elementId) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.removeEventListener('click', listener);
        el.removeEventListener('mouseover', listener);
        el.removeEventListener('focus', listener);
      }
    });
    this.interactionListeners.clear();
    if (this.idleCallbackId && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(this.idleCallbackId);
    }
  }
}