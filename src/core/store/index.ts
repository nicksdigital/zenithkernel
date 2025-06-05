/**
 * ZenithStore - Type-Safe Immutable State Management
 * Export all store-related functionality
 */

// Core store
export {
  ZenithStore,
  createStore,
  createAction,
  createAsyncAction,
  immer,
  middleware
} from './ZenithStore';

// React hooks
export {
  useStore,
  useSelector,
  useDispatch,
  useStoreState,
  useSignalSelector,
  useObservableSelector,
  useAsyncAction,
  useOptimisticUpdate,
  useTimeTravel,
  StoreProvider,
  connectStore,
  createStoreHooks,
  createSelector,
  combineSelectors,
  registerStore,
  getStore
} from './storeHooks';

// Observable state management
export {
  ObservableStateManager,
  createObservableStateManager,
  stateOperators,
  asyncStateHelpers
} from './observableState';

// Types
export type {
  Action,
  Reducer,
  StoreConfig,
  Middleware,
  Selector,
  SubscriptionOptions,
  ObservableStateSlice,
  EffectConfig,
  AsyncState,
  DataFetchConfig
} from './ZenithStore';

/**
 * Create a complete store setup with all features
 */
export function createCompleteStore<State extends Record<string, any>>(
  config: import('./ZenithStore').StoreConfig<State>
) {
  const store = createStore(config);
  const observableManager = createObservableStateManager(store);
  const hooks = createStoreHooks<State>();
  
  return {
    store,
    observableManager,
    hooks,
    
    // Convenience methods
    dispatch: store.dispatch.bind(store),
    getState: store.getState.bind(store),
    select: store.select.bind(store),
    subscribe: store.subscribe.bind(store),
    
    // Observable methods
    createEffect: observableManager.createEffect.bind(observableManager),
    createDataFetcher: observableManager.createDataFetcher.bind(observableManager),
    
    // Cleanup
    dispose: () => {
      store.dispose();
      observableManager.dispose();
    }
  };
}

/**
 * Quick setup function for development
 */
export function setupDevStore<State extends Record<string, any>>(
  initialState: State,
  reducers: Record<string, import('./ZenithStore').Reducer<any, any>>
) {
  return createCompleteStore({
    initialState,
    reducers,
    middleware: [
      middleware.logger<State>(),
      middleware.async<State>()
    ],
    devTools: true,
    enableTimeTravel: true
  });
}
