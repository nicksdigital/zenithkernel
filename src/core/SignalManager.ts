/**
 * SignalManager - Centralized orchestrator for signals, ECS integration, DOM bindings, and Hydra reactivity
 */

import { Signal, ComputedSignal, AsyncSignal, signal, computed, effect, batch, SignalOptions, AsyncSignalOptions, Computation } from './signals';
import { ECSManager, Entity } from './ECSManager';

export interface SignalManagerOptions {
  ecsManager?: ECSManager;
  batchUpdates?: boolean;
  performanceTracking?: boolean;
  debugMode?: boolean;
  maxBatchSize?: number;
  batchTimeoutMs?: number;
}

export interface DOMBinding {
  id: string;
  element: HTMLElement;
  property: string;
  signal: Signal<any>;
  transform?: (value: any) => string;
  cleanup: () => void;
}

export interface HydraContext {
  id: string;
  signals: Map<string, Signal<any>>;
  computedSignals: Map<string, ComputedSignal<any>>;
  effects: Map<string, Computation>;
  domBindings: Map<string, DOMBinding>;
}

export interface SignalStats {
  totalSignals: number;
  activeSignals: number;
  totalUpdates: number;
  batchedUpdates: number;
  domBindings: number;
  hydraContexts: number;
  memoryUsage: {
    signals: number;
    computedSignals: number;
    effects: number;
    domBindings: number;
  };
}

/**
 * Centralized SignalManager for orchestrating reactive state across the system
 */
export class SignalManager {
  private _options: Required<SignalManagerOptions>;
  private _ecsManager?: ECSManager;
  
  // Global registries
  private _signals = new Map<string, Signal<any>>();
  private _computedSignals = new Map<string, ComputedSignal<any>>();
  private _asyncSignals = new Map<string, AsyncSignal<any>>();
  private _effects = new Map<string, Computation>();
  
  // DOM bindings
  private _domBindings = new Map<string, DOMBinding>();
  private _pendingDOMUpdates = new Set<string>();
  private _domUpdateScheduled = false;
  
  // Hydra integration
  private _hydraContexts = new Map<string, HydraContext>();
  
  // ECS integration
  private _entitySignals = new Map<Entity, Set<string>>();
  private _signalEntities = new Map<string, Entity>();
  
  // Performance tracking
  private _stats = {
    totalSignals: 0,
    activeSignals: 0,
    totalUpdates: 0,
    batchedUpdates: 0,
    domBindings: 0,
    hydraContexts: 0
  };
  
  // Batch processing
  private _updateQueue = new Set<() => void>();
  private _batchTimeout?: number;

  constructor(options: SignalManagerOptions = {}) {
    this._options = {
      ecsManager: options.ecsManager,
      batchUpdates: options.batchUpdates ?? true,
      performanceTracking: options.performanceTracking ?? true,
      debugMode: options.debugMode ?? false,
      maxBatchSize: options.maxBatchSize ?? 100,
      batchTimeoutMs: options.batchTimeoutMs ?? 16 // ~60fps
    };
    
    this._ecsManager = this._options.ecsManager;
    this._setupECSIntegration();
    
    if (this._options.debugMode) {
      this._enableDebugMode();
    }
  }

  // ============= Signal Creation & Management =============

  /**
   * Create a managed signal with automatic registration
   */
  createSignal<T>(
    id: string,
    initialValue: T,
    options: SignalOptions<T> & { entity?: Entity } = {}
  ): Signal<T> {
    if (this._signals.has(id)) {
      throw new Error(`Signal with ID "${id}" already exists`);
    }

    const signalOptions: SignalOptions<T> = {
      ...options,
      name: options.name || id,
      scheduler: options.scheduler || 'raf'
    };

    // ECS integration
    if (options.entity && this._ecsManager) {
      signalOptions.ecsEntity = options.entity;
      signalOptions.ecsManager = this._ecsManager;
      this._registerEntitySignal(options.entity, id);
    }

    const sig = signal(initialValue, signalOptions);
    this._signals.set(id, sig);
    this._stats.totalSignals++;
    this._stats.activeSignals++;

    this._debug(`Created signal: ${id}`, { value: initialValue, entity: options.entity });
    return sig;
  }

