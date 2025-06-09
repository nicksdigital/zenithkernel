/**
 * Signals-based Reactivity System for Zenith Framework
 * * Provides fine-grained reactivity using signals that integrate with the ECS system
 * for direct DOM updates without VDOM reconciliation overhead.
 */

import { ECSManager } from './ECSManager';

// Global tracking state
let currentComputation: Computation | null = null;
let currentBatch: Set<Signal<any>> | null = null;
let batchDepth = 0;
let scheduledUpdate: number | null = null; // Can be number for RAF, or a truthy sentinel for microtask

// Signal ID counter for unique identification
let signalIdCounter = 0;

// Debug mode for development
let debugMode = false;
const debugLog = (message: string, ...args: any[]) => {
  if (debugMode) console.log(`[Signals] ${message}`, ...args);
};

// Type utilities for better TypeScript support
export type MaybeSignal<T> = T | Signal<T>;
export type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;
export type SignalValue<T> = T extends Signal<infer U> ? U : never;
export type Signalize<T> = { [K in keyof T]: Signal<T[K]> };

// Enhanced error handling
export class SignalError extends Error {
  constructor(message: string, public readonly signalId?: number, public readonly signalName?: string) {
    super(message);
    this.name = 'SignalError';
  }
}

// --- ECS Integration Specifics ---
/**
 * Data structure for storing signal information as an ECS component.
 */
export interface SignalComponentData<T = any> {
  signalId: number;
  value: T;
  type: 'signal'; 
  name?: string;
  created: number;
  lastUpdated?: number;
  updateCount?: number;
}

/**
 * Placeholder class to act as the ComponentType for ECS interactions.
 */
export class SignalECSComponent {
    constructor(public data: SignalComponentData<any>) {}
}
// --- End ECS Integration Specifics ---


const scheduleRafUpdate = () => {
  if (scheduledUpdate === null) {
    scheduledUpdate = requestAnimationFrame(() => {
      scheduledUpdate = null;
      flushUpdates();
    });
  }
};

const scheduleMicrotaskUpdate = () => {
    if (scheduledUpdate === null) { 
        scheduledUpdate = 1; 
        Promise.resolve().then(() => {
            if (scheduledUpdate === 1) { 
                scheduledUpdate = null;
                flushUpdates();
            }
        });
    }
};


const flushUpdates = () => {
  if (!currentBatch) return;

  const uniqueComputationsToRun = new Set<Computation>();
  const batchToProcess = Array.from(currentBatch);
  currentBatch = null; 


  for (const signal of batchToProcess) {
    for (const comp of (signal as any)._subscribers as Set<Computation>) {
      if (!comp.isDisposed) { 
        uniqueComputationsToRun.add(comp);
      }
    }
  }
  
  debugLog(`Flushing updates for ${uniqueComputationsToRun.size} computations from ${batchToProcess.length} signals.`);

  for (const comp of uniqueComputationsToRun) {
    if (!comp.isDisposed) { 
        comp.execute(); 
    }
  }
};

export interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;
  name?: string;
  ecsEntity?: number;
  ecsManager?: ECSManager;
  debug?: boolean;
  scheduler?: 'sync' | 'async' | 'raf'; 
  errorHandler?: (error: Error, signal: Signal<T>) => void;
}

export interface AsyncSignalOptions<T> extends Omit<SignalOptions<T | undefined>, 'equals'> {
  equals?: (a: T | undefined, b: T | undefined) => boolean; 
  initialState?: 'loading' | 'idle'; 
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface ComputedOptions<T> extends SignalOptions<T> {
  defer?: boolean; 
}

export interface EffectOptions {
  name?: string;
  defer?: boolean; 
  errorHandler?: (error: Error) => void; 
}

export class Signal<T> {
  protected _value: T; 
  private _id: number;
  private _name?: string;
  protected _equals: (a: T, b: T) => boolean; 
  protected _subscribers = new Set<Computation>();
  private _ecsEntity?: number;
  private _ecsManager?: ECSManager;
  private _debug: boolean;
  protected _scheduler: 'sync' | 'async' | 'raf'; // Changed to protected
  protected _errorHandler?: (error: Error, signal: Signal<T>) => void; 
  protected _disposed = false; // Changed to protected
  private _accessCount = 0;
  private _updateCount = 0;
  private _lastAccess?: number;
  private _lastUpdate?: number;
  private _createdAt: number;

