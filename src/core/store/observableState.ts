/**
 * Observable State Management with RxJS Integration
 * Advanced state flows with strong TypeScript support
 */

import { 
  Observable, 
  BehaviorSubject, 
  combineLatest, 
  merge, 
  Subject,
  distinctUntilChanged,
  map,
  filter,
  switchMap,
  mergeMap,
  catchError,
  debounceTime,
  throttleTime,
  scan,
  shareReplay,
  takeUntil,
  startWith,
  withLatestFrom,
  of,
  EMPTY
} from 'rxjs';
import { ZenithStore, Action, Selector } from './ZenithStore';
import { Signal, computed } from '../signals';

// Observable state slice type
export interface ObservableStateSlice<T> {
  state$: Observable<T>;
  dispatch: (action: Action) => void;
  select: <R>(selector: (state: T) => R) => Observable<R>;
}

// Effect configuration
export interface EffectConfig {
  debounce?: number;
  throttle?: number;
  catchErrors?: boolean;
  takeUntil?: Observable<any>;
}

// Async operation state
export interface AsyncState<T, E = Error> {
  loading: boolean;
  data: T | null;
  error: E | null;
  lastUpdated: number | null;
}

// Data fetching configuration
export interface DataFetchConfig<T> {
  cacheTime?: number;
  staleTime?: number;
  retryCount?: number;
  retryDelay?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Observable State Manager for complex async flows
 */
export class ObservableStateManager<State extends Record<string, any>> {
  private store: ZenithStore<State>;
  private effects$ = new Subject<Observable<Action>>();
  private destroy$ = new Subject<void>();
  private dataCache = new Map<string, { data: any; timestamp: number; config: DataFetchConfig<any> }>();
  
  constructor(store: ZenithStore<State>) {
    this.store = store;
    this.setupEffectHandler();
    this.setupWindowFocusRefetch();
  }
  
  /**
   * Get observable for entire state
   */
  getState$(): Observable<State> {
    return this.store.getState$();
  }
  
  /**
   * Select state slice with RxJS operators
   */
  select$<R>(selector: Selector<State, R>): Observable<R> {
    return this.store.select$(selector);
  }
  
  /**
   * Create state slice with scoped operations
   */
  createSlice<T>(
    selector: Selector<State, T>
  ): ObservableStateSlice<T> {
    const state$ = this.select$(selector);
    
    return {
      state$,
      dispatch: this.store.dispatch,
      select: <R>(sliceSelector: (state: T) => R) => 
        state$.pipe(map(sliceSelector), distinctUntilChanged())
    };
  }
  
