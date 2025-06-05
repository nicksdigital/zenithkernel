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
let scheduledUpdate: number | null = null;

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
  type: 'signal'; // To identify the component type if queried generically
  name?: string;
  created: number;
  lastUpdated?: number;
  updateCount?: number;
}

/**
 * Placeholder class to act as the ComponentType for ECS interactions.
 * The actual data is defined by SignalComponentData.
 * Your ECSManager.addComponent would typically store an instance of this
 * or use this class as a key to a data store.
 */
export class SignalECSComponent {
    // This class might hold the data directly, or ECSManager might handle it.
    // For now, its existence is primarily for type compatibility with addComponent.
    constructor(public data: SignalComponentData<any>) {}
}
// --- End ECS Integration Specifics ---


// Scheduler integration for batched updates
const scheduleUpdate = () => {
  if (scheduledUpdate === null) {
    scheduledUpdate = requestAnimationFrame(() => {
      scheduledUpdate = null;
      flushUpdates();
    });
  }
};

// Modified flushUpdates to run unique computations once per batch
const flushUpdates = () => {
  if (!currentBatch) return;

  const uniqueComputationsToRun = new Set<Computation>();
  for (const signal of currentBatch) {
    // Accessing protected _subscribers. This is a common pattern in signal libraries
    // for the batching mechanism to interact with signal internals.
    for (const comp of (signal as any)._subscribers as Set<Computation>) {
      uniqueComputationsToRun.add(comp);
    }
  }
  
  const batchToFlush = currentBatch; // Store current batch before clearing
  currentBatch = null; // Clear batch before running computations to allow nested batches/effects to queue new updates

  debugLog(`Flushing updates for ${uniqueComputationsToRun.size} computations from ${batchToFlush.size} signals.`);

  for (const comp of uniqueComputationsToRun) {
    comp.execute(); // Execute each unique computation once
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
  private _scheduler: 'sync' | 'async' | 'raf';
  private _errorHandler?: (error: Error, signal: Signal<T>) => void;
  private _disposed = false;
  private _accessCount = 0;
  private _updateCount = 0;
  private _lastAccess?: number;
  private _lastUpdate?: number;

  constructor(initialValue: T, options: SignalOptions<T> = {}) {
    this._value = initialValue;
    this._id = ++signalIdCounter;
    this._name = options.name;
    this._equals = options.equals || Object.is;
    this._ecsEntity = options.ecsEntity;
    this._ecsManager = options.ecsManager; 
    this._debug = options.debug || debugMode;
    this._scheduler = options.scheduler || 'raf';
    this._errorHandler = options.errorHandler;

    debugLog(`Created signal ${this._id}`, { name: this._name, value: initialValue });

    if (typeof this._ecsEntity === 'number' && this._ecsManager && typeof this._ecsManager.addComponent === 'function') {
      try {
        const componentData: SignalComponentData<T> = {
          signalId: this._id,
          value: initialValue,
          type: 'signal',
          name: this._name || `signal_${this._id}`, 
          created: Date.now()
        };
        // Pass an instance of SignalECSComponent
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

    if (currentComputation) {
      this._subscribers.add(currentComputation);
      currentComputation.dependencies.add(this);
      debugLog(`Tracked dependency: signal ${this._id} -> computation ${currentComputation.name || 'anonymous'}`);
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
      
      debugLog(`Signal ${this._id} updated`, { oldValue, newValue, subscribers: this._subscribers.size });
      
      this._notifySubscribers(); 
      
      if (typeof this._ecsEntity === 'number' && this._ecsManager && typeof this._ecsManager.addComponent === 'function') { // Or updateComponent
        try {
          const componentData: SignalComponentData<T> = { 
            signalId: this._id,
            value: newValue,
            lastUpdated: Date.now(),
            updateCount: this._updateCount,
            type: 'signal',
            name: this._name || `signal_${this._id}`,
            created: 0 // This would typically not be updated, or be part of a separate component state
          };
          // Pass an instance of SignalECSComponent
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
    if (this._scheduler === 'sync' && !currentBatch) { // Execute synchronously if 'sync' and not in a batch
      this._flushNotifications();
      return;
    }

    // For 'raf', 'async', or if already in a batch
    if (!currentBatch) {
      currentBatch = new Set();
    }
    currentBatch.add(this);
    
    if (batchDepth === 0) { // Only schedule if not in a nested batch that will be flushed by an outer one
        if (this._scheduler === 'raf') {
            scheduleUpdate(); // Uses requestAnimationFrame
        } else { // 'async' or implicit async due to batching
            Promise.resolve().then(flushUpdates); // Microtask
        }
    }
  }

  protected _flushNotifications(): void {
    const subscribers = Array.from(this._subscribers);
    for (const computation of subscribers) {
      if (!computation.isDisposed) { // Check if computation itself is disposed
          try {
            computation.execute();
          } catch (error: any) {
            this._handleError(new SignalError(`Computation error during flush: ${error.message}`, this._id, this._name));
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
      console.error(error.message, error.signalId ? `(Signal ID: ${error.signalId})` : '');
    }
  }

  map<U>(mapper: (value: T) => U): ComputedSignal<U> {
    return new ComputedSignal(() => mapper(this.value), {
      name: this._name ? `${this._name}.map` : undefined,
      debug: this._debug,
      scheduler: this._scheduler,
      errorHandler: this._errorHandler as any, 
    });
  }

  filter(predicate: (value: T) => boolean): ComputedSignal<T | undefined> {
    return new ComputedSignal(() => predicate(this.value) ? this.value : undefined, {
      name: this._name ? `${this._name}.filter` : undefined,
      debug: this._debug,
      scheduler: this._scheduler,
      errorHandler: this._errorHandler as any,
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

  constructor(fn: () => void | (() => void), options: EffectOptions = {}) {
    this._fn = fn;
    this._name = options.name;
    this._errorHandler = options.errorHandler;
    
    debugLog(`Created computation`, { name: this._name });
    
    if (!options.defer) {
      this.execute();
    }
  }

  execute(): void {
    if (this._disposed || this._executing) return;

    this._executing = true;
    this._executionCount++;
    this._lastExecution = Date.now();

    debugLog(`Executing computation ${this._name || 'anonymous'}`, { count: this._executionCount });

    for (const signal of this.dependencies) {
      (signal as any)._subscribers.delete(this);
    }
    this.dependencies.clear(); 

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
      const result = this._fn(); 
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
        scheduler: options.scheduler,
        errorHandler: options.errorHandler,
        equals: options.equals 
    };
    super(initialValue, baseOptions);

    this._loadFn = loadFn;
    this._timeout = options.timeout;
    this._retryCount = options.retryCount || 0;
    this._retryDelay = options.retryDelay || 1000;

    this._loadingSignal = signal(options.initialState === 'loading', { name: options.name ? `${options.name}.$loading` : undefined });
    this._errorSignal = signal<Error | null>(null, { name: options.name ? `${options.name}.$error` : undefined });

    if (options.initialState === 'loading') {
      this.reload();
    }
  }

  get loading(): boolean {
    return this._loadingSignal.value;
  }

  get error(): Error | null {
    return this._errorSignal.value;
  }

  get isSuccess(): boolean {
    return !this.loading && !this.error && this.peek() !== undefined;
  }

  async reload(): Promise<void> {
    if (this._loadingSignal.peek()) return; 
    this._loadingSignal.value = true;
    this._errorSignal.value = null;
    this._currentRetry = 0;
    await this._attemptLoad();
  }

  private async _attemptLoad(): Promise<void> {
    try {
      let loadPromise = this._loadFn();
      
      if (this._timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new SignalError(`Timeout after ${this._timeout}ms`, this.id, this.name)), this._timeout);
        });
        loadPromise = Promise.race([loadPromise, timeoutPromise]);
      }

      const result = await loadPromise;
      this.value = result; 
      this._errorSignal.value = null;
    } catch (error: any) {
      if (this._currentRetry < this._retryCount) {
        this._currentRetry++;
        debugLog(`AsyncSignal ${this.id} retrying load... (${this._currentRetry}/${this._retryCount})`, { name: this.name });
        setTimeout(() => this._attemptLoad(), this._retryDelay * Math.pow(2, this._currentRetry -1) ); 
        return; 
      }
      this._errorSignal.value = error instanceof Error ? error : new SignalError(String(error), this.id, this.name);
    } finally {
      if (!(this._currentRetry < this._retryCount && this._errorSignal.value)) { 
         this._loadingSignal.value = false;
      }
    }
  }

  dispose(): void {
    this._loadingSignal.dispose();
    this._errorSignal.dispose();
    super.dispose();
  }
}

export class ComputedSignal<T> extends Signal<T> {
  private _computation: Computation;
  private _fn: () => T;

  constructor(fn: () => T, options: ComputedOptions<T> = {}) {
    let initialVal: T | undefined = undefined;
    const tempComputation = currentComputation;
    currentComputation = null; 
    try {
        if (!options.defer) initialVal = fn();
    } catch (e: any) {
        if (options.debug || debugMode) {
            console.warn(`Initial computation for ${options.name || 'computed'} failed: ${e.message}. Will recompute on first access.`);
        }
    } finally {
        currentComputation = tempComputation;
    }

    super(initialVal as T, options); 
    this._fn = fn;
    
    this._computation = new Computation(() => {
      const newValue = this._fn();
      if (!this._equals(this._value, newValue)) {
        this._value = newValue; 
        this._notifySubscribers(); 
      }
    }, { 
        defer: options.defer, 
        name: options.name || (fn.name ? `computed(${fn.name})` : 'computed'),
        errorHandler: options.errorHandler || ((options as any)._errorHandler) 
    });
  }

  get value(): T {
    if ((this._computation.executionCount === 0 && !this._computation.isDisposed) || this._value === undefined) { 
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
  return new AsyncSignal(undefined, loadFn, options);
}

export function asyncSignalWithInitial<T>(
  initialValue: T,
  loadFn: () => Promise<T>,
  options?: AsyncSignalOptions<T>
): AsyncSignal<T> {
  return new AsyncSignal(initialValue, loadFn, options);
}

export function effect(fn: () => void | (() => void), options?: EffectOptions): Computation {
  return new Computation(fn, options);
}

export function resource<T>(
  loadFn: () => Promise<T>,
  options?: AsyncSignalOptions<T>
): [Signal<T | undefined>, { readonly loading: Signal<boolean>; readonly error: Signal<Error | null>; reload: () => Promise<void> }] {
  const asyncSig = new AsyncSignal<T>(undefined, loadFn, { ...options, initialState: 'loading' });
  
  const valueSignal = computed<T | undefined>(() => asyncSig.value, { name: options?.name ? `${options.name}.$value` : undefined });
  const loadingSignal = computed(() => asyncSig.loading, { name: options?.name ? `${options.name}.$loadingState` : undefined });
  const errorSignal = computed<Error | null>(() => asyncSig.error, { name: options?.name ? `${options.name}.$errorState` : undefined });

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
    return fn();
  }

  batchDepth++;
  currentBatch = currentBatch || new Set(); 
  let result: T;
  try {
    result = fn();
    if (batchDepth === 1) { 
        flushUpdates(); 
    }
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      currentBatch = null; 
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
  
  return sig;
}

