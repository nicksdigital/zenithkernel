/**
 * Enhanced Hydra Runtime Integration
 * Integrates HydraContextManager and SignalDOMBinder with the existing hydra-runtime
 */

import { 
  HydraContext, 
  hydrateLocalHydra as originalHydrateLocal,
  hydrateRemoteHydra as originalHydrateRemote,
  registerIsland,
  getRegisteredIsland
} from '../../lib/hydra-runtime';

import { 
  HydraContextManager, 
  getHydraContextManager,
  createReactiveHydraContext,
  type HydraIslandContext,
  type HydraContextOptions
} from './HydraContextManager';

import { 
  SignalDOMBinder,
  getSignalDOMBinder,
  domBindings,
  createReactiveElement,
  type DOMBindingOptions,
  type AnimationBindingOptions
} from './SignalDOMBinder';

import { signal, computed, effect, Signal } from '../signals';
import { getSignalManager } from '../SignalManager';

export interface EnhancedHydraContext extends HydraContext {
  // Enhanced reactive capabilities
  reactive?: boolean;
  signals?: Record<string, Signal<any>>;
  bindingOptions?: DOMBindingOptions;
  
  // Animation support
  animations?: Record<string, AnimationBindingOptions>;
  
  // Advanced hydration strategies
  strategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual' | 'signal-driven';
  
  // Context sharing
  shareSignals?: string[]; // Signal keys to share with other islands
  inheritFrom?: string; // Parent island to inherit signals from
}

/**
 * Enhanced Hydra Runtime that integrates context management and signal-based DOM bindings
 */
export class EnhancedHydraRuntime {
  private contextManager: HydraContextManager;
  private domBinder: SignalDOMBinder;
  private signalManager: any;
  
  constructor() {
    this.contextManager = getHydraContextManager();
    this.domBinder = getSignalDOMBinder();
    this.signalManager = getSignalManager();
  }
  
