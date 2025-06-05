/**
 * ZenithKernel Unified Island Loader
 *
 * Handles discovery, loading, hydration, and CSS for all islands.
 * Integrates hydration strategies, event deduplication, and robust error handling.
 *
 * @remarks
 * - TypeScript-first, fully type-safe API
 * - Debug mode for event logging and DevTools
 */

import {
  IslandLoader,
  IslandConfig,
  IslandRegistration,
  IslandEvents,
  HydrationStrategy
} from './types';
import {
  loadIslandCSS,
  ensureCriticalCSS,
  preloadIslandCSS
} from './utils/jit-css-loader';
import { initCssSystem } from './utils/css-loader';

export class ZenithIslandLoader implements IslandLoader {
  private islands = new Map<string, IslandRegistration>();
  private hydratedElements = new WeakSet<HTMLElement>();
  private intersectionObserver?: IntersectionObserver;
  private idleCallback?: number;
  private eventTarget = new EventTarget();
  private cssPreloaded = false;
  private emittedEvents = new WeakMap<HTMLElement, Set<string>>();
  private debug: boolean;
  /**
   * Map of custom hydration strategies by name.
   */
  private customStrategies: Map<string, (element: HTMLElement, config: IslandConfig) => void> = new Map();

  constructor(debug = false) {
    this.debug = debug || (typeof window !== 'undefined' && (window as any).__ZENITH_ISLANDS_DEBUG__);
    this.setupIntersectionObserver();
    this.setupIdleHydration();
    this.ensureCriticalStyles();
    if (this.debug && typeof window !== 'undefined') {
      (window as any).__ZENITH_ISLANDS__ = this;
      console.info('[ZenithIslandLoader] Debug mode enabled. Inspect window.__ZENITH_ISLANDS__ for state.');
    }
  }

  private async ensureCriticalStyles(): Promise<void> {
    try {
      await ensureCriticalCSS();
    } catch (error) {
      console.warn('Failed to load critical CSS for islands:', error);
    }
  }

