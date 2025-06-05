/**
 * React hooks and utilities for ZenithStore integration
 * Provides type-safe state management with minimal boilerplate
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { Observable, Subscription } from 'rxjs';
import { ZenithStore, Selector, Action } from './ZenithStore';
import { Signal, computed, effect } from '../signals';

// Global store registry
const storeRegistry = new Map<string, ZenithStore<any>>();

/**
 * Register a store globally
 */
export function registerStore<State>(name: string, store: ZenithStore<State>): void {
  storeRegistry.set(name, store);
}

/**
 * Get a registered store
 */
export function getStore<State>(name: string): ZenithStore<State> | undefined {
  return storeRegistry.get(name);
}

/**
 * Hook to access store instance
 */
export function useStore<State>(name?: string): ZenithStore<State> {
  const store = name ? getStore<State>(name) : storeRegistry.values().next().value;
  
  if (!store) {
    throw new Error(`Store ${name || 'default'} not found. Did you register it?`);
  }
  
  return store;
}

/**
 * Hook to select state with type safety and automatic re-renders
 */
export function useSelector<State, Result>(
  selector: Selector<State, Result>,
  storeName?: string
): Result {
  const store = useStore<State>(storeName);
  const [state, setState] = useState(() => selector(store.getState()));
  
  useEffect(() => {
    return store.subscribe((newState) => {
      const newValue = selector(newState);
      setState(current => {
        // Only update if value actually changed
        return Object.is(current, newValue) ? current : newValue;
      });
    });
  }, [store, selector]);
  
  return state;
}

/**
 * Hook to dispatch actions with type safety
 */
export function useDispatch<State>(storeName?: string) {
  const store = useStore<State>(storeName);
  return store.dispatch;
}

/**
 * Hook to get both selector and dispatch
 */
export function useStoreState<State, Result>(
  selector: Selector<State, Result>,
  storeName?: string
): [Result, (action: Action) => void] {
  const selectedState = useSelector(selector, storeName);
  const dispatch = useDispatch<State>(storeName);
  
  return [selectedState, dispatch];
}

/**
 * Hook for reactive state using signals
 */
export function useSignalSelector<State, Result>(
  selector: Selector<State, Result>,
  storeName?: string
): Signal<Result> {
  const store = useStore<State>(storeName);
  
  return useMemo(() => {
    return store.select(selector);
  }, [store, selector]);
}

/**
 * Hook for observable-based state selection
 */
export function useObservableSelector<State, Result>(
  selector: Selector<State, Result>,
  storeName?: string
): Result {
  const store = useStore<State>(storeName);
  const [state, setState] = useState(() => selector(store.getState()));
  const subscriptionRef = useRef<Subscription>();
  
  useEffect(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = store.select$(selector).subscribe(setState);
    
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [store, selector]);
  
  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);
  
  return state;
}

/**
 * Hook for async actions with loading states
 */
