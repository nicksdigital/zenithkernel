/**
 * HydraContextManager - Advanced context management for Hydra islands
 * Integrates with SignalManager for reactive context sharing between islands
 */

import { SignalManager, getSignalManager } from '../SignalManager';
import { Signal, signal, computed, effect } from '../signals';
import type { HydraContext } from '../../lib/hydra-runtime';

export interface HydraContextOptions {
  persistent?: boolean; // Context survives island unmounting
  shared?: boolean; // Context shared across multiple islands
  reactive?: boolean; // Context values are reactive signals
  zkVerified?: boolean; // Context requires ZK verification
}

export interface HydraContextBinding {
  signalId: string;
  contextKey: string;
  signal: Signal<any>;
  validators?: ((value: any) => boolean)[];
  transform?: (value: any) => any;
}

export interface HydraIslandContext extends HydraContext {
  // Core Hydra properties
  islandId: string;
  parentContext?: string; // Parent island ID for nested contexts
  
  // Reactive state
  signals?: Record<string, Signal<any>>;
  bindings?: HydraContextBinding[];
  
  // ZK & Trust
  trustScore?: Signal<number>;
  zkProofStatus?: Signal<'pending' | 'verified' | 'failed' | 'expired'>;
  
  // ECS Integration
  ecsWorld?: any;
  watchedComponents?: string[];
  
  // Lifecycle
  mountTime?: number;
  lastUpdate?: number;
  hydrationStrategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
}

/**
 * Manages Hydra island contexts with reactive signal integration
 */
export class HydraContextManager {
  private contexts = new Map<string, HydraIslandContext>();
  private sharedContexts = new Map<string, HydraIslandContext>();
  private contextHierarchy = new Map<string, Set<string>>();
  private signalManager: SignalManager;
  
  private cleanupFunctions = new Map<string, (() => void)[]>();
  
  constructor() {
    this.signalManager = getSignalManager();
  }
  
  /**
   * Create a new Hydra context with reactive capabilities
   */
  createContext(
    islandId: string,
    baseContext: HydraContext,
    options: HydraContextOptions = {}
  ): HydraIslandContext {
    if (this.contexts.has(islandId)) {
      throw new Error(`Context already exists for island: ${islandId}`);
    }
    
    const context: HydraIslandContext = {
      ...baseContext,
      islandId,
      signals: {},
      bindings: [],
      mountTime: Date.now(),
      lastUpdate: Date.now(),
      hydrationStrategy: 'immediate'
    };
    
    // Initialize reactive properties
    if (options.reactive !== false) {
      this.initializeReactiveContext(context, options);
    }
    
    // Set up ZK verification if required
    if (options.zkVerified && context.zkProof) {
      this.setupZKVerification(context);
    }
    
    // Store context
    if (options.shared) {
      this.sharedContexts.set(islandId, context);
    } else {
      this.contexts.set(islandId, context);
    }
    
    console.log(`🌊 Created Hydra context for island: ${islandId}`, {
      reactive: options.reactive !== false,
      shared: options.shared,
      zkVerified: options.zkVerified
    });
    
    return context;
  }
  
  /**
   * Initialize reactive signals for context properties
   */
  private initializeReactiveContext(
    context: HydraIslandContext,
    options: HydraContextOptions
  ): void {
    const signals: Record<string, Signal<any>> = {};
    const cleanups: (() => void)[] = [];
    
    // Create reactive trust score
    if (typeof context.trustLevel === 'string') {
      const trustValue = this.getTrustLevelValue(context.trustLevel);
      signals.trustScore = signal(trustValue);
      context.trustScore = signals.trustScore;
    }
    
    // Create reactive ZK proof status
    if (context.zkProof) {
      signals.zkProofStatus = signal<'pending' | 'verified' | 'failed' | 'expired'>('pending');
      context.zkProofStatus = signals.zkProofStatus;
    }
    
    // Create signal for peer ID changes
    if (context.peerId) {
      signals.peerId = signal(context.peerId);
    }
    
    // Create reactive message signal
    if (context.message !== undefined) {
      signals.message = signal(context.message);
    }
    
    // Store signals in context
    context.signals = signals;
    
    // Register signals with SignalManager for DOM binding
    for (const [key, sig] of Object.entries(signals)) {
      const signalId = `${context.islandId}.${key}`;
      this.signalManager.registerSignal(signalId, sig);
      cleanups.push(() => this.signalManager.unregisterSignal(signalId));
    }
    
    this.cleanupFunctions.set(context.islandId, cleanups);
  }
  