 /**
   * Discover all islands in the DOM and schedule hydration.
   * @returns {HTMLElement[]} Array of discovered island elements
   */
  discoverIslands(): HTMLElement[] {
    // PATCH: Support both legacy [data-zk-island] and new <template data-hydra-type="island"> syntax
    const islandElements: HTMLElement[] = [
      ...Array.from(document.querySelectorAll<HTMLElement>('[data-zk-island]')),
      ...Array.from(document.querySelectorAll<HTMLElement>('template[data-hydra-type="island"]'))
    ];

    // Preload CSS for discovered islands (first pass)
    if (!this.cssPreloaded) {
      const islandNames = new Set<string>();
      islandElements.forEach(element => {
        let name = element.getAttribute('data-zk-island');
        if (!name && element.tagName === 'TEMPLATE') {
          name = element.getAttribute('entry') || element.getAttribute('data-hydra-entry');
        }
        if (name) islandNames.add(name);
      });
      if (islandNames.size > 0) {
        preloadIslandCSS(Array.from(islandNames)).catch(error => {
          console.warn('Failed to preload island CSS:', error);
        });
        this.cssPreloaded = true;
      }
    }

    // Second pass: schedule hydration
    islandElements.forEach(element => {
      if (this.hydratedElements.has(element)) return;
      let events = this.emittedEvents.get(element);
      if (!events) {
        events = new Set();
        this.emittedEvents.set(element, events);
      }
      if (!events.has('discovered')) {
        const config = this.parseIslandConfig(element);
        if (config) {
          this.emit('island:discovered', { element, config });
          events.add('discovered');
          this.scheduleHydration(element, config);
        }
      }
    });
    if (this.debug) {
      console.debug('[ZenithIslandLoader] Discovered islands:', islandElements);
    }
    return islandElements;
  }
 /**
   * Hydrate a specific island element.
   * @param element - The DOM element to hydrate
   * @param config - The parsed island config
   * @throws If the island cannot be found or hydration fails
   */
  async hydrateIsland(element: HTMLElement, config: IslandConfig): Promise<void> {
    // PATCH: If element is a <template data-hydra-type="island">, replace with its content and hydrate the new root
    if (element.tagName === 'TEMPLATE' && element.getAttribute('data-hydra-type') === 'island') {
      const template = element as HTMLTemplateElement;
      const content = template.content.cloneNode(true);
      const parent = template.parentElement;
      if (parent) {
        // Insert the content and get the first element child as the new root
        const fragment = document.createDocumentFragment();
        fragment.appendChild(content);
        const nodes = Array.from(fragment.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE);
        let newRoot: HTMLElement | null = null;
        if (nodes.length > 0 && nodes[0] instanceof HTMLElement) {
          newRoot = nodes[0] as HTMLElement;
        } else {
          // fallback: wrap in a div if no element root
          newRoot = document.createElement('div');
          newRoot.appendChild(fragment);
        }
        parent.replaceChild(newRoot, template);
        // Hydrate the new root
        return this.hydrateIsland(newRoot, config);
      }
    }

    if (this.hydratedElements.has(element)) return;
    const { island: islandName, props = {}, context } = config;
    element.setAttribute('data-hydra-state', 'loading');
    let events = this.emittedEvents.get(element);
    if (!events) {
      events = new Set();
      this.emittedEvents.set(element, events);
    }
    if (!events.has('loading')) {
      this.emit('island:loading', { element, name: islandName });
      events.add('loading');
    }
    if (this.debug) {
      console.debug('[ZenithIslandLoader] Hydrating island:', { element, config });
    }
    try {
      // CSS: check for cssModule in registration or config
      let registration = this.islands.get(islandName);
      if (!registration) {
        registration = await this.loadIslandModule(islandName);
      }
      if (!registration) throw new Error(`Island "${islandName}" not found`);
      const cssModule = (registration as any).cssModule || (config as any).cssModule;
      if (cssModule) {
        await loadIslandCSS({ islandName });
      }
      // Mount the island
      await registration.component.mount(element, props, context);
      element.setAttribute('data-hydra-state', 'hydrated');
      element.classList.add('zk-island-hydrated');
      this.hydratedElements.add(element);
      if (!events.has('hydrated')) {
        this.emit('island:hydrated', { element, name: islandName });
        events.add('hydrated');
      }
    } catch (error) {
      element.setAttribute('data-hydra-state', 'error');
      element.classList.add('zk-island-error');
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('island:error', { element, name: islandName, error: err });
      console.error(`Failed to hydrate island "${islandName}":`, err);
      throw err;
    }
  }

  /**
   * Register an island component for hydration.
   * @param registration - The island registration object
   */
  registerIsland(registration: IslandRegistration): void {
    this.islands.set(registration.name, registration);
    if (this.debug) {
      console.info(`[ZenithIslandLoader] Registered island: ${registration.name}`);
    }
  }

  /**
   * Unregister an island component.
   * @param name - The name of the island to unregister
   */
  unregisterIsland(name: string): void {
    this.islands.delete(name);
    if (this.debug) {
      console.info(`[ZenithIslandLoader] Unregistered island: ${name}`);
    }
  }

  /**
   * Get a registered island by name.
   * @param name - The island name
   * @returns The IslandRegistration or undefined
   */
  getIsland(name: string): IslandRegistration | undefined {
    return this.islands.get(name);
  }

  /**
   * Cleanup and unmount all hydrated islands.
   */
  cleanup(): void {
    if (this.intersectionObserver) this.intersectionObserver.disconnect();
    if (this.idleCallback) cancelIdleCallback(this.idleCallback);
    document.querySelectorAll<HTMLElement>('[data-hydra-state="hydrated"]').forEach(element => {
      const islandName = element.getAttribute('data-zk-island');
      if (islandName) {
        const registration = this.islands.get(islandName);
        if (registration?.component.unmount) registration.component.unmount(element);
        this.emit('island:unmounted', { element, name: islandName });
      }
      this.emittedEvents.delete(element);
    });
    this.islands.clear();
    if (this.debug) {
      console.info('[ZenithIslandLoader] Cleanup complete.');
    }
  }