  constructor(initialValue: T, options: SignalOptions<T> = {}) {
    this._value = initialValue;
    this._id = ++signalIdCounter;
    this._name = options.name;
    this._equals = options.equals || Object.is;
    this._ecsEntity = options.ecsEntity;
    this._ecsManager = options.ecsManager; 
    this._debug = options.debug || debugMode;
    this._scheduler = options.scheduler || 'sync'; 
    this._errorHandler = options.errorHandler;
    this._createdAt = Date.now();

    debugLog(`Created signal ${this._id}`, { name: this._name, value: initialValue, scheduler: this._scheduler });

    if (typeof this._ecsEntity === 'number' && this._ecsManager && typeof this._ecsManager.addComponent === 'function') {
      try {
        const componentData: SignalComponentData<T> = {
          signalId: this._id,
          value: initialValue,
          type: 'signal',
          name: this._name || `signal_${this._id}`, 
          created: this._createdAt
        };
        const signalComponentInstance = new SignalECSComponent(componentData);
        this._ecsManager.addComponent(this._ecsEntity, SignalECSComponent, signalComponentInstance);
        debugLog(`Signal ${this.id} registered with ECS entity ${this._ecsEntity}`);
      } catch (error: any) {
        this._handleError(new SignalError(`Failed to register with ECS: ${error.message}`, this._id, this._name));
      }
    }
  }

  get value(): T {
    if (this._disposed) {
      throw new SignalError(`Cannot access disposed signal ${this._name || this._id}`, this._id, this._name);
    }

    this._accessCount++;
    this._lastAccess = Date.now();

    if (currentComputation && !currentComputation.isDisposed) {
      this._subscribers.add(currentComputation);
      currentComputation.dependencies.add(this);
      debugLog(`Tracked dependency: signal ${this._id} (${this._name}) -> computation ${currentComputation.name || 'anonymous'}`);
    }
    
    return this._value;
  }

  set value(newValue: T) {
    if (this._disposed) {
      throw new SignalError(`Cannot update disposed signal ${this._name || this._id}`, this._id, this._name);
    }

    if (!this._equals(this._value, newValue)) {
      const oldValue = this._value;
      this._value = newValue;
      this._updateCount++;
      this._lastUpdate = Date.now();
      
      debugLog(`Signal ${this._id} (${this._name}) updated`, { oldValue, newValue, subscribers: this._subscribers.size });
      
      this._notifySubscribers(); 
      
      if (typeof this._ecsEntity === 'number' && this._ecsManager && typeof this._ecsManager.addComponent === 'function') { 
        try {
          const componentData: SignalComponentData<T> = { 
            signalId: this._id,
            value: newValue,
            lastUpdated: this._lastUpdate,
            updateCount: this._updateCount,
            type: 'signal',
            name: this._name || `signal_${this._id}`,
            created: this._createdAt 
          };
          const signalComponentInstance = new SignalECSComponent(componentData);
          this._ecsManager.addComponent(this._ecsEntity, SignalECSComponent, signalComponentInstance);
           debugLog(`Signal ${this.id} updated ECS entity ${this._ecsEntity}`);
        } catch (error: any) {
          this._handleError(new SignalError(`Failed to update ECS: ${error.message}`, this._id, this._name));
        }
      }
    }
  }

  protected _notifySubscribers(): void { 
    if (this._scheduler === 'sync' && batchDepth === 0) {
      this._flushNotifications();
      return;
    }

    if (!currentBatch) {
      currentBatch = new Set();
    }
    currentBatch.add(this);
    
    if (batchDepth === 0) { 
        if (this._scheduler === 'raf') {
            scheduleRafUpdate(); 
        } else { // 'async' or implicit async due to batching
            scheduleMicrotaskUpdate(); 
        }
    }
  }

  protected _flushNotifications(): void {
    if(this._subscribers.size === 0) return;
    debugLog(`Flushing notifications for signal ${this.id} (${this.name}) to ${this._subscribers.size} subscribers`);
    const subscribers = Array.from(this._subscribers); 
    for (const computation of subscribers) {
      if (!computation.isDisposed) { 
          try {
            computation.execute();
          } catch (error: any) {
            this._handleError(new SignalError(`Computation error during flush for signal ${this.id}: ${error.message}`, this._id, this._name));
          }
      }
    }
  }

  peek(): T {
    return this._value;
  }