  /**
   * Setup ZK proof verification for context
   */
  private setupZKVerification(context: HydraIslandContext): void {
    if (!context.zkProofStatus || !context.zkProof) return;
    
    // Simulate ZK verification process
    setTimeout(async () => {
      try {
        const isValid = await this.verifyZKProof(context.zkProof!, context.peerId);
        context.zkProofStatus!.value = isValid ? 'verified' : 'failed';
        
        // Update trust score based on verification
        if (context.trustScore && isValid) {
          context.trustScore.value = Math.min(context.trustScore.value + 10, 100);
        }
      } catch (error) {
        console.error('ZK verification error:', error);
        context.zkProofStatus!.value = 'failed';
      }
    }, 100);
  }
  
  /**
   * Get context for an island
   */
  getContext(islandId: string): HydraIslandContext | undefined {
    return this.contexts.get(islandId) || this.sharedContexts.get(islandId);
  }
  
  /**
   * Update context properties with reactive propagation
   */
  updateContext(
    islandId: string,
    updates: Partial<HydraIslandContext>
  ): void {
    const context = this.getContext(islandId);
    if (!context) {
      throw new Error(`Context not found for island: ${islandId}`);
    }
    
    // Update context properties
    Object.assign(context, updates);
    context.lastUpdate = Date.now();
    
    // Update reactive signals
    if (context.signals) {
      for (const [key, value] of Object.entries(updates)) {
        if (context.signals[key]) {
          context.signals[key].value = value;
        }
      }
    }
    
    console.log(`🔄 Updated context for island: ${islandId}`, updates);
  }
  
  /**
   * Create a child context that inherits from parent
   */
  createChildContext(
    childIslandId: string,
    parentIslandId: string,
    additionalContext: Partial<HydraContext> = {},
    options: HydraContextOptions = {}
  ): HydraIslandContext {
    const parentContext = this.getContext(parentIslandId);
    if (!parentContext) {
      throw new Error(`Parent context not found: ${parentIslandId}`);
    }
    
    // Inherit from parent context
    const baseContext: HydraContext = {
      ...parentContext,
      ...additionalContext,
      parentContext: parentIslandId
    };
    
    const childContext = this.createContext(childIslandId, baseContext, options);
    
    // Track hierarchy
    if (!this.contextHierarchy.has(parentIslandId)) {
      this.contextHierarchy.set(parentIslandId, new Set());
    }
    this.contextHierarchy.get(parentIslandId)!.add(childIslandId);
    
    return childContext;
  }
  
  /**
   * Share signals between islands
   */
  shareSignal(
    sourceIslandId: string,
    targetIslandId: string,
    signalKey: string,
    targetKey?: string
  ): void {
    const sourceContext = this.getContext(sourceIslandId);
    const targetContext = this.getContext(targetIslandId);
    
    if (!sourceContext || !targetContext) {
      throw new Error('Source or target context not found');
    }
    
    const sourceSignal = sourceContext.signals?.[signalKey];
    if (!sourceSignal) {
      throw new Error(`Signal '${signalKey}' not found in source context`);
    }
    
    const key = targetKey || signalKey;
    if (!targetContext.signals) {
      targetContext.signals = {};
    }
    
    // Share the signal reference
    targetContext.signals[key] = sourceSignal;
    
    // Register with SignalManager
    const signalId = `${targetIslandId}.${key}`;
    this.signalManager.registerSignal(signalId, sourceSignal);
    
    console.log(`🔗 Shared signal '${signalKey}' from ${sourceIslandId} to ${targetIslandId}`);
  }
  