  /**
   * Create derived state from multiple selectors
   */
  derive<T extends readonly Observable<any>[], R>(
    sources: T,
    combiner: (...values: { [K in keyof T]: T[K] extends Observable<infer U> ? U : never }) => R
  ): Observable<R> {
    return combineLatest(sources).pipe(
      map(values => combiner(...values as any)),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }
  
  /**
   * Create an effect that responds to state changes
   */
  createEffect<T>(
    source$: Observable<T>,
    effect: (value: T) => Observable<Action> | Action | void,
    config: EffectConfig = {}
  ): () => void {
    let stream$ = source$;
    
    // Apply debouncing if configured
    if (config.debounce) {
      stream$ = stream$.pipe(debounceTime(config.debounce));
    }
    
    // Apply throttling if configured
    if (config.throttle) {
      stream$ = stream$.pipe(throttleTime(config.throttle));
    }
    
    // Take until configured or component destruction
    const takeUntil$ = config.takeUntil || this.destroy$;
    stream$ = stream$.pipe(takeUntil(takeUntil$));
    
    const effectStream$ = stream$.pipe(
      switchMap(value => {
        const result = effect(value);
        
        if (!result) {
          return EMPTY;
        }
        
        if (result instanceof Observable) {
          return result;
        }
        
        return of(result);
      }),
      config.catchErrors ? catchError(error => {
        console.error('Effect error:', error);
        return EMPTY;
      }) : map(action => action)
    );
    
    this.effects$.next(effectStream$);
    
    // Return cleanup function
    return () => {
      // Effects cleanup is handled by takeUntil
    };
  }
  
  /**
   * Create async data fetcher with caching and state management
   */
  createDataFetcher<T, Args extends any[] = []>(
    key: string,
    fetcher: (...args: Args) => Promise<T>,
    config: DataFetchConfig<T> = {}
  ) {
    const defaultConfig: Required<DataFetchConfig<T>> = {
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 30 * 1000, // 30 seconds
      retryCount: 3,
      retryDelay: 1000,
      refetchOnWindowFocus: true,
      ...config
    };
    
    return {
      /**
       * Fetch data with caching
       */
      fetch: (...args: Args): Observable<AsyncState<T>> => {
        const cacheKey = `${key}-${JSON.stringify(args)}`;
        const cached = this.dataCache.get(cacheKey);
        const now = Date.now();
        
        // Return cached data if it's still fresh
        if (cached && (now - cached.timestamp) < defaultConfig.staleTime) {
          return of({
            loading: false,
            data: cached.data,
            error: null,
            lastUpdated: cached.timestamp
          });
        }
        
        // Start with loading state, potentially with stale data
        const initialState: AsyncState<T> = {
          loading: true,
          data: cached?.data || null,
          error: null,
          lastUpdated: cached?.timestamp || null
        };
        
        return new Observable<AsyncState<T>>(subscriber => {
          subscriber.next(initialState);
          
          let retryCount = 0;
          
          const executeRequest = async (): Promise<void> => {
            try {
              const data = await fetcher(...args);
              const timestamp = Date.now();
              
              // Cache the result
              this.dataCache.set(cacheKey, {
                data,
                timestamp,
                config: defaultConfig
              });
              
              subscriber.next({
                loading: false,
                data,
                error: null,
                lastUpdated: timestamp
              });
              
              subscriber.complete();
            } catch (error) {
              retryCount++;
              
              if (retryCount <= defaultConfig.retryCount) {
                // Retry after delay
                setTimeout(() => {
                  executeRequest();
                }, defaultConfig.retryDelay * retryCount);
              } else {
                // Final error state
                subscriber.next({
                  loading: false,
                  data: cached?.data || null,
                  error: error as any,
                  lastUpdated: cached?.timestamp || null
                });
                
                subscriber.complete();
              }
            }
          };
          
          executeRequest();
        }).pipe(
          startWith(initialState),
          shareReplay(1)
        );
      },
      
      /**
       * Invalidate cache for this fetcher
       */
      invalidate: (...args: Args) => {
        const cacheKey = `${key}-${JSON.stringify(args)}`;
        this.dataCache.delete(cacheKey);
      },
      
      /**
       * Get cached data without fetching
       */
      getCached: (...args: Args): T | null => {
        const cacheKey = `${key}-${JSON.stringify(args)}`;
        const cached = this.dataCache.get(cacheKey);
        return cached?.data || null;
      }
    };
  }
  
  /**
   * Setup effect handler
   */
  private setupEffectHandler(): void {
    merge(...this.effects$)
      .pipe(
        mergeMap(effect$ => effect$),
        takeUntil(this.destroy$)
      )
      .subscribe(action => {
        this.store.dispatch(action);
      });
  }
  
  /**
   * Setup window focus refetch for data fetchers
   */
  private setupWindowFocusRefetch(): void {
    if (typeof window !== 'undefined') {
      const focusHandler = () => {
        const now = Date.now();
        
        // Invalidate stale cache entries
        for (const [key, cached] of this.dataCache.entries()) {
          if (cached.config.refetchOnWindowFocus && 
              (now - cached.timestamp) > cached.config.staleTime) {
            this.dataCache.delete(key);
          }
        }
      };
      
      window.addEventListener('focus', focusHandler);
      
      // Cleanup on destroy
      this.destroy$.subscribe(() => {
        window.removeEventListener('focus', focusHandler);
      });
    }
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dataCache.clear();
  }
}

/**
 * Create observable state manager
 */
export function createObservableStateManager<State extends Record<string, any>>(
  store: ZenithStore<State>
): ObservableStateManager<State> {
  return new ObservableStateManager(store);
}

/**
 * Utility operators for common state patterns
 */
export const stateOperators = {
  /**
   * Filter out loading states
   */
  whenLoaded: <T>(source$: Observable<AsyncState<T>>) =>
    source$.pipe(
      filter(state => !state.loading && state.data !== null),
      map(state => state.data!)
    ),
  
  /**
   * Filter to only error states
   */
  whenError: <T, E>(source$: Observable<AsyncState<T, E>>) =>
    source$.pipe(
      filter(state => !state.loading && state.error !== null),
      map(state => state.error!)
    ),
  
  /**
   * Combine multiple async states
   */
  combineAsync: <T extends Record<string, Observable<AsyncState<any>>>>(
    sources: T
  ): Observable<{
    [K in keyof T]: T[K] extends Observable<AsyncState<infer U>> ? U : never;
  } & { loading: boolean; error: any }> => {
    const observables = Object.values(sources) as Observable<AsyncState<any>>[];
    
    return combineLatest(observables).pipe(
      map(states => {
        const loading = states.some(state => state.loading);
        const error = states.find(state => state.error)?.error || null;
        
        const data = {} as any;
        Object.keys(sources).forEach((key, index) => {
          data[key] = states[index].data;
        });
        
        return { ...data, loading, error };
      })
    );
  },
  
  /**
   * Debounce state changes
   */
  debounceState: <T>(ms: number) => (source$: Observable<T>) =>
    source$.pipe(debounceTime(ms)),
  
  /**
   * Throttle state changes
   */
  throttleState: <T>(ms: number) => (source$: Observable<T>) =>
    source$.pipe(throttleTime(ms)),
  
  /**
   * Track state changes with previous value
   */
  withPrevious: <T>() => (source$: Observable<T>) =>
    source$.pipe(
      scan((acc, curr) => ({ previous: acc.current, current: curr }), 
           { previous: undefined as T | undefined, current: undefined as T | undefined }),
      filter(({ current }) => current !== undefined),
      map(({ previous, current }) => ({ previous, current: current! }))
    )
};

/**
 * Create async state helpers
 */
export const asyncStateHelpers = {
  /**
   * Create initial async state
   */
  initial: <T>(): AsyncState<T> => ({
    loading: false,
    data: null,
    error: null,
    lastUpdated: null
  }),
  
  /**
   * Create loading async state
   */
  loading: <T>(data?: T): AsyncState<T> => ({
    loading: true,
    data: data || null,
    error: null,
    lastUpdated: null
  }),
  
  /**
   * Create success async state
   */
  success: <T>(data: T): AsyncState<T> => ({
    loading: false,
    data,
    error: null,
    lastUpdated: Date.now()
  }),
  
  /**
   * Create error async state
   */
  error: <T>(error: Error, data?: T): AsyncState<T> => ({
    loading: false,
    data: data || null,
    error,
    lastUpdated: null
  })
};
