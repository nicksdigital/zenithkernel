/**
 * ZenithStore - Type-Safe Immutable State Management
 * Inspired by Redux but with minimal boilerplate and strong TypeScript integration
 */

import { Observable, BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { Signal, signal, computed } from '../signals';

// Action types
export interface Action<T = any> {
  type: string;
  payload?: T;
  meta?: Record<string, any>;
}

// Reducer type with strong typing
export type Reducer<S, A extends Action = Action> = (state: S, action: A) => S;

// Store configuration
export interface StoreConfig<State> {
  initialState: State;
  reducers: Record<string, Reducer<any, any>>;
  middleware?: Middleware<State>[];
  devTools?: boolean;
  enableTimeTravel?: boolean;
}

// Middleware type
export type Middleware<State> = (
  store: { getState: () => State; dispatch: (action: Action) => void }
) => (next: (action: Action) => void) => (action: Action) => void;

// Selector type with memoization
export type Selector<State, Result> = (state: State) => Result;

// Subscription options
export interface SubscriptionOptions {
  immediate?: boolean;
  distinctUntilChanged?: boolean;
}

/**
 * Type-safe action creators with payload inference
 */
export function createAction<T = void>(
  type: string
): T extends void
  ? () => Action<void>
  : (payload: T) => Action<T> {
  return ((payload?: T) => ({
    type,
    payload,
    meta: { timestamp: Date.now() }
  })) as any;
}

/**
 * Async action creator with loading states
 */
export function createAsyncAction<Input, Success, Failure = Error>(
  typePrefix: string
) {
  return {
    request: createAction<Input>(`${typePrefix}_REQUEST`),
    success: createAction<Success>(`${typePrefix}_SUCCESS`),
    failure: createAction<Failure>(`${typePrefix}_FAILURE`)
  };
}

/**
 * Immutable update utilities using structural sharing
 */
export const immer = {
  produce<T>(state: T, updater: (draft: T) => void | T): T {
    // Simple immutable update implementation
    // In production, you'd use Immer or similar
    if (typeof state !== 'object' || state === null) {
      return state;
    }

    const draft = Array.isArray(state)
      ? [...state] as T
      : { ...state } as T;

    const result = updater(draft);
    return result !== undefined ? result : draft;
  },

  current<T>(draft: T): T {
    return draft;
  }
};

/**
 * Common middleware implementations
 */
export const middleware = {
  /**
   * Logger middleware
   */
  logger<State>(): Middleware<State> {
    return (store) => (next) => (action) => {
      console.group(`Action: ${action.type}`);
      console.log('Previous state:', store.getState());
      console.log('Action:', action);

      next(action);

      console.log('Next state:', store.getState());
      console.groupEnd();
    };
  },

  /**
   * Async middleware for handling promises
   */
  async<State>(): Middleware<State> {
    return (store) => (next) => (action: any) => {
      if (typeof action === 'function') {
        // Thunk support
        return action(store.dispatch, store.getState);
      }

      if (action.payload && typeof action.payload.then === 'function') {
        // Promise support
        const { type, payload, meta } = action;

        next({ type: `${type}_PENDING`, meta });

        return payload
          .then((result: any) => {
            next({ type: `${type}_FULFILLED`, payload: result, meta });
            return result;
          })
          .catch((error: any) => {
            next({ type: `${type}_REJECTED`, payload: error, meta });
            throw error;
          });
      }

      return next(action);
    };
  },

  /**
   * Performance monitoring middleware
   */
  performance<State>(options: { warnAfter?: number } = {}): Middleware<State> {
    const { warnAfter = 16 } = options;

    return (_store) => (next) => (action) => {
      const start = performance.now();
      const result = next(action);
      const duration = performance.now() - start;

      if (duration > warnAfter) {
        console.warn(`[Performance] Action "${action.type}" took ${duration.toFixed(2)}ms`);
      }

      return result;
    };
  },

  /**
   * State persistence middleware
   */
  persistence<State>(options: {
    key: string;
    storage?: Storage;
    whitelist?: string[];
    blacklist?: string[];
    predicate?: (state: State) => boolean;
  }): Middleware<State> {
    const { key, storage, whitelist, blacklist, predicate } = options;

    return (store) => (next) => (action) => {
      const result = next(action);

      if (storage && (!predicate || predicate(store.getState()))) {
        try {
          const state = store.getState();
          let stateToSave = state;

          // Apply whitelist/blacklist filtering
          if (whitelist || blacklist) {
            stateToSave = {} as State;
            for (const [k, v] of Object.entries(state as Record<string, any>)) {
              const shouldInclude = whitelist ?
                whitelist.some(path => k.startsWith(path.split('.')[0])) :
                !blacklist?.some(path => k.startsWith(path.split('.')[0]));

              if (shouldInclude) {
                (stateToSave as any)[k] = v;
              }
            }
          }

          storage.setItem(key, JSON.stringify(stateToSave));
        } catch (error) {
          console.warn('[Persistence] Failed to save state:', error);
        }
      }

      return result;
    };
  }
};

/**
 * Main ZenithStore class
 */
export class ZenithStore<State extends Record<string, any>> {
  private state$: BehaviorSubject<State>;
  private reducers: Record<string, Reducer<any, any>>;
  private middleware: Middleware<State>[];
  private listeners: Set<(state: State) => void> = new Set();
  private actionHistory: Action[] = [];
  private stateHistory: State[] = [];
  private currentHistoryIndex = 0;
  private maxHistorySize = 50;
  
  // Signal integration
  private stateSignal: Signal<State>;
  private selectorCache = new Map<string, Signal<any>>();
  
  constructor(config: StoreConfig<State>) {
    this.state$ = new BehaviorSubject(config.initialState);
    this.reducers = config.reducers || {};
    this.middleware = config.middleware || [];
    
    // Create reactive signal for state
    this.stateSignal = signal(config.initialState);
    
    // Enable time travel if requested
    if (config.enableTimeTravel) {
      this.stateHistory.push(config.initialState);
    }
    
    // Subscribe state$ to stateSignal
    this.state$.subscribe(state => {
      this.stateSignal.value = state;
    });
    
    // DevTools integration
    if (config.devTools && typeof window !== 'undefined') {
      this.setupDevTools();
    }
  }
  
  /**
   * Get current state
   */
  getState(): State {
    return this.state$.value;
  }
  
  /**
   * Get state as signal for reactive access
   */
  getStateSignal(): Signal<State> {
    return this.stateSignal;
  }
  
  /**
   * Get state as observable
   */
  getState$(): Observable<State> {
    return this.state$.asObservable();
  }
  
  /**
   * Dispatch action with middleware support
   */
  dispatch = (action: Action): void => {
    // Apply middleware
    let dispatch = this.dispatchRaw;
    
    for (let i = this.middleware.length - 1; i >= 0; i--) {
      dispatch = this.middleware[i]({
        getState: () => this.getState(),
        dispatch: this.dispatch
      })(dispatch);
    }
    
    dispatch(action);
  }
  
  /**
   * Raw dispatch without middleware
   */
  private dispatchRaw = (action: Action): void => {
    const currentState = this.getState();
    const newState = this.rootReducer(currentState, action);
    
    if (newState !== currentState) {
      // Update history for time travel
      if (this.stateHistory.length > 0) {
        this.actionHistory.push(action);
        this.stateHistory.push(newState);
        this.currentHistoryIndex = this.stateHistory.length - 1;
        
        // Limit history size
        if (this.stateHistory.length > this.maxHistorySize) {
          this.stateHistory.shift();
          this.actionHistory.shift();
          this.currentHistoryIndex--;
        }
      }
      
      // Emit new state
      this.state$.next(newState);
      
      // Notify listeners
      this.listeners.forEach(listener => listener(newState));
    }
  }
  
  /**
   * Root reducer that combines all reducers
   */
  private rootReducer = (state: State, action: Action): State => {
    // If no reducers are defined, return the state unchanged
    if (!this.reducers || Object.keys(this.reducers).length === 0) {
      return state;
    }

    const reducerEntries = Object.entries(this.reducers);

    // If there's only one reducer, treat it as a root reducer for the entire state
    if (reducerEntries.length === 1) {
      const [, reducer] = reducerEntries[0];
      return reducer(state, action);
    }

    // Multiple reducers - combine them by slice
    let hasChanged = false;
    const nextState = { ...state };

    for (const [key, reducer] of reducerEntries) {
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      (nextState as any)[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : state;
  }
  
  /**
   * Create a type-safe selector with memoization
   */
  select<Result>(
    selector: Selector<State, Result>,
    options: SubscriptionOptions = {}
  ): Signal<Result> {
    const selectorKey = selector.toString();
    
    if (this.selectorCache.has(selectorKey)) {
      return this.selectorCache.get(selectorKey)!;
    }
    
    // Create computed signal for selector
    const selectorSignal = computed(() => {
      return selector(this.stateSignal.value);
    });
    
    this.selectorCache.set(selectorKey, selectorSignal);
    return selectorSignal;
  }
  
  /**
   * Select state as observable with RxJS operators
   */
  select$<Result>(
    selector: Selector<State, Result>
  ): Observable<Result> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(
    listener: (state: State) => void,
    options: SubscriptionOptions = {}
  ): () => void {
    if (options.immediate !== false) {
      listener(this.getState());
    }
    
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Setup Redux DevTools integration
   */
  private setupDevTools(): void {
    // Simplified devtools setup
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      console.log('DevTools integration available');
    }
  }
}

/**
 * Create a strongly typed store
 */
export function createStore<State extends Record<string, any>>(
  config: StoreConfig<State>
): ZenithStore<State> {
  return new ZenithStore(config);
}
