/**
 * ZenithKernel Hydration Controller
 * 
 * Integrates Archipelago's proven hydration system with ZenithKernel's ECS architecture.
 * Provides priority-based hydration, intersection observer support, and ZK verification.
 */

import type { ZenithKernel } from '@core/ZenithKernel';
import type { HydraContext } from '@lib/hydra-runtime';
import type { IslandRegistration, HydrationStrategy } from './types';
import { ZenithTemplateParser } from './template-parser';

interface HydrationQueueItem {
  element: HTMLElement;
  islandName: string;
  priority: number;
  strategy: HydrationStrategy;
  props?: any;
  context?: HydraContext;
}

export interface ZenithHydrationControllerConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum hydrations per frame */
  maxHydrationsPerFrame?: number;
  /** Intersection observer root margin */
  rootMargin?: string;
  /** Intersection observer threshold */
  threshold?: number;
  /** Enable automatic DOM scanning */
  autoScan?: boolean;
  /** Enable performance monitoring */
  performanceMonitoring?: boolean;
}

/**
 * Enhanced Hydration Controller for ZenithKernel
 * Based on Archipelago's HydrationController but integrated with ECS and ZK systems
 */
export class ZenithHydrationController {
  private static instance: ZenithHydrationController | null = null;
  
  private kernel: ZenithKernel;
  private config: Required<ZenithHydrationControllerConfig>;
  private hydrationQueue: HydrationQueueItem[] = [];
  private hydratedElements = new Set<HTMLElement>();
  private isProcessing = false;
  private intersectionObserver?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private parser: ZenithTemplateParser;
  private performanceMetrics = {
    hydrationsCompleted: 0,
    averageHydrationTime: 0,
    failedHydrations: 0,
    queueHighWaterMark: 0
  };
  
  constructor(kernel: ZenithKernel, config: ZenithHydrationControllerConfig = {}) {
    this.kernel = kernel;
    this.config = {
      debug: false,
      maxHydrationsPerFrame: 1,
      rootMargin: '100px',
      threshold: 0.1,
      autoScan: true,
      performanceMonitoring: false,
      ...config
    };
    this.parser = new ZenithTemplateParser({
      enableZKDirectives: true,
      enableECSDirectives: true,
      enableHydrationDirectives: true,
      strict: false
    });
    
    if (ZenithHydrationController.instance) {
      console.warn('[ZenithHydrationController] Multiple instances created. Using new instance.');
    }
    ZenithHydrationController.instance = this;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ZenithHydrationController | null {
    return ZenithHydrationController.instance;
  }

  /**
   * Initialize the hydration controller
   */
  public async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      console.log('[ZenithHydrationController] Skipping initialization (SSR mode)');
      return;
    }

    this.log('Initializing ZenithHydrationController');
    
    // Set up intersection observer for visibility-based hydration
    this.setupIntersectionObserver();
    
    // Set up mutation observer for dynamic content
    if (this.config.autoScan) {
      this.setupMutationObserver();
    }

    // Initial DOM scan
    if (this.config.autoScan) {
      this.scanAndQueueAll();
    }