  get id(): number { return this._id; }
  get name(): string | undefined { return this._name; }
  get subscriberCount(): number { return this._subscribers.size; }
  get isDisposed(): boolean { return this._disposed; }
  get accessCount(): number { return this._accessCount; }
  get updateCount(): number { return this._updateCount; }
  get lastAccess(): number | undefined { return this._lastAccess; }
  get lastUpdate(): number | undefined { return this._lastUpdate; }

  dispose(): void {
    if (this._disposed) return;
    
    debugLog(`Disposing signal ${this._id}`, { name: this._name, subscribers: this._subscribers.size });
    
    this._disposed = true;
    const subscribersToNotify = Array.from(this._subscribers);
    this._subscribers.clear(); 
    for (const comp of subscribersToNotify) {
        comp.dependencies.delete(this); 
    }
    
    if (typeof this._ecsEntity === 'number' && this._ecsManager && typeof this._ecsManager.removeComponent === 'function') {
      try {
        this._ecsManager.removeComponent(this._ecsEntity, SignalECSComponent); 
         debugLog(`Signal ${this.id} removed from ECS entity ${this._ecsEntity}`);
      } catch (error: any) {
        this._handleError(new SignalError(`Failed to cleanup ECS: ${error.message}`, this._id, this._name));
      }
    }
  }

  private _handleError(error: SignalError): void {
    if (this._errorHandler) {
      this._errorHandler(error, this);
    } else {
      console.error(error.message, error.signalId ? `(Signal ID: ${error.signalId})` : '', error.signalName ? `(Name: ${error.signalName})` : '');
    }
  }

  map<U>(mapper: (value: T) => U, options?: Omit<ComputedOptions<U>, 'defer' | 'name' | 'debug' | 'scheduler' | 'errorHandler'>): ComputedSignal<U> {
    return new ComputedSignal(() => mapper(this.value), {
      name: this._name ? `${this._name}.map` : undefined,
      debug: this._debug,
      scheduler: this._scheduler, 
      errorHandler: this._errorHandler ? (err: Error, sig: Signal<U>) => this._errorHandler!(err, this as any) : undefined, 
      ...options, 
    });
  }

  filter(predicate: (value: T) => boolean, options?: Omit<ComputedOptions<T|undefined>, 'defer' | 'name' | 'debug' | 'scheduler' | 'errorHandler'>): ComputedSignal<T | undefined> {
    return new ComputedSignal(() => predicate(this.value) ? this.value : undefined, {
      name: this._name ? `${this._name}.filter` : undefined,
      debug: this._debug,
      scheduler: this._scheduler, 
      errorHandler: this._errorHandler ? (err: Error, sig: Signal<T|undefined>) => this._errorHandler!(err, this as any) : undefined, 
      ...options,
    });
  }
}

export class Computation {
  public dependencies = new Set<Signal<any>>();
  private _fn: () => void | (() => void); 
  private _cleanup?: () => void;
  private _name?: string;
  private _disposed = false;
  private _executing = false;
  private _executionCount = 0;
  private _lastExecution?: number;
  private _errorHandler?: (error: Error) => void; 
  public _isEffect = true; 

  constructor(fn: () => void | (() => void), options: EffectOptions = {}, isEffect:boolean = true) {
    this._fn = fn;
    this._name = options.name;
    this._errorHandler = options.errorHandler; 
    this._isEffect = isEffect;
    
    debugLog(`Created computation ${this._name || 'anonymous'}`, {isEffect});
    
    if (!options.defer) {
      this.execute();
    }
  }

  execute(): void {
    if (this._disposed) {
        debugLog(`Attempted to execute disposed computation ${this._name || 'anonymous'}`);
        return;
    }
    // For effects, prevent re-entrant execution to avoid common infinite loops.
    // For pure computed signals (isEffect=false), allow re-entrancy if needed by complex synchronous graphs.
    if (this._executing && this._isEffect) { 
        debugLog(`Computation ${this._name || 'anonymous'} (effect) already executing, skipping re-entrant call.`);
        return;
    }

    this._executing = true;
    this._executionCount++;
    this._lastExecution = Date.now();

    debugLog(`Executing computation ${this._name || 'anonymous'}`, { count: this._executionCount });

    // Before re-running, remove this computation from its old dependencies' subscriber lists
    for (const signal of this.dependencies) {
      (signal as any)._subscribers.delete(this);
    }
    this.dependencies.clear(); // Clear its own dependency list for the new run

    if (this._cleanup) {
      try {
        this._cleanup();
      } catch (error: any) {
        this._handleError(error);
      }
      this._cleanup = undefined;
    }

    const prevComputation = currentComputation;
    currentComputation = this;
    
    try {
      const result = this._fn(); // Running the function will re-populate this.dependencies
      if (typeof result === 'function') {
        this._cleanup = result;
      }
    } catch (error: any) {
      this._handleError(error);
    } finally {
      currentComputation = prevComputation;
      this._executing = false;
    }
  }