export function useAsyncAction<Input, Result>(
  actionCreator: (input: Input) => Action,
  storeName?: string
) {
  const dispatch = useDispatch(storeName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = async (input: Input): Promise<Result> => {
    setLoading(true);
    setError(null);
    
    try {
      const action = actionCreator(input);
      const result = await dispatch(action);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return { execute, loading, error };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<State, Result>(
  selector: Selector<State, Result>,
  storeName?: string
) {
  const store = useStore<State>(storeName);
  const currentValue = useSelector(selector, storeName);
  const [optimisticValue, setOptimisticValue] = useState<Result | null>(null);
  
  const updateOptimistically = (value: Result, revertAfter?: number) => {
    setOptimisticValue(value);
    
    if (revertAfter) {
      setTimeout(() => {
        setOptimisticValue(null);
      }, revertAfter);
    }
  };
  
  const revert = () => {
    setOptimisticValue(null);
  };
  
  return {
    value: optimisticValue !== null ? optimisticValue : currentValue,
    updateOptimistically,
    revert,
    isOptimistic: optimisticValue !== null
  };
}

/**
 * Hook for store time travel (undo/redo)
 */
export function useTimeTravel(storeName?: string) {
  const store = useStore(storeName);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // This would need to be implemented properly with store state tracking
  // For now, just provide the interface
  
  const undo = () => {
    const success = store.undo();
    if (success) {
      // Update undo/redo availability
    }
  };
  
  const redo = () => {
    const success = store.redo();
    if (success) {
      // Update undo/redo availability
    }
  };
  
  const jumpToAction = (actionIndex: number) => {
    return store.jumpToAction(actionIndex);
  };
  
  return {
    undo,
    redo,
    jumpToAction,
    canUndo,
    canRedo,
    actionHistory: store.getActionHistory()
  };
}

/**
 * Provider component for store context
 */
interface StoreProviderProps<State> {
  store: ZenithStore<State>;
  name?: string;
  children: React.ReactNode;
}

export function StoreProvider<State>({ store, name = 'default', children }: StoreProviderProps<State>) {
  useEffect(() => {
    registerStore(name, store);
    
    return () => {
      // Optionally unregister on unmount
      // storeRegistry.delete(name);
    };
  }, [store, name]);
  
  return <>{children}</>;
}

/**
 * Higher-order component for connecting components to store
 */
export function connectStore<Props, State, SelectedState>(
  selector: Selector<State, SelectedState>,
  storeName?: string
) {
  return function<T extends React.ComponentType<Props & SelectedState>>(Component: T) {
    const ConnectedComponent = (props: Props) => {
      const selectedState = useSelector(selector, storeName);
      
      return <Component {...props} {...selectedState} />;
    };
    
    ConnectedComponent.displayName = `Connected(${Component.displayName || Component.name})`;
    
    return ConnectedComponent;
  };
}

/**
 * Create typed hooks for a specific store
 */
export function createStoreHooks<State>() {
  return {
    useSelector: <Result>(selector: Selector<State, Result>) => 
      useSelector<State, Result>(selector),
    
    useDispatch: () => 
      useDispatch<State>(),
    
    useStoreState: <Result>(selector: Selector<State, Result>) => 
      useStoreState<State, Result>(selector),
    
    useSignalSelector: <Result>(selector: Selector<State, Result>) => 
      useSignalSelector<State, Result>(selector),
    
    useObservableSelector: <Result>(selector: Selector<State, Result>) => 
      useObservableSelector<State, Result>(selector),
    
    useTimeTravel: () => 
      useTimeTravel(),
    
    connectStore: <Props, SelectedState>(selector: Selector<State, SelectedState>) =>
      connectStore<Props, State, SelectedState>(selector)
  };
}

/**
 * Utility for creating memoized selectors
 */
export function createSelector<State, Args extends any[], Result>(
  dependencies: [(state: State) => Args[0], ...((state: State) => Args[number])[]],
  combiner: (...args: Args) => Result
): Selector<State, Result> {
  let lastArgs: Args | undefined;
  let lastResult: Result;
  
  return (state: State): Result => {
    const currentArgs = dependencies.map(dep => dep(state)) as Args;
    
    if (!lastArgs || !currentArgs.every((arg, index) => Object.is(arg, lastArgs![index]))) {
      lastArgs = currentArgs;
      lastResult = combiner(...currentArgs);
    }
    
    return lastResult;
  };
}

/**
 * Utility for combining multiple selectors
 */
export function combineSelectors<State, T extends Record<string, Selector<State, any>>>(
  selectors: T
): Selector<State, { [K in keyof T]: ReturnType<T[K]> }> {
  return (state: State) => {
    const result = {} as { [K in keyof T]: ReturnType<T[K]> };
    
    for (const [key, selector] of Object.entries(selectors)) {
      result[key as keyof T] = selector(state);
    }
    
    return result;
  };
}