  /**
   * Add an event listener for island events.
   * @param type - The event type
   * @param listener - The event listener function
   */
  addEventListener<K extends keyof IslandEvents>(
    type: K,
    listener: (event: CustomEvent<IslandEvents[K]>) => void
  ): void {
    this.eventTarget.addEventListener(type, listener as EventListener);
  }

  /**
   * Remove an event listener for island events.
   * @param type - The event type
   * @param listener - The event listener function
   */
  removeEventListener<K extends keyof IslandEvents>(
    type: K,
    listener: (event: CustomEvent<IslandEvents[K]>) => void
  ): void {
    this.eventTarget.removeEventListener(type, listener as EventListener);
  }

  /**
   * Parse island configuration from a DOM element.
   * @param element - The island element
   * @returns The parsed IslandConfig or null
   */
  private parseIslandConfig(element: HTMLElement): IslandConfig | null {
    // PATCH: Support both legacy and new template syntax
    let islandName = element.getAttribute('data-zk-island');
    let propsAttr = element.getAttribute('data-zk-props');
    let strategyAttr = element.getAttribute('data-zk-strategy') as HydrationStrategy;
    let contextAttr = element.getAttribute('data-zk-context');

    // New syntax: <template data-hydra-type="island" entry="..." ...>
    if (!islandName && element.tagName === 'TEMPLATE' && element.getAttribute('data-hydra-type') === 'island') {
      islandName = element.getAttribute('entry') || element.getAttribute('data-hydra-entry');
      propsAttr = element.getAttribute('props') || element.getAttribute('data-hydra-props');
      strategyAttr = (element.getAttribute('strategy') || element.getAttribute('data-hydra-strategy')) as HydrationStrategy;
      contextAttr = element.getAttribute('context') || element.getAttribute('data-hydra-context');
    }

    if (!islandName) return null;
    const config: IslandConfig = { island: islandName };
    if (propsAttr) {
      try { config.props = JSON.parse(propsAttr); } catch (error) { console.error(`Failed to parse props for island "${islandName}":`, error); }
    }
    if (strategyAttr) config.strategy = strategyAttr;
    if (contextAttr) {
      try { config.context = JSON.parse(contextAttr); } catch (error) { console.error(`Failed to parse context for island "${islandName}":`, error); }
    }
    return config;
  }

  /**
   * Schedule hydration for an island based on its strategy.
   * @param element - The island element
   * @param config - The island config
   */
  private scheduleHydration(element: HTMLElement, config: IslandConfig): void {
    element.setAttribute('data-hydration-status', 'pending');
    const strategy = config.strategy || 'visible';
    // Check for custom strategy first
    if (this.customStrategies.has(strategy)) {
      this.customStrategies.get(strategy)?.(element, config);
      return;
    }
    switch (strategy) {
      case 'immediate':
        this.hydrateIsland(element, config);
        break;
      case 'visible':
        if (this.intersectionObserver) this.intersectionObserver.observe(element);
        break;
      case 'interaction':
        this.setupInteractionHydration(element, config);
        break;
      case 'idle':
        // Will be handled by idle callback
        break;
      case 'manual':
        // Do nothing, wait for manual trigger
        break;
    }
  }

  /**
   * Setup intersection observer for visible hydration.
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const config = this.parseIslandConfig(element);
            if (config) {
              this.hydrateIsland(element, config);
              this.intersectionObserver?.unobserve(element);
            }
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.1 }
    );
  }

  /**
   * Setup idle hydration for islands with 'idle' strategy.
   */
  private setupIdleHydration(): void {
    if (typeof requestIdleCallback === 'undefined') return;
    const hydrateIdleIslands = () => {
      const idleIslands = document.querySelectorAll<HTMLElement>('[data-zk-island][data-zk-strategy="idle"]:not([data-hydra-state])');
      idleIslands.forEach(element => {
        const config = this.parseIslandConfig(element);
        if (config) this.hydrateIsland(element, config);
      });
      this.idleCallback = requestIdleCallback(hydrateIdleIslands, { timeout: 5000 });
    };
    this.idleCallback = requestIdleCallback(hydrateIdleIslands, { timeout: 5000 });
  }