  /**
   * Create a managed computed signal
   */
  createComputed<T>(
    id: string,
    computation: () => T,
    options: SignalOptions<T> = {}
  ): ComputedSignal<T> {
    if (this._computedSignals.has(id)) {
      throw new Error(`Computed signal with ID "${id}" already exists`);
    }

    const comp = computed(computation, {
      ...options,
      name: options.name || id
    });

    this._computedSignals.set(id, comp);
    this._debug(`Created computed signal: ${id}`);
    return comp;
  }

  /**
   * Create a managed async signal
   */
  createAsyncSignal<T>(
    id: string,
    loadFn: () => Promise<T>,
    options: AsyncSignalOptions<T> = {}
  ): AsyncSignal<T> {
    if (this._asyncSignals.has(id)) {
      throw new Error(`Async signal with ID "${id}" already exists`);
    }

    const asyncSig = new AsyncSignal(undefined, loadFn, {
      ...options,
      name: options.name || id
    });

    this._asyncSignals.set(id, asyncSig);
    this._debug(`Created async signal: ${id}`);
    return asyncSig;
  }

  /**
   * Create a managed effect
   */
  createEffect(
    id: string,
    fn: () => void | (() => void),
    options: { defer?: boolean } = {}
  ): Computation {
    if (this._effects.has(id)) {
      throw new Error(`Effect with ID "${id}" already exists`);
    }

    const eff = effect(fn, {
      name: id,
      defer: options.defer
    });

    this._effects.set(id, eff);
    this._debug(`Created effect: ${id}`);
    return eff;
  }

  // ============= DOM Binding Management =============

  /**
   * Bind a signal to a DOM element property
   */
  bindToDOM<T>(
    id: string,
    element: HTMLElement,
    property: string,
    signal: Signal<T>,
    transform?: (value: T) => string
  ): void {
    if (this._domBindings.has(id)) {
      throw new Error(`DOM binding with ID "${id}" already exists`);
    }

    const update = () => {
      this._pendingDOMUpdates.add(id);
      this._scheduleDOMUpdate();
    };

    const cleanup = effect(() => {
      signal.value; // Track dependency
      update();
    });

    const binding: DOMBinding = {
      id,
      element,
      property,
      signal,
      transform,
      cleanup: () => cleanup.dispose()
    };

    this._domBindings.set(id, binding);
    this._stats.domBindings++;
    this._debug(`Created DOM binding: ${id} -> ${property}`);

    // Initial update
    update();
  }

  /**
   * Bind signal to element text content
   */
  bindTextContent<T>(
    id: string,
    element: HTMLElement,
    signal: Signal<T>,
    transform?: (value: T) => string
  ): void {
    this.bindToDOM(id, element, 'textContent', signal, transform);
  }

  /**
   * Bind signal to element attribute
   */
  bindAttribute<T>(
    id: string,
    element: HTMLElement,
    attribute: string,
    signal: Signal<T>,
    transform?: (value: T) => string
  ): void {
    const binding: DOMBinding = {
      id,
      element,
      property: attribute,
      signal,
      transform,
      cleanup: () => {}
    };

    const cleanup = effect(() => {
      const value = signal.value;
      const stringValue = transform ? transform(value) : String(value);
      element.setAttribute(attribute, stringValue);
    });

    binding.cleanup = () => cleanup.dispose();
    this._domBindings.set(id, binding);
    this._stats.domBindings++;
  }

  /**
   * Bind signal to element class list
   */
  bindClassList(
    id: string,
    element: HTMLElement,
    signal: Signal<string | string[] | Record<string, boolean>>
  ): void {
    const cleanup = effect(() => {
      const value = signal.value;
      
      if (typeof value === 'string') {
        element.className = value;
      } else if (Array.isArray(value)) {
        element.className = value.filter(Boolean).join(' ');
      } else if (value && typeof value === 'object') {
        const classes: string[] = [];
        for (const [className, condition] of Object.entries(value)) {
          if (condition) classes.push(className);
        }
        element.className = classes.join(' ');
      }
    });

    const binding: DOMBinding = {
      id,
      element,
      property: 'className',
      signal,
      cleanup: () => cleanup.dispose()
    };

    this._domBindings.set(id, binding);
    this._stats.domBindings++;
  }

  // ============= Hydra Integration =============

  /**
   * Create a new Hydra context for component reactivity
   */
  createHydraContext(hydraId: string): HydraContext {
    if (this._hydraContexts.has(hydraId)) {
      throw new Error(`Hydra context "${hydraId}" already exists`);
    }

    const context: HydraContext = {
      id: hydraId,
      signals: new Map(),
      computedSignals: new Map(),
      effects: new Map(),
      domBindings: new Map()
    };

    this._hydraContexts.set(hydraId, context);
    this._stats.hydraContexts++;
    this._debug(`Created Hydra context: ${hydraId}`);
    
    return context;
  }