    this.log('ZenithHydrationController initialized');
  }

  /**
   * Destroy the hydration controller
   */
  public async destroy(): Promise<void> {
    this.log('Destroying ZenithHydrationController');
    
    // Clear queue and state
    this.hydrationQueue = [];
    this.hydratedElements.clear();
    this.isProcessing = false;
    
    // Clean up observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
    
    ZenithHydrationController.instance = null;
    this.log('ZenithHydrationController destroyed');
  }

  /**
   * Queue an island for hydration
   */
  public queueIslandHydration(
    element: HTMLElement,
    islandName: string,
    strategy: HydrationStrategy = 'immediate',
    props?: any,
    context?: HydraContext
  ): void {
    // Skip if already hydrated
    if (this.hydratedElements.has(element) || element.hasAttribute('data-hydra-state')) {
      return;
    }

    // Check if island is registered
    const registration = this.kernel.getIsland(islandName);
    if (!registration) {
      console.warn(`[ZenithHydrationController] Island "${islandName}" not registered`);
      return;
    }

    const priority = this.calculatePriority(element, strategy, registration);
    const queueItem: HydrationQueueItem = {
      element,
      islandName,
      priority,
      strategy,
      props,
      context
    };

    // Add to queue with priority sorting
    this.hydrationQueue.push(queueItem);
    this.hydrationQueue.sort((a, b) => a.priority - b.priority);
    
    // Update metrics
    this.performanceMetrics.queueHighWaterMark = Math.max(
      this.performanceMetrics.queueHighWaterMark,
      this.hydrationQueue.length
    );

    this.log(`Queued island "${islandName}" with strategy "${strategy}" and priority ${priority}`);

    // Process queue based on strategy
    if (strategy === 'immediate') {
      this.processQueue();
    }
  }

  /**
   * Hydrate an island immediately
   */
  public async hydrateIsland(
    element: HTMLElement,
    islandName: string,
    props?: any,
    context?: HydraContext
  ): Promise<void> {
    if (this.hydratedElements.has(element)) {
      return;
    }

    const startTime = this.config.performanceMonitoring ? performance.now() : 0;
    
    try {
      // Mark as hydrating
      element.setAttribute('data-hydra-state', 'hydrating');
      this.hydratedElements.add(element);

      // Enhanced context with ECS integration
      const enhancedContext = this.enhanceContext(element, context);

      // Use kernel's hydration method
      await this.kernel.hydrateIsland(islandName, element, props, enhancedContext);

      // Performance tracking
      if (this.config.performanceMonitoring) {
        const duration = performance.now() - startTime;
        this.updatePerformanceMetrics(duration, true);
      }

      this.log(`Successfully hydrated island "${islandName}"`);

      // Emit hydration event
      const event = new CustomEvent('zenith:hydrated', {
        bubbles: true,
        detail: { 
          islandName, 
          element, 
          context: enhancedContext,
          timestamp: Date.now()
        }
      });
      element.dispatchEvent(event);

    } catch (error) {
      // Handle hydration failure
      element.setAttribute('data-hydra-state', 'error');
      this.hydratedElements.delete(element);
      
      if (this.config.performanceMonitoring) {
        const duration = performance.now() - startTime;
        this.updatePerformanceMetrics(duration, false);
      }

      console.error(`[ZenithHydrationController] Failed to hydrate island "${islandName}":`, error);

      // Emit error event
      const errorEvent = new CustomEvent('zenith:hydration-error', {
        bubbles: true,
        detail: { 
          islandName, 
          element, 
          error,
          timestamp: Date.now()
        }
      });
      element.dispatchEvent(errorEvent);

      throw error;
    }
  }

  /**
   * Scan DOM and queue all hydratable elements
   */
  public scanAndQueueAll(): void {
    const selector = '[data-zk-island], [data-hydra-entry], [data-island]';
    const elements = document.querySelectorAll<HTMLElement>(selector);

    this.log(`Found ${elements.length} hydratable elements`);

    for (const element of elements) {
      this.processElement(element);
    }
  }

  /**
   * Process a single element for hydration
   */
  private processElement(element: HTMLElement): void {
    // Extract island configuration
    const islandName = element.getAttribute('data-zk-island') ||
                      element.getAttribute('data-hydra-entry') ||
                      element.getAttribute('data-island');
    
    if (!islandName) {
      return;
    }

    const strategy = (element.getAttribute('data-zk-strategy') ||
                     element.getAttribute('data-hydra-strategy') ||
                     'immediate') as HydrationStrategy;

    // Parse props and context from attributes
    const props = this.parseElementProps(element);
    const context = this.parseElementContext(element);

    // Handle different strategies
    switch (strategy) {
      case 'immediate':
        this.queueIslandHydration(element, islandName, strategy, props, context);
        break;
        
      case 'visible':
        this.observeForVisibility(element, islandName, props, context);
        break;
        
      case 'interaction':
        this.setupInteractionListener(element, islandName, props, context);
        break;
        
      case 'idle':
        this.scheduleIdleHydration(element, islandName, props, context);
        break;
        
      case 'manual':
        // Store metadata for manual hydration
        element.setAttribute('data-manual-hydration', JSON.stringify({
          islandName,
          props,
          context
        }));
        break;
        
      default:
        console.warn(`[ZenithHydrationController] Unknown hydration strategy: ${strategy}`);
        this.queueIslandHydration(element, islandName, 'immediate', props, context);
    }
  }

  /**
   * Process hydration queue (1 per frame)
   */
  private processQueue(): void {
    if (this.isProcessing || this.hydrationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const processNextBatch = () => {
      const itemsToProcess = this.hydrationQueue.splice(0, this.config.maxHydrationsPerFrame);
      
      if (itemsToProcess.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Process items in parallel
      const promises = itemsToProcess.map(item => 
        this.hydrateIsland(item.element, item.islandName, item.props, item.context)
          .catch(error => {
            console.error(`[ZenithHydrationController] Queue processing error:`, error);
          })
      );

      Promise.all(promises).then(() => {
        if (this.hydrationQueue.length > 0) {
          requestAnimationFrame(processNextBatch);
        } else {
          this.isProcessing = false;
        }
      });
    };

    requestAnimationFrame(processNextBatch);
  }

  /**
   * Set up intersection observer for visibility-based hydration
   */
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('[ZenithHydrationController] IntersectionObserver not supported');
      return;
    }

    this.intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const islandName = element.getAttribute('data-zk-island') ||
                           element.getAttribute('data-hydra-entry') ||
                           element.getAttribute('data-island');
          
          if (islandName && !this.hydratedElements.has(element)) {
            const props = this.parseElementProps(element);
            const context = this.parseElementContext(element);
            this.queueIslandHydration(element, islandName, 'visible', props, context);
          }
          
          this.intersectionObserver?.unobserve(element);
        }
      }
    }, {
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold
    });
  }

  /**
   * Set up mutation observer for dynamic content
   */
  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // Check if the added node itself is hydratable
            if (this.isHydratableElement(node)) {
              this.processElement(node);
            }
            
            // Check for hydratable children
            const hydratableChildren = node.querySelectorAll<HTMLElement>(
              '[data-zk-island], [data-hydra-entry], [data-island]'
            );
            for (const child of hydratableChildren) {
              this.processElement(child);
            }
          }
        }
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Observe element for visibility
   */
  private observeForVisibility(
    element: HTMLElement,
    islandName: string,
    props?: any,
    context?: HydraContext
  ): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    } else {
      // Fallback: immediate hydration
      this.queueIslandHydration(element, islandName, 'immediate', props, context);
    }
  }

  /**
   * Set up interaction listeners
   */
  private setupInteractionListener(
    element: HTMLElement,
    islandName: string,
    props?: any,
    context?: HydraContext
  ): void {
    const events = ['click', 'touchstart', 'mouseenter', 'focus'];
    
    const handleInteraction = () => {
      this.queueIslandHydration(element, islandName, 'interaction', props, context);
      
      // Remove listeners after first interaction
      for (const event of events) {
        element.removeEventListener(event, handleInteraction);
      }
    };

    for (const event of events) {
      element.addEventListener(event, handleInteraction, { once: true, passive: true });
    }
  }

  /**
   * Schedule idle hydration
   */
  private scheduleIdleHydration(
    element: HTMLElement,
    islandName: string,
    props?: any,
    context?: HydraContext
  ): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.queueIslandHydration(element, islandName, 'idle', props, context);
      });
    } else {
      // Fallback: use setTimeout
      setTimeout(() => {
        this.queueIslandHydration(element, islandName, 'idle', props, context);
      }, 100);
    }
  }

  /**
   * Calculate priority for hydration queue
   */
  private calculatePriority(
    element: HTMLElement,
    strategy: HydrationStrategy,
    registration: IslandRegistration
  ): number {
    let priority = 5; // Default priority

    // Strategy-based priority
    switch (strategy) {
      case 'immediate':
        priority = 1;
        break;
      case 'visible':
        priority = 3;
        break;
      case 'interaction':
        priority = 7;
        break;
      case 'idle':
        priority = 10;
        break;
      case 'manual':
        priority = 15;
        break;
    }

    // Explicit priority override
    const explicitPriority = element.getAttribute('data-hydra-priority') ||
                            element.getAttribute('data-zk-priority');
    if (explicitPriority) {
      const priorityMap = { high: 1, normal: 5, low: 10 };
      priority = priorityMap[explicitPriority as keyof typeof priorityMap] ?? parseInt(explicitPriority, 10) ?? priority;
    }

    // Trust level priority boost
    const trustLevel = registration.trustLevel;
    if (trustLevel === 'verified') {
      priority -= 1;
    } else if (trustLevel === 'unverified') {
      priority += 2;
    }

    return Math.max(1, priority);
  }

  /**
   * Parse props from element attributes
   */
  private parseElementProps(element: HTMLElement): any {
    const propsAttr = element.getAttribute('data-zk-props') ||
                     element.getAttribute('data-hydra-props') ||
                     element.getAttribute('data-props');
    
    if (!propsAttr) {
      return {};
    }

    try {
      return JSON.parse(propsAttr);
    } catch (error) {
      console.warn('[ZenithHydrationController] Failed to parse props:', error);
      return {};
    }
  }

  /**
   * Parse context from element attributes
   */
  private parseElementContext(element: HTMLElement): HydraContext {
    const contextAttr = element.getAttribute('data-zk-context') ||
                       element.getAttribute('data-hydra-context') ||
                       element.getAttribute('data-context');
    
    let baseContext: Partial<HydraContext> = {
      peerId: `hydration-${Date.now()}`
    };

    if (contextAttr) {
      try {
        baseContext = { ...baseContext, ...JSON.parse(contextAttr) };
      } catch (error) {
        console.warn('[ZenithHydrationController] Failed to parse context:', error);
      }
    }

    return this.enhanceContext(element, baseContext);
  }

  /**
   * Enhance context with ZK and ECS data
   */
  private enhanceContext(element: HTMLElement, baseContext?: Partial<HydraContext>): HydraContext {
    const context: HydraContext = {
      peerId: baseContext?.peerId || `hydration-${Date.now()}`,
      ...baseContext
    };

    // Extract ZK data
    const zkProof = element.getAttribute('data-zk-proof');
    const zkTrust = element.getAttribute('data-zk-trust');
    
    if (zkProof) {
      context.zkProof = zkProof;
    }
    
    if (zkTrust) {
      context.trustLevel = zkTrust as any;
    }

    // Extract ECS data
    const ecsEntity = element.getAttribute('data-ecs-entity');
    if (ecsEntity) {
      const entityId = parseInt(ecsEntity, 10);
      // @ts-ignore
      context.ecsEntity = isNaN(entityId) ? ecsEntity : entityId;
    }

    return context;
  }

  /**
   * Check if element is hydratable
   */
  private isHydratableElement(element: HTMLElement): boolean {
    return element.hasAttribute('data-zk-island') ||
           element.hasAttribute('data-hydra-entry') ||
           element.hasAttribute('data-island');
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(duration: number, success: boolean): void {
    if (success) {
      this.performanceMetrics.hydrationsCompleted++;
      this.performanceMetrics.averageHydrationTime = 
        (this.performanceMetrics.averageHydrationTime * (this.performanceMetrics.hydrationsCompleted - 1) + duration) /
        this.performanceMetrics.hydrationsCompleted;
    } else {
      this.performanceMetrics.failedHydrations++;
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Get current queue status
   */
  public getQueueStatus() {
    return {
      queueLength: this.hydrationQueue.length,
      isProcessing: this.isProcessing,
      hydratedCount: this.hydratedElements.size
    };
  }

  /**
   * Manually trigger hydration for an element
   */
  public async manualHydrate(elementId: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    const manualData = element.getAttribute('data-manual-hydration');
    if (!manualData) {
      throw new Error(`Element ${elementId} is not configured for manual hydration`);
    }

    try {
      const { islandName, props, context } = JSON.parse(manualData);
      await this.hydrateIsland(element, islandName, props, context);
    } catch (error) {
      console.error('[ZenithHydrationController] Manual hydration failed:', error);
      throw error;
    }
  }

  /**
   * Debug logging
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[ZenithHydrationController] ${message}`, ...args);
    }
  }

  /**
   * Clean up hydrated element
   */
  public async cleanupElement(element: HTMLElement): Promise<void> {
    if (this.hydratedElements.has(element)) {
      await this.kernel.unmountIsland(element);
      this.hydratedElements.delete(element);
    }
  }

  /**
   * Pause hydration processing
   */
  public pause(): void {
    this.isProcessing = true; // This will prevent new processing
    this.log('Hydration processing paused');
  }

  /**
   * Resume hydration processing
   */
  public resume(): void {
    this.isProcessing = false;
    this.processQueue();
    this.log('Hydration processing resumed');
  }

  /**
   * Clear hydration queue
   */
  public clearQueue(): void {
    const queueLength = this.hydrationQueue.length;
    this.hydrationQueue = [];
    this.log(`Cleared hydration queue (${queueLength} items)`);
  }
}