  dispose(): void {
    if (this._disposed) return;
    
    this._disposed = true;
    debugLog(`Disposing computation ${this._name || 'anonymous'}`);
    
    for (const signal of this.dependencies) {
      (signal as any)._subscribers.delete(this);
    }
    this.dependencies.clear();
    
    if (this._cleanup) {
      try {
        this._cleanup();
      } catch(e:any) { this._handleError(e); }
      this._cleanup = undefined;
    }
  }

  get name(): string | undefined { return this._name; }
  get isDisposed(): boolean { return this._disposed; }
  get isExecuting(): boolean { return this._executing; }
  get executionCount(): number { return this._executionCount; }
  get lastExecution(): number | undefined { return this._lastExecution; }
  get dependencyCount(): number { return this.dependencies.size; }

  private _handleError(error: Error): void {
    if (this._errorHandler) {
      this._errorHandler(error);
    } else {
      console.error(`Computation error in ${this._name || 'anonymous'}:`, error);
    }
  }
}

export class AsyncSignal<T> extends Signal<T | undefined> {
  private _loadingSignal: Signal<boolean>; 
  private _errorSignal: Signal<Error | null>; 
  private _timeout?: number;
  private _retryCount: number;
  private _retryDelay: number;
  private _currentRetry = 0;
  private _loadFn: () => Promise<T>;
  private _currentLoadPromise: Promise<void> | null = null;


  constructor(
    initialValue: T | undefined,
    loadFn: () => Promise<T>,
    options: AsyncSignalOptions<T> = {}
  ) {
    const baseOptions: SignalOptions<T | undefined> = {
        name: options.name,
        ecsEntity: options.ecsEntity,
        ecsManager: options.ecsManager,
        debug: options.debug,
        scheduler: options.scheduler || 'sync', 
        errorHandler: options.errorHandler,
        equals: options.equals 
    };
    super(initialValue, baseOptions);

    this._loadFn = loadFn;
    this._timeout = options.timeout;
    this._retryCount = options.retryCount || 0;
    this._retryDelay = options.retryDelay || 1000;

    const isLoadingInitially = options.initialState === 'loading';
    this._loadingSignal = signal(isLoadingInitially, { name: options.name ? `${options.name}.$loading` : undefined, scheduler: 'sync' });
    this._errorSignal = signal<Error | null>(null, { name: options.name ? `${options.name}.$error` : undefined, scheduler: 'sync' });

    if (isLoadingInitially) {
      // If reload() returns a promise, we might want to handle it, but constructor can't be async.
      // The reload call here will kick off the process.
      this.reload().catch(err => {
        // If reload itself throws (unlikely with current structure, but good practice)
        // or if _attemptLoad throws and isn't caught internally before this point.
        // This usually means an issue in _attemptLoad's immediate execution path.
        debugLog(`AsyncSignal ${this.id} (${this.name}) initial reload() call resulted in error: `, err);
        if(this._errorSignal.peek() === null) { // If _attemptLoad didn't set an error
            this._errorSignal.value = err instanceof Error ? err : new SignalError(String(err), this.id, this.name);
        }
        if(this._loadingSignal.peek()) {
            this._loadingSignal.value = false;
        }
      });
    }
  }

  get loading(): boolean {
    return this._loadingSignal.value;
  }

  get error(): Error | null {
    return this._errorSignal.value;
  }

  get isSuccess(): boolean {
    // Check peek() to avoid triggering a read dependency on this computed property itself.
    return !this._loadingSignal.peek() && !this._errorSignal.peek() && this.peek() !== undefined;
  }

  async reload(): Promise<void> {
    if (this._loadingSignal.peek() && this._currentLoadPromise) { 
        debugLog(`AsyncSignal ${this.id} (${this.name}) reload called while already loading.`);
        return this._currentLoadPromise; 
    }
    
    this._loadingSignal.value = true; 
    this._errorSignal.value = null; 
    this._currentRetry = 0;
    this._currentLoadPromise = this._attemptLoad();
    return this._currentLoadPromise;
  }