  /**
   * Setup interaction-based hydration for an island.
   * @param element - The island element
   * @param config - The island config
   */
  private setupInteractionHydration(element: HTMLElement, config: IslandConfig): void {
    const events = ['click', 'focus', 'mouseenter', 'touchstart'];
    const handleInteraction = () => {
      this.hydrateIsland(element, config);
      events.forEach(event => {
        element.removeEventListener(event, handleInteraction);
      });
    };
    events.forEach(event => {
      element.addEventListener(event, handleInteraction, { once: true });
    });
  }

  /**
   * Dynamically load an island module by name.
   * @param islandName - The island name
   * @returns The IslandRegistration or undefined
   */
  private async loadIslandModule(islandName: string): Promise<IslandRegistration | undefined> {
    try {
      const module = await import(`./islands/${islandName}.js`);
      if (module.default && typeof module.default.mount === 'function') {
        const registration: IslandRegistration = {
          name: islandName,
          component: module.default,
          modulePath: `./islands/${islandName}.js`,
          ...module.metadata
        };
        this.registerIsland(registration);
        return registration;
      }
      throw new Error(`Island module "${islandName}" does not export a valid component`);
    } catch (error) {
      console.error(`Failed to load island module "${islandName}":`, error);
      return undefined;
    }
  }

  /**
   * Emit an island event.
   * @param type - The event type
   * @param detail - The event detail
   */
  private emit<K extends keyof IslandEvents>(type: K, detail: IslandEvents[K]): void {
    if (this.debug) {
      console.debug(`[ZenithIslandLoader] Event: ${type}`, detail);
    }
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Register a custom hydration strategy.
   * @param name - The strategy name
   * @param fn - The strategy function (element, config) => void
   */
  public registerHydrationStrategy(name: string, fn: (element: HTMLElement, config: IslandConfig) => void): void {
    this.customStrategies.set(name, fn);
    if (this.debug) {
      console.info(`[ZenithIslandLoader] Registered custom hydration strategy: ${name}`);
    }
  }
}

/**
 * Global island loader instance
 */
export const islandLoader = new ZenithIslandLoader();

/**
 * Initialize the island system
 */
export function initializeIslands(): void {
  ensureCriticalCSS().catch(err => console.warn('Critical CSS load error:', err));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      islandLoader.discoverIslands();
    });
  } else {
    islandLoader.discoverIslands();
  }
  const observer = new MutationObserver((mutations) => {
    let shouldRescan = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          if (node.hasAttribute('data-zk-island') || node.querySelector('[data-zk-island]')) {
            shouldRescan = true;
          }
        }
      });
    });
    if (shouldRescan) {
      islandLoader.discoverIslands();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Manually hydrate an island by selector or element
 */
export async function hydrateIsland(
  target: string | HTMLElement, 
  config?: Partial<IslandConfig>
): Promise<void> {
  const element = typeof target === 'string' 
    ? document.querySelector<HTMLElement>(target)
    : target;

  if (!element) {
    throw new Error(`Element not found: ${target}`);
  }

  const parsedConfig = islandLoader['parseIslandConfig'](element);
  if (!parsedConfig) {
    throw new Error('Element is not a valid island');
  }

  const finalConfig = { ...parsedConfig, ...config };
  
  if (finalConfig.island) {
    await loadIslandCSS({ islandName: finalConfig.island });
  }
  
  return islandLoader.hydrateIsland(element, finalConfig);
}

/**
 * Scan the DOM for all islands and hydrate them
 */
export async function scanAndHydrateIslands(): Promise<void> {
  const islandElements = islandLoader.discoverIslands();
  
  const hydrationPromises = islandElements.map(async (element) => {
    const config = islandLoader['parseIslandConfig'](element);
    if (config) {
      try {
        await islandLoader.hydrateIsland(element, config);
      } catch (error) {
        console.error(`Failed to hydrate island:`, error);
      }
    }
  });
  
  await Promise.allSettled(hydrationPromises);
}

/**
 * Initialize the complete island system with CSS support
 */
export function initIslandSystem(): () => void {
  const cssCleanup = initCssSystem();
  initializeIslands();
  return () => {
    cssCleanup?.();
    islandLoader.cleanup();
  };
}