  /**
   * Add a signal to a Hydra context
   */
  addToHydraContext<T>(
    hydraId: string,
    signalId: string,
    signal: Signal<T>
  ): void {
    const context = this._hydraContexts.get(hydraId);
    if (!context) {
      throw new Error(`Hydra context "${hydraId}" not found`);
    }

    context.signals.set(signalId, signal);
    this._debug(`Added signal ${signalId} to Hydra context ${hydraId}`);
  }

  /**
   * Get all signals from a Hydra context
   */
  getHydraSignals(hydraId: string): Map<string, Signal<any>> {
    const context = this._hydraContexts.get(hydraId);
    return context?.signals || new Map();
  }

  /**
   * Cleanup a Hydra context and all its signals
   */
  cleanupHydraContext(hydraId: string): void {
    const context = this._hydraContexts.get(hydraId);
    if (!context) return;

    // Dispose all signals
    context.signals.forEach(signal => signal.dispose());
    context.computedSignals.forEach(computed => computed.dispose());
    context.effects.forEach(effect => effect.dispose());
    context.domBindings.forEach(binding => binding.cleanup());

    this._hydraContexts.delete(hydraId);
    this._stats.hydraContexts--;
    this._debug(`Cleaned up Hydra context: ${hydraId}`);
  }

  // ============= ECS Integration =============

  private _setupECSIntegration(): void {
    if (!this._ecsManager) return;

    // Listen for ECS entity destruction
    this._ecsManager.on('entityRemoved', (entityId: Entity) => {
      this._cleanupEntitySignals(entityId);
    });
  }

  private _registerEntitySignal(entity: Entity, signalId: string): void {
    if (!this._entitySignals.has(entity)) {
      this._entitySignals.set(entity, new Set());
    }
    this._entitySignals.get(entity)!.add(signalId);
    this._signalEntities.set(signalId, entity);
  }

  private _cleanupEntitySignals(entity: Entity): void {
    const signalIds = this._entitySignals.get(entity);
    if (!signalIds) return;

    for (const signalId of signalIds) {
      const signal = this._signals.get(signalId);
      if (signal) {
        signal.dispose();
        this._signals.delete(signalId);
        this._stats.activeSignals--;
      }
      this._signalEntities.delete(signalId);
    }

    this._entitySignals.delete(entity);
    this._debug(`Cleaned up signals for entity: ${entity}`);
  }

  /**
   * Get all signals associated with an ECS entity
   */
  getEntitySignals(entity: Entity): Signal<any>[] {
    const signalIds = this._entitySignals.get(entity);
    if (!signalIds) return [];

    return Array.from(signalIds)
      .map(id => this._signals.get(id))
      .filter(Boolean) as Signal<any>[];
  }

  // ============= Batch Processing & Performance =============

  private _scheduleDOMUpdate(): void {
    if (this._domUpdateScheduled) return;

    this._domUpdateScheduled = true;
    requestAnimationFrame(() => {
      this._processDOMUpdates();
      this._domUpdateScheduled = false;
    });
  }

  private _processDOMUpdates(): void {
    if (this._pendingDOMUpdates.size === 0) return;

    const updates = Array.from(this._pendingDOMUpdates);
    this._pendingDOMUpdates.clear();

    batch(() => {
      for (const bindingId of updates) {
        const binding = this._domBindings.get(bindingId);
        if (!binding) continue;

        try {
          const value = binding.signal.value;
          const stringValue = binding.transform ? binding.transform(value) : String(value);

          if (binding.property === 'textContent') {
            binding.element.textContent = stringValue;
          } else if (binding.property === 'innerHTML') {
            binding.element.innerHTML = stringValue;
          } else {
            (binding.element as any)[binding.property] = stringValue;
          }
        } catch (error) {
          console.error(`DOM update failed for binding ${bindingId}:`, error);
        }
      }
    });

    this._stats.batchedUpdates++;
    this._debug(`Processed ${updates.length} DOM updates`);
  }