  /**
   * Enhanced local hydration with reactive context and signal bindings
   */
  async hydrateLocalHydraEnhanced(
    elementId: string,
    entry: string,
    context: EnhancedHydraContext
  ): Promise<HydraIslandContext> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }
      
      console.log(`🌊⚡ Enhanced hydrating local island "${entry}" into element "${elementId}"`, context);
      
      // Create enhanced context with reactive capabilities
      const contextOptions: HydraContextOptions = {
        reactive: context.reactive !== false,
        shared: context.shareSignals && context.shareSignals.length > 0,
        zkVerified: !!context.zkProof
      };
      
      const islandContext = this.contextManager.createContext(
        elementId,
        context,
        contextOptions
      );
      
      // Set up signal inheritance if specified
      if (context.inheritFrom && context.inheritFrom !== elementId) {
        this.setupSignalInheritance(elementId, context.inheritFrom, context.shareSignals);
      }
      
      // Get the registered island
      const island = getRegisteredIsland(entry);
      if (!island) {
        throw new Error(`Island component "${entry}" not found`);
      }
      
      // Verify ZK proof if required
      if (context.zkProof && island.trustLevel && island.trustLevel !== 'unverified') {
        const zkValid = await this.verifyZKProofEnhanced(context.zkProof, context.peerId, islandContext);
        if (!zkValid) {
          throw new Error(`ZK proof verification failed for island "${entry}"`);
        }
      }
      
      // Extract props with signal support
      const props = this.extractEnhancedProps(element, islandContext);
      
      // Mount the island with enhanced capabilities
      element.setAttribute('data-hydra-state', 'mounting');
      
      const cleanup = await this.mountIslandWithSignals(
        element,
        island.component,
        props,
        islandContext,
        context
      );
      
      // Store enhanced cleanup function
      (element as any).__enhancedCleanup = () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
        this.contextManager.destroyContext(elementId);
        this.domBinder.removeBinding(elementId);
        console.log(`🧹 Cleaned up enhanced island "${entry}"`);
      };
      
      // Set final state
      element.setAttribute('data-hydra-state', 'hydrated');
      element.setAttribute('data-hydra-enhanced', 'true');
      
      console.log(`✅⚡ Successfully enhanced hydrated local island "${entry}"`);
      
      return islandContext;
      
    } catch (error) {
      console.error(`❌ Failed to enhanced hydrate local island "${entry}":`, error);
      const element = document.getElementById(elementId);
      if (element) {
        element.setAttribute('data-hydra-state', 'error');
        element.innerHTML = `<div class="hydra-error enhanced">Failed to load enhanced component: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
      }
      throw error;
    }
  }
  
  /**
   * Mount island component with enhanced signal bindings and reactive capabilities
   */
  private async mountIslandWithSignals(
    element: HTMLElement,
    component: any,
    props: any,
    context: HydraIslandContext,
    enhancedContext: EnhancedHydraContext
  ): Promise<(() => void) | void> {
    // Create signal-enhanced props
    const signalProps = this.createSignalProps(props, context);
    
    // Mount the component with enhanced context
    const mountResult = await component.mount(element, signalProps, context);
    
    // Set up reactive DOM bindings if specified
    if (enhancedContext.reactive !== false && context.signals) {
      this.setupReactiveDOMBindings(element, context, enhancedContext);
    }
    
    // Set up animations if specified
    if (enhancedContext.animations) {
      this.setupAnimationBindings(element, context, enhancedContext.animations);
    }
    
    // Set up hydration strategy
    if (enhancedContext.strategy && enhancedContext.strategy !== 'immediate') {
      this.setupHydrationStrategy(element, enhancedContext.strategy, context);
    }
    
    return mountResult;
  }
  
  /**
   * Create reactive props from context signals
   */
  private createSignalProps(props: any, context: HydraIslandContext): any {
    const signalProps = { ...props };
    
    // Add reactive signals as props
    if (context.signals) {
      for (const [key, signal] of Object.entries(context.signals)) {
        // Create reactive getter for the signal value
        Object.defineProperty(signalProps, key, {
          get: () => signal.value,
          enumerable: true,
          configurable: true
        });
        
        // Also provide the signal itself with $ prefix
        signalProps[`$${key}`] = signal;
      }
    }
    
    return signalProps;
  }
  
  /**
   * Set up reactive DOM bindings based on context and configuration
   */
  private setupReactiveDOMBindings(
    element: HTMLElement,
    context: HydraIslandContext,
    enhancedContext: EnhancedHydraContext
  ): void {
    if (!context.signals) return;
    
    const options = enhancedContext.bindingOptions || {};
    
    // Auto-bind common signals to DOM attributes
    const autoBindings: Record<string, string> = {
      'message': 'data-message',
      'trustScore': 'data-trust-score',
      'zkProofStatus': 'data-zk-status',
      'peerId': 'data-peer-id'
    };
    
    for (const [signalKey, attribute] of Object.entries(autoBindings)) {
      const signal = context.signals[signalKey];
      if (signal) {
        this.domBinder.bindAttribute(element, attribute, signal, {
          ...options,
          transform: (value) => String(value ?? ''),
          immediate: true
        });
      }
    }
    
    // Bind trust score to visual indicators
    if (context.trustScore) {
      // Bind trust score to a CSS custom property for styling
      this.domBinder.bindStyle(element, '--trust-score', context.trustScore, {
        transform: (score) => `${Math.max(0, Math.min(100, score))}%`,
        immediate: true
      });
      
      // Bind trust level classes
      const trustClassSignal = computed(() => {
        const score = context.trustScore!.value;
        if (score >= 80) return 'trust-verified';
        if (score >= 50) return 'trust-community';
        if (score >= 25) return 'trust-local';
        return 'trust-unverified';
      });

      // Wrap computed signal in a plain signal for type compatibility
      const trustClassStringSignal = signal(trustClassSignal.value);
      effect(() => {
        trustClassStringSignal.value = trustClassSignal.value;
      });

      // @ts-ignore
      // Bind the computed class signal to the element
      this.domBinder.bindClassList(element, trustClassStringSignal, options);
    }
    
    // Bind ZK proof status to visual indicators
    if (context.zkProofStatus) {
      this.domBinder.bindAttribute(element, 'data-zk-verified', context.zkProofStatus, {
        transform: (status) => status === 'verified' ? 'true' : 'false',
        immediate: true
      });
      
      // Add ZK status classes
      const zkClassSignal = computed(() => {
        const status = context.zkProofStatus!.value;
        return `zk-${status}`;
      });
      
      // @ts-ignore
      // Wrap computed signal in a plain signal for type compatibility
      this.domBinder.bindClassList(element, zkClassSignal, options);
    }
  }
  
  /**
   * Set up animation bindings for enhanced visual feedback
   */
  private setupAnimationBindings(
    element: HTMLElement,
    context: HydraIslandContext,
    animations: Record<string, AnimationBindingOptions>
  ): void {
    if (!context.signals) return;
    
    for (const [signalKey, animationOptions] of Object.entries(animations)) {
      const signal = context.signals[signalKey];
      if (signal) {
        // Determine the CSS property to animate based on signal type
        let property = 'opacity';
        
        if (signalKey === 'trustScore') {
          property = 'background-color';
          animationOptions.transform = (score) => {
            const hue = Math.round((score / 100) * 120); // Red to green
            return `hsl(${hue}, 70%, 50%)`;
          };
        } else if (signalKey === 'zkProofStatus') {
          property = 'border-color';
          animationOptions.transform = (status) => {
            switch (status) {
              case 'verified': return '#22c55e';
              case 'failed': return '#ef4444';
              case 'pending': return '#f59e0b';
              default: return '#6b7280';
            }
          };
        }
        
        this.domBinder.bindAnimated(element, property, signal, animationOptions);
      }
    }
  }
  
  /**
   * Set up hydration strategy for enhanced loading patterns
   */
  private setupHydrationStrategy(
    element: HTMLElement,
    strategy: string,
    context: HydraIslandContext
  ): void {
    switch (strategy) {
      case 'visible':
        this.setupVisibilityBasedHydration(element, context);
        break;
      case 'interaction':
        this.setupInteractionBasedHydration(element, context);
        break;
      case 'signal-driven':
        this.setupSignalDrivenHydration(element, context);
        break;
      case 'idle':
        this.setupIdleHydration(element, context);
        break;
    }
  }
  
  /**
   * Set up visibility-based hydration with signal feedback
   */
  private setupVisibilityBasedHydration(
    element: HTMLElement,
    context: HydraIslandContext
  ): void {
    if (!context.signals) {
      context.signals = {};
    }
    
    const visibilitySignal = signal(false);
    context.signals.isVisible = visibilitySignal;
    
    this.domBinder.bindVisibility(element, visibilitySignal, {
      threshold: 0.1
    });
    
    // Update hydration state based on visibility
    effect(() => {
      if (visibilitySignal.value) {
        element.setAttribute('data-hydra-visible', 'true');
        element.classList.add('hydra-visible');
      } else {
        element.setAttribute('data-hydra-visible', 'false');
        element.classList.remove('hydra-visible');
      }
    });
  }
  
  /**
   * Set up interaction-based hydration
   */
  private setupInteractionBasedHydration(
    element: HTMLElement,
    context: HydraIslandContext
  ): void {
    if (!context.signals) {
      context.signals = {};
    }
    
    const interactionSignal = signal(false);
    context.signals.hasInteracted = interactionSignal;
    
    const interactionEvents = ['click', 'mouseenter', 'focus', 'touchstart'];
    
    const handleInteraction = () => {
      interactionSignal.value = true;
      element.setAttribute('data-hydra-interacted', 'true');
      element.classList.add('hydra-interacted');
      
      // Remove event listeners after first interaction
      interactionEvents.forEach(event => {
        element.removeEventListener(event, handleInteraction);
      });
    };
    
    interactionEvents.forEach(event => {
      element.addEventListener(event, handleInteraction, { once: true });
    });
  }
  
  /**
   * Set up signal-driven hydration based on context signal changes
   */
  private setupSignalDrivenHydration(
    element: HTMLElement,
    context: HydraIslandContext
  ): void {
    if (!context.signals) return;
    
    // Create a computed signal that determines hydration readiness
    const hydrationReady = computed(() => {
      // Example logic: hydrate when trust score is high enough
      const trustScore = context.trustScore?.value ?? 0;
      const zkVerified = context.zkProofStatus?.value === 'verified';
      
      return trustScore >= 50 || zkVerified;
    });
    
    effect(() => {
      if (hydrationReady.value) {
        element.setAttribute('data-hydra-ready', 'true');
        element.classList.add('hydra-ready');
      } else {
        element.setAttribute('data-hydra-ready', 'false');
        element.classList.remove('hydra-ready');
      }
    });
  }
  
  /**
   * Set up idle hydration using requestIdleCallback
   */
  private setupIdleHydration(
    element: HTMLElement,
    context: HydraIslandContext
  ): void {
    if (!context.signals) {
      context.signals = {};
    }
    
    const idleSignal = signal(false);
    context.signals.isIdle = idleSignal;
    
    const scheduleIdleHydration = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          idleSignal.value = true;
          element.setAttribute('data-hydra-idle', 'true');
          element.classList.add('hydra-idle');
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          idleSignal.value = true;
          element.setAttribute('data-hydra-idle', 'true');
          element.classList.add('hydra-idle');
        }, 100);
      }
    };
    
    scheduleIdleHydration();
  }
  
  /**
   * Set up signal inheritance between islands
   */
  private setupSignalInheritance(
    childIslandId: string,
    parentIslandId: string,
    signalKeys?: string[]
  ): void {
    const parentContext = this.contextManager.getContext(parentIslandId);
    if (!parentContext || !parentContext.signals) {
      console.warn(`Parent island ${parentIslandId} not found or has no signals`);
      return;
    }
    
    const keysToShare = signalKeys || Object.keys(parentContext.signals);
    
    keysToShare.forEach(key => {
      if (parentContext.signals![key]) {
        this.contextManager.shareSignal(parentIslandId, childIslandId, key);
      }
    });
  }
  
  /**
   * Enhanced ZK proof verification with reactive feedback
   */
  private async verifyZKProofEnhanced(
    zkProof: string,
    peerId: string,
    context: HydraIslandContext
  ): Promise<boolean> {
    try {
      // Update status to pending
      if (context.zkProofStatus) {
        context.zkProofStatus.value = 'pending';
      }
      
      // Simulate verification process with realistic delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Simple verification logic (would be more complex in real implementation)
      const isValid = zkProof.startsWith('zk:') && zkProof.length > 10;
      
      // Update status based on result
      if (context.zkProofStatus) {
        context.zkProofStatus.value = isValid ? 'verified' : 'failed';
      }
      
      // Update trust score if verification succeeds
      if (isValid && context.trustScore) {
        const currentScore = context.trustScore.value;
        context.trustScore.value = Math.min(currentScore + 10, 100);
      }
      
      return isValid;
    } catch (error) {
      console.error('Enhanced ZK verification error:', error);
      if (context.zkProofStatus) {
        context.zkProofStatus.value = 'failed';
      }
      return false;
    }
  }
  
  /**
   * Extract enhanced props with signal support
   */
  private extractEnhancedProps(element: HTMLElement, context: HydraIslandContext): any {
    const props: any = {};
    
    // Extract from data-zk-props attribute
    const propsAttr = element.getAttribute('data-zk-props');
    if (propsAttr) {
      try {
        Object.assign(props, JSON.parse(propsAttr));
      } catch (error) {
        console.warn('Failed to parse data-zk-props:', error);
      }
    }
    
    // Add context data
    if (context.ecsEntity) {
      props.entityId = context.ecsEntity;
    }
    
    // Add signal accessors
    if (context.signals) {
      props.signals = context.signals;
    }
    
    return props;
  }
  
  /**
   * Create a reactive island with enhanced capabilities
   */
  createReactiveIsland(
    elementId: string,
    entry: string,
    enhancedContext: EnhancedHydraContext
  ): Promise<HydraIslandContext> {
    return this.hydrateLocalHydraEnhanced(elementId, entry, enhancedContext);
  }
  
  /**
   * Update island context with reactive propagation
   */
  updateIslandContext(
    elementId: string,
    updates: Partial<HydraIslandContext>
  ): void {
    this.contextManager.updateContext(elementId, updates);
  }
  
  /**
   * Get island context signals
   */
  getIslandSignals(elementId: string): Record<string, Signal<any>> | undefined {
    const context = this.contextManager.getContext(elementId);
    return context?.signals;
  }
  
  /**
   * Clean up enhanced island
   */
  cleanupEnhancedIsland(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      const cleanup = (element as any).__enhancedCleanup;
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      
      // Reset element state
      element.innerHTML = '';
      element.removeAttribute('data-hydra-state');
      element.removeAttribute('data-hydra-enhanced');
      element.removeAttribute('data-hydra-visible');
      element.removeAttribute('data-hydra-interacted');
      element.removeAttribute('data-hydra-ready');
      element.removeAttribute('data-hydra-idle');
      
      delete (element as any).__enhancedCleanup;
    }
  }
  
  /**
   * Get runtime statistics
   */
  getStats(): {
    activeIslands: number;
    totalBindings: number;
    contextHierarchy: Record<string, string[]>;
    bindingStats: any;
  } {
    return {
      activeIslands: this.contextManager.getActiveIslands().length,
      totalBindings: this.domBinder.getStats().totalBindings,
      contextHierarchy: this.contextManager.getContextHierarchy(),
      bindingStats: this.domBinder.getStats()
    };
  }
}

// Global enhanced runtime instance
let globalEnhancedHydraRuntime: EnhancedHydraRuntime | undefined;

/**
 * Get the global EnhancedHydraRuntime instance
 */
export function getEnhancedHydraRuntime(): EnhancedHydraRuntime {
  if (!globalEnhancedHydraRuntime) {
    globalEnhancedHydraRuntime = new EnhancedHydraRuntime();
  }
  return globalEnhancedHydraRuntime;
}

/**
 * Enhanced hydration function with reactive capabilities
 */
export async function hydrateLocalHydraEnhanced(
  elementId: string,
  entry: string,
  context: EnhancedHydraContext
): Promise<HydraIslandContext> {
  return getEnhancedHydraRuntime().hydrateLocalHydraEnhanced(elementId, entry, context);
}

/**
 * Utility functions for enhanced Hydra development
 */
export const enhancedHydra = {
  /**
   * Create a reactive island with default enhanced settings
   */
  createReactive(
    elementId: string,
    entry: string,
    context: Partial<EnhancedHydraContext> = {}
  ): Promise<HydraIslandContext> {
    const enhancedContext: EnhancedHydraContext = {
      peerId: 'enhanced-user',
      reactive: true,
      strategy: 'visible',
      ...context
    };
    
    return hydrateLocalHydraEnhanced(elementId, entry, enhancedContext);
  },
  
  /**
   * Create a signal-driven island
   */
  createSignalDriven(
    elementId: string,
    entry: string,
    signals: Record<string, Signal<any>>,
    context: Partial<EnhancedHydraContext> = {}
  ): Promise<HydraIslandContext> {
    return hydrateLocalHydraEnhanced(elementId, entry, {
      ...context,
      peerId: context.peerId || 'signal-user',
      reactive: true,
      strategy: 'signal-driven',
      signals
    });
  },
  
  /**
   * Create an animated island with trust-based animations
   */
  createAnimated(
    elementId: string,
    entry: string,
    context: Partial<EnhancedHydraContext> = {}
  ): Promise<HydraIslandContext> {
    return hydrateLocalHydraEnhanced(elementId, entry, {
      ...context,
      peerId: context.peerId || 'animated-user',
      reactive: true,
      animations: {
        trustScore: {
          duration: 500,
          easing: 'ease-out'
        },
        zkProofStatus: {
          duration: 300,
          easing: 'ease-in-out'
        }
      }
    });
  },
  
  /**
   * Get enhanced runtime
   */
  runtime: getEnhancedHydraRuntime,
  
  /**
   * DOM binding utilities
   */
  dom: domBindings,
  
  /**
   * Create reactive elements
   */
  element: createReactiveElement
};

// Export enhanced types
export type {
  
  HydraIslandContext,
  HydraContextOptions,
  DOMBindingOptions,
  AnimationBindingOptions
};