  private async _attemptLoad(): Promise<void> {
    let result: T | undefined = undefined;
    let caughtError: Error | null = null;

    debugLog(`AsyncSignal ${this.id} (${this.name}) attempting load (attempt ${this._currentRetry + 1}).`);

    try {
      let loadPromise = this._loadFn();
      
      if (this._timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new SignalError(`Timeout after ${this._timeout}ms`, this.id, this.name)), this._timeout);
        });
        loadPromise = Promise.race([loadPromise, timeoutPromise]);
      }
      result = await loadPromise;
    } catch (error: any) {
      caughtError = error instanceof Error ? error : new SignalError(String(error), this.id, this.name);
    }

    // This function updates the signal's state. It should be robust.
    const updateSignalStates = () => {
        if (this.isDisposed) {
            debugLog(`AsyncSignal ${this.id} (${this.name}) disposed during load/retry. Aborting state update.`);
            return;
        }

        if(caughtError) {
            if (this._currentRetry < this._retryCount) {
                this._currentRetry++;
                debugLog(`AsyncSignal ${this.id} (${this.name}) retrying load... (${this._currentRetry}/${this._retryCount})`, { error: caughtError });
                // Keep loading=true, error=null for the retry attempt.
                // No change to this.value yet.
                this._loadingSignal.value = true; // Ensure loading is true for retry
                this._errorSignal.value = null;   // Clear previous attempt's specific error
                
                setTimeout(() => {
                    if(!this.isDisposed) this._attemptLoad();
                }, this._retryDelay * Math.pow(2, this._currentRetry - 1)); 
                // We are still effectively loading because a retry is scheduled.
                // So, _loadingSignal should remain true.
            } else { 
                debugLog(`AsyncSignal ${this.id} (${this.name}) load failed after all retries.`, { error: caughtError });
                this._errorSignal.value = caughtError;
                this._loadingSignal.value = false; // Loading finished (failed)
            }
        } else { // Success
            debugLog(`AsyncSignal ${this.id} (${this.name}) loaded successfully.`, { value: result });
            this.value = result; // This will set _value and notify subscribers
            this._errorSignal.value = null;
            this._loadingSignal.value = false; // Loading finished (success)
        }
    };

    // Apply state updates. If scheduler is sync and not in a batch, updates happen immediately.
    // Otherwise, they are batched.
    if (this._scheduler === 'sync' && batchDepth === 0) {
        updateSignalStates();
    } else {
        batch(updateSignalStates); 
    }

    // Clear the current load promise only if the load attempt is truly finished 
    // (i.e., success, or all retries exhausted and it failed).
    if (!caughtError || this._currentRetry >= this._retryCount) {
        this._currentLoadPromise = null; 
    }
  }

  dispose(): void {
    // TODO: Consider cancelling any ongoing _currentLoadPromise if possible (e.g. AbortController)
    this._loadingSignal.dispose();
    this._errorSignal.dispose();
    super.dispose();
  }
}

export class ComputedSignal<T> extends Signal<T> {
  private _computation: Computation;
  private readonly _fn: () => T; 

  constructor(fn: () => T, options: ComputedOptions<T> = {}) {
    const { defer, errorHandler, ...baseSignalOptions } = options;
    super(undefined as T, baseSignalOptions); 
    this._fn = fn; 

    let adaptedComputationErrorHandler: ((error: Error) => void) | undefined = undefined;
    if (errorHandler) { 
        adaptedComputationErrorHandler = (err: Error) => errorHandler(err, this);
    } else if (this._errorHandler) { 
        adaptedComputationErrorHandler = (err: Error) => this._errorHandler!(err, this);
    }


    this._computation = new Computation(() => {
        const newValue = this._fn(); 
        // Update if value changed OR if it's the first successful computation and _value is placeholder
        // The this._computation.executionCount === 1 check helps ensure the initial value is set correctly,
        // especially if the computed value might be undefined but valid.
        if ((this._computation.executionCount === 1 && this._value === undefined && newValue !== undefined) || 
            !this._equals(this._value, newValue)) {
            this._value = newValue; 
            this._notifySubscribers(); 
        }
    }, { 
        defer: true, // Internal computation always starts deferred from its own perspective.
                     // The ComputedSignal's `defer` option controls if we execute it immediately after setup.
        name: options.name || (this._fn && this._fn.name ? `computed(${this._fn.name})` : 'computed'),
        errorHandler: adaptedComputationErrorHandler 
    }, false); // isEffect = false for pure computed

    if (!defer) { // If ComputedSignal itself is not deferred by user option
        this._computation.execute();
    }
  }