  /**
   * Process update queue with batching
   */
  processBatchedUpdates(): void {
    if (this._updateQueue.size === 0) return;

    const updates = Array.from(this._updateQueue);
    this._updateQueue.clear();

    batch(() => {
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.error('Batched update failed:', error);
        }
      });
    });

    this._stats.batchedUpdates++;
  }

  // ============= Management & Cleanup =============

  /**
   * Get a signal by ID
   */
  getSignal(id: string): Signal<any> | undefined {
    return this._signals.get(id) || this._computedSignals.get(id) || this._asyncSignals.get(id);
  }

  /**
   * Remove and dispose a signal
   */
  removeSignal(id: string): boolean {
    const signal = this._signals.get(id);
    if (signal) {
      signal.dispose();
      this._signals.delete(id);
      this._stats.activeSignals--;
      
      // Remove from entity mapping
      const entity = this._signalEntities.get(id);
      if (entity) {
        this._entitySignals.get(entity)?.delete(id);
        this._signalEntities.delete(id);
      }
      
      this._debug(`Removed signal: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Remove a DOM binding
   */
  removeDOMBinding(id: string): boolean {
    const binding = this._domBindings.get(id);
    if (binding) {
      binding.cleanup();
      this._domBindings.delete(id);
      this._stats.domBindings--;
      this._debug(`Removed DOM binding: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Get performance statistics
   */
  getStats(): SignalStats {
    return {
      ...this._stats,
      memoryUsage: {
        signals: this._signals.size,
        computedSignals: this._computedSignals.size,
        effects: this._effects.size,
        domBindings: this._domBindings.size
      }
    };
  }

  /**
   * Cleanup all managed resources
   */
  dispose(): void {
    // Dispose all signals
    this._signals.forEach(signal => signal.dispose());
    this._computedSignals.forEach(computed => computed.dispose());
    this._asyncSignals.forEach(async => async.dispose());
    this._effects.forEach(effect => effect.dispose());

    // Cleanup DOM bindings
    this._domBindings.forEach(binding => binding.cleanup());

    // Cleanup Hydra contexts
    this._hydraContexts.forEach((_, id) => this.cleanupHydraContext(id));

    // Clear all registries
    this._signals.clear();
    this._computedSignals.clear();
    this._asyncSignals.clear();
    this._effects.clear();
    this._domBindings.clear();
    this._hydraContexts.clear();
    this._entitySignals.clear();
    this._signalEntities.clear();

    // Clear timers
    if (this._batchTimeout) {
      clearTimeout(this._batchTimeout);
    }

    this._debug('SignalManager disposed');
  }

  // ============= Debug & Utilities =============

  private _enableDebugMode(): void {
    (globalThis as any).__zenithSignalManager = this;
    this._debug('Debug mode enabled - SignalManager available at globalThis.__zenithSignalManager');
  }

  private _debug(message: string, data?: any): void {
    if (this._options.debugMode) {
      console.log(`[SignalManager] ${message}`, data || '');
    }
  }

  /**
   * Get all registered signal IDs
   */
  getAllSignalIds(): string[] {
    return [
      ...this._signals.keys(),
      ...this._computedSignals.keys(),
      ...this._asyncSignals.keys()
    ];
  }

  /**
   * Get debug information
   */
  getDebugInfo(): any {
    return {
      stats: this.getStats(),
      signals: Array.from(this._signals.keys()),
      computedSignals: Array.from(this._computedSignals.keys()),
      asyncSignals: Array.from(this._asyncSignals.keys()),
      domBindings: Array.from(this._domBindings.keys()),
      hydraContexts: Array.from(this._hydraContexts.keys()),
      entitySignals: Object.fromEntries(this._entitySignals),
      pendingDOMUpdates: Array.from(this._pendingDOMUpdates)
    };
  }
}

// Singleton instance for global access
let globalSignalManager: SignalManager | null = null;

/**
 * Get or create the global SignalManager instance
 */
export function getSignalManager(options?: SignalManagerOptions): SignalManager {
  if (!globalSignalManager) {
    globalSignalManager = new SignalManager(options);
  }
  return globalSignalManager;
}

/**
 * Set a custom SignalManager instance as global
 */
export function setSignalManager(manager: SignalManager): void {
  globalSignalManager = manager;
}

/**
 * Reset the global SignalManager instance
 */
export function resetSignalManager(): void {
  if (globalSignalManager) {
    globalSignalManager.dispose();
    globalSignalManager = null;
  }
}

export type { SignalManagerOptions, DOMBinding, HydraContext, SignalStats };