  /**
   * Create computed signal that depends on multiple context signals
   */
  createComputedSignal<T>(
    islandId: string,
    signalKey: string,
    computation: () => T,
    dependencies: string[] = []
  ): Signal<T> {
    const context = this.getContext(islandId);
    if (!context) {
      throw new Error(`Context not found for island: ${islandId}`);
    }
    
    const computedSig = computed(computation);
    
    if (!context.signals) {
      context.signals = {};
    }
    context.signals[signalKey] = computedSig;
    
    // Register with SignalManager
    const signalId = `${islandId}.${signalKey}`;
    this.signalManager.registerSignal(signalId, computedSig);
    
    return computedSig;
  }
  
  /**
   * Clean up context and all associated signals
   */
  destroyContext(islandId: string): void {
    const context = this.getContext(islandId);
    if (!context) return;
    
    // Clean up signal registrations
    const cleanups = this.cleanupFunctions.get(islandId);
    if (cleanups) {
      cleanups.forEach(cleanup => cleanup());
      this.cleanupFunctions.delete(islandId);
    }
    
    // Clean up child contexts
    const children = this.contextHierarchy.get(islandId);
    if (children) {
      children.forEach(childId => this.destroyContext(childId));
      this.contextHierarchy.delete(islandId);
    }
    
    // Remove from parent hierarchy
    for (const [parentId, childSet] of this.contextHierarchy.entries()) {
      childSet.delete(islandId);
    }
    
    // Remove contexts
    this.contexts.delete(islandId);
    this.sharedContexts.delete(islandId);
    
    console.log(`🧹 Destroyed context for island: ${islandId}`);
  }
  
  /**
   * Get all island IDs with active contexts
   */
  getActiveIslands(): string[] {
    return [
      ...Array.from(this.contexts.keys()),
      ...Array.from(this.sharedContexts.keys())
    ];
  }
  
  /**
   * Get context hierarchy for debugging
   */
  getContextHierarchy(): Record<string, string[]> {
    const hierarchy: Record<string, string[]> = {};
    for (const [parent, children] of this.contextHierarchy.entries()) {
      hierarchy[parent] = Array.from(children);
    }
    return hierarchy;
  }
  
  /**
   * Convert trust level to numeric value
   */
  private getTrustLevelValue(level: string): number {
    switch (level) {
      case 'unverified': return 0;
      case 'local': return 25;
      case 'community': return 50;
      case 'verified': return 100;
      default: return 0;
    }
  }
  
  /**
   * Verify ZK proof (simplified implementation)
   */
  private async verifyZKProof(zkProof: string, peerId: string): Promise<boolean> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simple verification logic for demo
    return zkProof.startsWith('zk:') && zkProof.length > 10;
  }
  
  /**
   * Batch update multiple contexts
   */
  batchUpdateContexts(
    updates: Array<{
      islandId: string;
      updates: Partial<HydraIslandContext>;
    }>
  ): void {
    for (const { islandId, updates: contextUpdates } of updates) {
      try {
        this.updateContext(islandId, contextUpdates);
      } catch (error) {
        console.error(`Failed to update context for ${islandId}:`, error);
      }
    }
  }
  
  /**
   * Create a reactive effect that responds to context changes
   */
  createContextEffect(
    islandId: string,
    effectFn: (context: HydraIslandContext) => void
  ): () => void {
    const context = this.getContext(islandId);
    if (!context) {
      throw new Error(`Context not found for island: ${islandId}`);
    }
    
    // Create effect that runs when any signal changes
    const dispose = effect(() => {
      effectFn(context);
    });
    
    return dispose;
  }
}

// Global instance
let globalHydraContextManager: HydraContextManager | undefined;

/**
 * Get the global HydraContextManager instance
 */
export function getHydraContextManager(): HydraContextManager {
  if (!globalHydraContextManager) {
    globalHydraContextManager = new HydraContextManager();
  }
  return globalHydraContextManager;
}

/**
 * Utility function to create reactive Hydra context
 */
export function createReactiveHydraContext(
  islandId: string,
  baseContext: HydraContext,
  options: HydraContextOptions = {}
): HydraIslandContext {
  const manager = getHydraContextManager();
  return manager.createContext(islandId, baseContext, { reactive: true, ...options });
}

/**
 * Utility function to get context signals for easy access
 */
export function getContextSignals(islandId: string): Record<string, Signal<any>> | undefined {
  const manager = getHydraContextManager();
  const context = manager.getContext(islandId);
  return context?.signals;
}