  get value(): T {
    if (this._disposed) { 
      throw new SignalError(`Cannot access disposed computed signal ${this.name || this.id}`);
    }
    // If the computation has never run (its executionCount is 0, implies it was deferred or initial execute didn't set a value)
    // and it's not disposed, execute it now. This handles deferred computations on first access.
    // A computed value is also re-evaluated if its dependencies change, which is handled by the effect system
    // making this._computation.execute() be called by a dependency.
    if (this._computation.executionCount === 0 && !this._computation.isDisposed) {
        debugLog(`Computed signal ${this.id} (${this.name}) accessed, running initial/deferred computation.`);
        this._computation.execute();
    }
    return super.value; 
  }

  set value(_: T) {
    throw new SignalError('Cannot set value of computed signal', this.id, this.name);
  }

  dispose(): void {
    this._computation.dispose();
    super.dispose();
  }
}

export function signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T> {
  return new Signal(initialValue, options);
}

export function computed<T>(fn: () => T, options?: ComputedOptions<T>): ComputedSignal<T> {
  return new ComputedSignal(fn, options);
}

export function asyncSignal<T>(
  loadFn: () => Promise<T>,
  options?: AsyncSignalOptions<T>
): AsyncSignal<T> {
  return new AsyncSignal(undefined, loadFn, {initialState: 'idle', ...options}); 
}

export function asyncSignalWithInitial<T>(
  initialValue: T,
  loadFn: () => Promise<T>,
  options?: AsyncSignalOptions<T>
): AsyncSignal<T> {
  return new AsyncSignal(initialValue, loadFn, {initialState: 'idle', ...options});
}

export function effect(fn: () => void | (() => void), options?: EffectOptions): Computation {
  return new Computation(fn, options, true); 
}

export function resource<T>(
  loadFn: () => Promise<T>,
  options?: AsyncSignalOptions<T>
): [Signal<T | undefined>, { readonly loading: Signal<boolean>; readonly error: Signal<Error | null>; reload: () => Promise<void> }] {
  const asyncSig = new AsyncSignal<T>(undefined, loadFn, { ...options, initialState: 'loading' });
  
  const valueSignal = computed<T | undefined>(() => asyncSig.value, { name: options?.name ? `${options.name}.$value` : undefined, scheduler: options?.scheduler || 'sync' });
  const loadingSignal = computed(() => asyncSig.loading, { name: options?.name ? `${options.name}.$loadingState` : undefined, scheduler: 'sync' });
  const errorSignal = computed<Error | null>(() => asyncSig.error, { name: options?.name ? `${options.name}.$errorState` : undefined, scheduler: 'sync' });

  return [
    valueSignal,
    {
      loading: loadingSignal,
      error: errorSignal,
      reload: () => asyncSig.reload()
    }
  ];
}

export function batch<T>(fn: () => T): T {
  if (batchDepth > 0) { 
    debugLog("Nested batch call");
    return fn();
  }

  batchDepth++;
  debugLog(`Batch started (depth: ${batchDepth})`);
  const isOuterMostBatch = currentBatch === null;
  if (isOuterMostBatch) {
      currentBatch = new Set();
  }
  
  let result: T;
  try {
    result = fn();
    if (batchDepth === 1) { 
        debugLog(`Top-level batch finished, flushing updates...`);
        flushUpdates(); 
    }
  } finally {
    batchDepth--;
    debugLog(`Batch ended (depth: ${batchDepth})`);
    if (batchDepth === 0) {
      if (isOuterMostBatch && currentBatch !== null) { 
          currentBatch = null; 
          debugLog("Global batch context explicitly cleared post-outermost batch.");
      }
    }
  }
  return result;
}

export function untrack<T>(fn: () => T): T {
  const prevComputation = currentComputation;
  currentComputation = null;
  try {
    return fn();
  } finally {
    currentComputation = prevComputation;
  }
}

export function ecsSignal<T>(
  initialValue: T, 
  ecsEntity: number, 
  ecsManager: ECSManager,
  options?: Omit<SignalOptions<T>, 'ecsEntity' | 'ecsManager'>
): Signal<T> {
  return new Signal(initialValue, {
    ...options,
    ecsEntity,
    ecsManager
  });
}

export function signalObject<T extends Record<string, any>>(
  obj: T,
  options?: SignalOptions<any>
): { [K in keyof T]: Signal<T[K]> } {
  const result = {} as { [K in keyof T]: Signal<T[K]> };
  
  for (const [key, value] of Object.entries(obj)) {
    result[key as keyof T] = signal(value, {
      ...options,
      name: options?.name ? `${options.name}.${key}` : key
    });
  }
  
  return result;
}

export function createStore<T extends Record<string, any>>(
  initialState: T,
  options?: SignalOptions<any>
): T & { [K in keyof T as `$${string & K}`]: Signal<T[K]> } {
  const signals = signalObject(initialState, options);
  const store = {} as any;
  
  for (const [key, signalInstance] of Object.entries(signals)) {
    Object.defineProperty(store, key, {
      get: () => signalInstance.value,
      set: (value) => { signalInstance.value = value; },
      enumerable: true,
      configurable: true 
    });
    store[`$${key}`] = signalInstance;
  }
  return store;
}

export function getCurrentComputation(): Computation | null {
  return currentComputation;
}

export function isInBatch(): boolean {
  return batchDepth > 0; 
}

export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
  debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
}

export function getSignalRegistry(): Map<number, Signal<any>> {
  console.warn("getSignalRegistry: Global signal registry not implemented in this version.");
  return new Map();
}

export function resolve<T>(value: MaybeSignal<T>): T {
  return value instanceof Signal ? value.value : value;
}

export function isSignal<T>(value: any): value is Signal<T> {
  return value instanceof Signal;
}

export function derived<T, U>(
  source: Signal<T>,
  mapper: (value: T) => U,
  options?: ComputedOptions<U> 
): ComputedSignal<U> { 
  return computed(() => mapper(source.value), {
      ...options,
      name: options?.name || (source.name ? `${source.name}.derived` : undefined)
  });
}

export function derivedWithSetter<T, U>(
  source: Signal<T>,
  getter: (value: T) => U,
  setter: (newValue: U, oldSourceValue: T) => T,
  options?: SignalOptions<U> 
): Signal<U> {
  const derivedSignal = signal(getter(source.peek()), options);
  let internalUpdate = false; 
  
  effect(() => { 
    if (internalUpdate) return;
    const newDerivedValue = getter(source.value);
    internalUpdate = true;
    derivedSignal.value = newDerivedValue; 
    internalUpdate = false;
  });
  
  effect(() => { 
    if (internalUpdate) return;
    const newSourceValue = setter(derivedSignal.value, source.peek());
    internalUpdate = true;
    source.value = newSourceValue; 
    internalUpdate = false;
  });
  
  return derivedSignal;
}

export function combine<T extends readonly unknown[]>(
  signals: { [K in keyof T]: Signal<T[K]> },
  options?: ComputedOptions<[...{ [K in keyof T]: UnwrapSignal<typeof signals[K]> }]> 
): ComputedSignal<[...{ [K in keyof T]: UnwrapSignal<typeof signals[K]> }]> { 
    type ResultTuple = [...{ [K in keyof T]: UnwrapSignal<typeof signals[K]> }];
    return computed(() => signals.map(s => s.value) as ResultTuple, options);
}

export function fromPromise<T>(
  promise: Promise<T>,
  options?: AsyncSignalOptions<T>
): AsyncSignal<T> {
  const asyncOptions: AsyncSignalOptions<T> = {
    initialState: 'loading', 
    scheduler: 'sync', // Default to sync for fromPromise to make initial loading state more predictable
    ...options,
  };
  return new AsyncSignal(undefined, () => promise, asyncOptions);
}

export function fromEvent<E, T = E>( 
  emitter: { 
      addEventListener(event: string, handler: (data: E) => void): void;
      removeEventListener?(event: string, handler: (data: E) => void): void; 
  },
  event: string,
  initialValue: T,
  mapper?: (eventData: E) => T, 
  options?: SignalOptions<T>
): Signal<T> {
  const sig = signal(initialValue, options);
  const handler = (data: E) => {
    sig.value = mapper ? mapper(data) : data as unknown as T;
  };
  
  emitter.addEventListener(event, handler);
  // TODO: Implement listener removal on signal disposal.
  
  return sig;
}
