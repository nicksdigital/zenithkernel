import { Observable, BehaviorSubject, combineLatest, from, of, EMPTY, Subscription, interval, fromEvent } from 'rxjs';
import { map, switchMap, catchError, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { Signal, signal, computed, effect } from '../signals'; // Assuming this path is correct

// --- Core Types ---

export type RouteParams = Record<string, string | undefined>; // Allow undefined for optional params
export type QueryParams = Record<string, string | string[] | undefined>;

export type RouteLoader<T = any> = (params: RouteParams, query: QueryParams) => Promise<T> | T;

export interface RouteLoaderConfig<T = any> {
  key?: string; // Custom cache key
  loadFn: RouteLoader<T>;
  staleTime?: number; // milliseconds
  cacheTime?: number; // milliseconds
  revalidateOnFocus?: boolean;
}

export type RouteLoaderInput<T = any> = RouteLoader<T> | RouteLoaderConfig<T>;

export interface RouteLoaderResult<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  key: string;
}

export interface RouteDefinition<
  TPath extends string = string,
  TData = any
> {
  path: TPath;
  name?: string; // Optional name for the route
  component: () => Promise<any> | any; // Lazy or eager component
  layout?: () => Promise<any> | any; // Optional layout component
  loader?: RouteLoaderInput<TData>;
  meta?: {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
    roles?: string[];
    preload?: boolean; // Hint for prefetching strategy
    [key: string]: any; // Allow other meta properties
  };
  guards?: RouteGuard[];
  children?: RouteDefinition<string, any>[];
  errorBoundary?: (error: Error, routeMatch: RouteMatch) => any;
  suspenseFallback?: (routeMatch: RouteMatch) => any;
}

export interface RouteGuard {
  canActivate: (params: RouteParams, query: QueryParams, route: RouteDefinition) => boolean | Promise<boolean>;
  redirectTo?: string | ((params: RouteParams, query: QueryParams) => string);
  onFail?: (params: RouteParams, query: QueryParams, route: RouteDefinition) => void;
}

export interface NavigationOptions {
  replace?: boolean;
  state?: any;
  preserveQuery?: boolean;
  preserveHash?: boolean;
  // For named routes, if query params are not part of the path
  query?: QueryParams;
}

export interface RouteMatch<TData = any> {
  route: RouteDefinition;
  params: RouteParams;
  query: QueryParams;
  hash: string;
  pathname: string; // The matched part of the path
  fullPath: string; // The full URL path being navigated to
  search: string;
  loaderResult?: Signal<RouteLoaderResult<TData>>; // Signal for loader state
  layoutComponent?: any; // Resolved layout
  pageComponent?: any; // Resolved page component
}

export interface RouterState {
  currentRoute: RouteMatch | null;
  isNavigating: boolean;
  navigationError: Error | null;
  historyStack: RouteMatch[]; // Keep track of navigation history
  canGoBack: boolean;
  canGoForward: boolean; // More explicit forward tracking might require session history
}

interface CacheEntry<T> {
  data$: BehaviorSubject<T | null>;
  loading$: BehaviorSubject<boolean>;
  error$: BehaviorSubject<Error | null>;
  promise?: Promise<T>;
  timestamp: number; // Last successful fetch
  staleTime: number;
  cacheTime: number; // Time until eligible for automatic cleanup
  revalidateOnFocus: boolean;
  loaderFn: RouteLoader<T>;
  subscribers: number; // Track subscribers to clean up observables
  key: string;
}

// --- Type Utilities for Path Parameter Extraction ---

export type ExtractParams<TPath extends string> =
  TPath extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractParams<Rest>
    : TPath extends `${infer _Start}:${infer Param}?/${infer Rest}` // Optional param segment
    ? { [K in Param]?: string } & ExtractParams<Rest>
    : TPath extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : TPath extends `${infer _Start}:${infer Param}?` // Optional trailing param
    ? { [K in Param]?: string }
    : {};

// Placeholder for future named route param extraction (complex to fully implement here)
// export type ExtractParamsForNamedRoute<TRouteName extends string, TAllRoutes extends RouteDefinition[] = RouteDefinition[]> =
//   TRouteName extends TAllRoutes[number]['name']
//     ? ExtractParams<Extract<TAllRoutes[number], { name: TRouteName }>['path']>
//     : {};


// --- TypeSafeRouteBuilder (largely unchanged, but supports optional params in regex) ---
export class TypeSafeRouteBuilder<TPath extends string> {
  public readonly paramNames: (keyof ExtractParams<TPath>)[] = [];
  public readonly regex: RegExp;

  constructor(public readonly path: TPath, isEnd: boolean = true) { // isEnd for child route matching
    let pattern: string = path;
    const paramNameCollector: string[] = [];

    pattern = pattern.replace(/:([^/?]+)\?/g, (_, paramName) => { // Optional param: e.g., /users/:id?
      paramNameCollector.push(paramName);
      return '(?:/([^/]+))?'; // Make the segment optional
    });

    pattern = pattern.replace(/:([^/]+)/g, (_, paramName) => { // Required param
      paramNameCollector.push(paramName);
      return '([^/]+)';
    });

    this.paramNames = paramNameCollector as any;
    this.regex = new RegExp(`^${pattern}${isEnd ? '$' : ''}`);
  }

  build(params: ExtractParams<TPath>, query?: QueryParams): string {
    let result: string = this.path;
    for (const key of this.paramNames) {
      const value = params[key as keyof ExtractParams<TPath>];
      if (value !== undefined) {
        result = result.replace(`:${String(key)}?`, String(value))
                       .replace(`:${String(key)}`, String(value));
      } else {
        // Remove optional segments if param is not provided
        result = result.replace(`/:${String(key)}?`, '');
      }
    }
    if (query) {
      const queryString = new URLSearchParams(query as Record<string, string>).toString();
      if (queryString) {
        result += `?${queryString}`;
      }
    }
    return result;
  }

  matches(pathname: string): boolean {
    return this.regex.test(pathname);
  }

  extractParams(pathname: string): ExtractParams<TPath> | null {
    const match = pathname.match(this.regex);
    if (!match) return null;

    const params = {} as ExtractParams<TPath>;
    this.paramNames.forEach((name, index) => {
      const value = match[index + 1];
      if (value !== undefined) {
        (params as any)[name] = decodeURIComponent(value);
      }
    });
    return params;
  }
}


// --- ZenithRouter Class ---
export class ZenithRouter {
  enablePrefetching() {
    throw new Error('Method not implemented.');
  }
  setCacheStrategy(cacheStrategy: string) {
    throw new Error('Method not implemented.');
  }
  private routes: RouteDefinition[] = [];
  private routeBuilders = new Map<string, TypeSafeRouteBuilder<any>>(); // path -> builder
  private dataCache = new Map<string, CacheEntry<any>>(); // cacheKey -> CacheEntry
  private prefetchCache = new Set<string>(); // paths that have been prefetched

  private routerState$ = new BehaviorSubject<RouterState>({
    currentRoute: null,
    isNavigating: false,
    navigationError: null,
    historyStack: [],
    canGoBack: false,
    canGoForward: false,
  });
  private currentRouteSignal = signal<RouteMatch | null>(null);
  private isNavigatingSignal = signal<boolean>(false);

  private popStateSubscription?: Subscription;
  private focusSubscription?: Subscription;
  private cacheCleanupInterval?: Subscription;

  private historyIndex = -1; // For tracking current position in historyStack

  constructor(defaultRoutes: RouteDefinition[] = []) {
    this.register(defaultRoutes);
    if (typeof window !== 'undefined') {
      this.setupBrowserIntegration();
    }
    this.setupSignalSync();
  }

  // --- Public API ---

  public register(routesToRegister: RouteDefinition[], parentPath: string = ''): void {
    routesToRegister.forEach(route => this.addRoute(route, parentPath, false));
    // Re-evaluate current route if registered after initial load
    if (this.popStateSubscription && this.routerState$.value.currentRoute === null) {
       this.handleLocationChange(window.location.pathname + window.location.search + window.location.hash);
    }
  }

  public addRoute(route: RouteDefinition, parentPath?: string, triggerUpdate: boolean = true): void {
    const fullPath = parentPath ? `${parentPath.replace(/\/$/, '')}/${route.path.replace(/^\//, '')}` : route.path;
    const existingRouteIndex = this.routes.findIndex(r => r.path === fullPath);
    if (existingRouteIndex !== -1) {
        console.warn(`Route with path "${fullPath}" already exists. Overwriting.`);
        this.routes[existingRouteIndex] = { ...route, path: fullPath };
    } else {
        this.routes.push({ ...route, path: fullPath });
    }

    this.routeBuilders.set(fullPath, new TypeSafeRouteBuilder(fullPath as string));

    if (route.children?.length) {
        route.children.forEach(childRoute => this.addRoute(childRoute, fullPath, false));
    }
    if (triggerUpdate && typeof window !== 'undefined') {
        this.handleLocationChange(window.location.pathname + window.location.search + window.location.hash);
    }
  }

  public removeRoute(pathToRemove: string): boolean {
    const initialLength = this.routes.length;
    this.routes = this.routes.filter(route => {
        if (route.path === pathToRemove || route.path.startsWith(`${pathToRemove}/`)) {
            this.routeBuilders.delete(route.path);
            // Clean up cache related to this route
            this.dataCache.forEach((_, key) => {
                if (key.startsWith(route.path)) this.dataCache.delete(key);
            });
            this.prefetchCache.delete(route.path);
            return false;
        }
        return true;
    });
    return this.routes.length < initialLength;
  }


  public createNavigator<TPath extends string>(
    path: TPath
  ): (params: ExtractParams<TPath>, options?: NavigationOptions) => Promise<void> {
    if (!this.routeBuilders.has(path)) {
      // Attempt to find it if it was registered with a different base
      const foundBuilder = Array.from(this.routeBuilders.values()).find(b => b.path === path);
      if (!foundBuilder) {
        throw new Error(`Route builder for path "${path}" not found. Ensure it's registered.`);
      }
    }
    const builder = this.routeBuilders.get(path)!;

    return async (params: ExtractParams<TPath>, options: NavigationOptions = {}) => {
      const targetPath = builder.build(params, options.query);
      return this.navigate(targetPath, options);
    };
  }

  public async navigate(path: string, options: NavigationOptions = {}): Promise<void> {
    if (this.isNavigatingSignal.value) {
      console.warn('Navigation already in progress.');
      return;
    }
    this.isNavigatingSignal.value = true;
    this._updateRouterState({ isNavigating: true, navigationError: null });

    try {
      const targetURL = new URL(path, window.location.origin);
      const fullPath = targetURL.pathname + (options.preserveQuery ? targetURL.search : '') + (options.preserveHash ? targetURL.hash : '');

      const match = this._findMatchRecursive(this.routes, targetURL.pathname);

      if (!match) {
        throw new Error(`No route found for path: ${targetURL.pathname}`);
      }

      // Resolve query params for the actual navigation
      const query = options.query || this._parseQuery(targetURL.search);
      match.query = query; // Update match with final query params
      match.search = new URLSearchParams(query as Record<string,string>).toString(); // and search string


      const canActivate = await this._runGuards(match);
      if (!canActivate) {
        this._updateRouterState({ isNavigating: false });
        this.isNavigatingSignal.value = false;
        return;
      }

      if (match.route.component) {
        match.pageComponent = await Promise.resolve(match.route.component());
      }
      if (match.route.layout) {
        match.layoutComponent = await Promise.resolve(match.route.layout());
      }

      if (match.route.loader) {
          match.loaderResult = this.getOrCreateLoaderSignal(match);
      }


      if (options.replace) {
        history.replaceState(options.state || {}, '', fullPath);
      } else {
        history.pushState(options.state || {}, '', fullPath);
      }
      this._handleHistoryUpdate(match, options.replace);


      this._updateRouterState({
        currentRoute: match,
        isNavigating: false,
        canGoBack: this.historyIndex > 0,
        canGoForward: this.historyIndex < this.routerState$.value.historyStack.length - 1
      });
      this.currentRouteSignal.value = match;

      // Auto-prefetch based on meta hint (if not already the current route's data)
      if (match.route.meta?.preload && match.route.loader) {
        this.prefetch(match.fullPath).catch(e => console.warn("Preload failed:", e));
      }

    } catch (error: any) {
      console.error("Navigation error:", error);
      this._updateRouterState({ navigationError: error, isNavigating: false });
      if (this.routerState$.value.currentRoute?.route.errorBoundary) {
          // Allow error boundary to render something
          // The rendering layer would use this.
      }
    } finally {
      this.isNavigatingSignal.value = false;
    }
  }

  public async prefetch(path: string): Promise<void> {
    if (this.prefetchCache.has(path)) return;

    const url = new URL(path, window.location.origin);
    const match = this._findMatchRecursive(this.routes, url.pathname);

    if (match?.route.loader) {
      try {
        this.getOrCreateLoaderSignal(match, true); // true to force immediate fetch
        this.prefetchCache.add(path);
      } catch (error) {
        console.warn(`Failed to prefetch route data for ${path}:`, error);
      }
    }
  }

   public async revalidateLoaderData(pathOrKey: string): Promise<void> {
    let cacheEntry: CacheEntry<any> | undefined;

    // Check if it's a cache key first
    if (this.dataCache.has(pathOrKey)) {
        cacheEntry = this.dataCache.get(pathOrKey);
    } else { // Assume it's a path
        const url = new URL(pathOrKey, window.location.origin);
        const match = this._findMatchRecursive(this.routes, url.pathname);
        if (match?.route.loader) {
            const loaderConfig = this._getLoaderConfig(match.route.loader);
            const cacheKey = loaderConfig.key || this._generateCacheKey(match);
            cacheEntry = this.dataCache.get(cacheKey);
        }
    }

    if (cacheEntry) {
        cacheEntry.timestamp = 0; // Mark as stale to force revalidation
        // If there are active subscribers or it's the current route, it might trigger a fetch
        // Or, we can force it if needed:
        if (cacheEntry.subscribers > 0) {
           this._fetchLoaderData(cacheEntry.key, cacheEntry);
        }
    } else {
        console.warn(`No loader data found to revalidate for: ${pathOrKey}`);
    }
  }


  public back(): void {
    if (this.routerState$.value.canGoBack) history.back();
  }

  public forward(): void {
    if (this.routerState$.value.canGoForward) history.forward();
  }

  public clearCache(key?: string): void {
    if (key) {
      const entry = this.dataCache.get(key);
      if (entry) {
        entry.data$.next(null); entry.error$.next(null); entry.loading$.next(false);
        this.dataCache.delete(key);
      }
    } else {
      this.dataCache.forEach(entry => {
        entry.data$.next(null); entry.error$.next(null); entry.loading$.next(false);
      });
      this.dataCache.clear();
    }
  }

  public getState(): Observable<RouterState> { return this.routerState$.asObservable(); }
  public getCurrentRoute(): Observable<RouteMatch | null> { return this.routerState$.pipe(map(s => s.currentRoute), distinctUntilChanged()); }
  public getIsNavigating(): Observable<boolean> { return this.routerState$.pipe(map(s => s.isNavigating), distinctUntilChanged());}

  public getStateSignal(): Signal<RouterState> { return computed(() => this.routerState$.value); }
  public getCurrentRouteSignal(): Signal<RouteMatch | null> { return this.currentRouteSignal; }
  public getIsNavigatingSignal(): Signal<boolean> { return this.isNavigatingSignal; }

  public dispose(): void {
    this.popStateSubscription?.unsubscribe();
    this.focusSubscription?.unsubscribe();
    this.cacheCleanupInterval?.unsubscribe();
    this.dataCache.forEach(entry => {
        entry.data$.complete();
        entry.loading$.complete();
        entry.error$.complete();
    });
    this.dataCache.clear();
    this.routerState$.complete();
  }

  // --- Private Helpers ---

  private _updateRouterState(newStatePartial: Partial<RouterState>): void {
    this.routerState$.next({ ...this.routerState$.value, ...newStatePartial });
  }

  private setupBrowserIntegration(): void {
    this.popStateSubscription = fromEvent(window, 'popstate')
      .subscribe(() => {
        const newPath = window.location.pathname + window.location.search + window.location.hash;
        const historyState = history.state; // Can be used to restore state

        // Determine if it's a back/forward navigation within our tracked history
        const existingHistoryEntryIndex = this.routerState$.value.historyStack.findIndex(
            (item, idx) => item.fullPath === newPath && idx !== this.historyIndex
        );

        if (existingHistoryEntryIndex !== -1) {
            this.historyIndex = existingHistoryEntryIndex;
             const matchedRoute = this.routerState$.value.historyStack[this.historyIndex];
             this._updateRouterState({
                currentRoute: matchedRoute,
                canGoBack: this.historyIndex > 0,
                canGoForward: this.historyIndex < this.routerState$.value.historyStack.length - 1,
                navigationError: null,
             });
             this.currentRouteSignal.value = matchedRoute;
        } else {
            // Navigated to a path not in current stack (e.g. manual URL change, or outside app'sSPA nav)
            // Treat as a new navigation.
            this.handleLocationChange(newPath, true);
        }
      });

    this.focusSubscription = fromEvent(window, 'focus')
      .subscribe(() => this._revalidateOnFocus());

    this.cacheCleanupInterval = interval(60 * 1000) // Every minute
      .subscribe(() => this._cleanupExpiredCache());

    // Initial load
    this.handleLocationChange(window.location.pathname + window.location.search + window.location.hash, true);
  }

  private _handleHistoryUpdate(match: RouteMatch, replace: boolean = false): void {
    const currentStack = this.routerState$.value.historyStack;
    if (replace) {
        if (this.historyIndex >= 0) {
            currentStack[this.historyIndex] = match;
            this._updateRouterState({ historyStack: [...currentStack] });
        } else {
             // Replacing with no history, should be rare, treat as new initial entry
            this.historyIndex = 0;
            this._updateRouterState({ historyStack: [match] });
        }
    } else {
        // If we navigated back and then navigated to a new path, truncate forward history
        const newStack = currentStack.slice(0, this.historyIndex + 1);
        newStack.push(match);
        this.historyIndex = newStack.length - 1;
        this._updateRouterState({ historyStack: newStack });
    }
  }


  private setupSignalSync(): void {
    // No need for explicit sync if signals are derived or directly updated
    // this.routerState$.subscribe(state => this.routerSignal.value = state);
    // this.currentRoute$.subscribe(route => this.currentRouteSignal.value = route);
  }

  private _findMatchRecursive(routes: RouteDefinition[], pathname: string, basePath: string = ''): RouteMatch | null {
    for (const route of routes) {
        const routePath = `${basePath}${route.path}`.replace(/\/\//g, '/'); // Normalize double slashes
        const builder = this.routeBuilders.get(routePath) || new TypeSafeRouteBuilder(routePath as string, !route.children?.length);

        if (builder.matches(pathname)) {
            const params = builder.extractParams(pathname) || {};
            // Query params are parsed later during navigate or handleLocationChange
            return {
                route,
                params,
                query: {}, // Placeholder, will be filled
                hash: '', // Placeholder
                pathname: pathname, // The portion of the path this route's pattern matched
                fullPath: pathname, // Placeholder, actual full path comes from navigation
                search: '', // Placeholder
            };
        }

        // If it's a partial match and there are children, recurse
        // This requires regex to not be end-anchored for parent paths
        if (route.children?.length && pathname.startsWith(routePath.replace(/\/\*?$/, ''))) { // Path prefix match
            const remainingPath = pathname.substring(routePath.replace(/\/\*?$/, '').length).replace(/^\//, '');
            const childMatch = this._findMatchRecursive(route.children, remainingPath, ''); // Pass '' as basePath for children

            if (childMatch) {
                 // Combine params: child params take precedence for same names
                const combinedParams = { ...builder.extractParams(routePath), ...childMatch.params };
                return {
                    ...childMatch,
                    params: combinedParams,
                    pathname: `${routePath.replace(/\/\*?$/, '')}/${childMatch.pathname}`.replace(/\/\//g, '/'),
                    route: { // Merge parent and child route aspects (e.g. layout)
                        ...route, // Parent properties
                        ...childMatch.route, // Child properties (component, loader)
                        path: `${routePath}/${childMatch.route.path}`.replace(/\/\//g, '/'), // Full path to child
                        layout: childMatch.route.layout || route.layout, // Child layout overrides parent
                    },
                };
            }
        }
    }
    return null;
  }

  private _parseQuery(search: string): QueryParams {
    const params = new URLSearchParams(search);
    const query: QueryParams = {};
    params.forEach((value, key) => {
      const existing = query[key];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          query[key] = [existing, value];
        }
      } else {
        query[key] = value;
      }
    });
    return query;
  }

  private async _runGuards(match: RouteMatch): Promise<boolean> {
    const guards = match.route.guards || [];
    for (const guard of guards) {
      const canActivate = await guard.canActivate(match.params, match.query, match.route);
      if (!canActivate) {
        if (guard.onFail) {
          guard.onFail(match.params, match.query, match.route);
        }
        if (guard.redirectTo) {
          const redirectToPath = typeof guard.redirectTo === 'function'
            ? guard.redirectTo(match.params, match.query)
            : guard.redirectTo;
          this.navigate(redirectToPath, { replace: true }).catch(console.error); // Fire-and-forget redirect
        }
        return false;
      }
    }
    return true;
  }


  private _getLoaderConfig<T>(loaderInput: RouteLoaderInput<T>): Required<RouteLoaderConfig<T>> {
    if (typeof loaderInput === 'function') {
        return {
            loadFn: loaderInput,
            key: '', // Will be generated if empty
            staleTime: 30 * 1000,
            cacheTime: 5 * 60 * 1000,
            revalidateOnFocus: true,
        };
    }
    return {
        key: '', // Will be generated if empty
        staleTime: 30 * 1000,
        cacheTime: 5 * 60 * 1000,
        revalidateOnFocus: true,
        ...loaderInput,
    };
  }

  private _generateCacheKey(match: RouteMatch): string {
    // Ensure query parameters are consistently ordered for cache key generation
    const orderedQuery = Object.keys(match.query).sort().reduce((obj, key) => {
        obj[key] = match.query[key];
        return obj;
    }, {} as QueryParams);
    const searchString = new URLSearchParams(orderedQuery as Record<string, string>).toString();
    return `${match.pathname}${searchString ? `?${searchString}` : ''}`;
  }

  private getOrCreateLoaderSignal<T>(match: RouteMatch, forceFetch: boolean = false): Signal<RouteLoaderResult<T>> {
    const loaderInput = match.route.loader as RouteLoaderInput<T>;
    if (!loaderInput) {
        // Should not happen if called correctly, but good for type safety
        const resultSignal = signal<RouteLoaderResult<T>>({ data: null, loading: false, error: null, key: '' });
        return resultSignal;
    }

    const config = this._getLoaderConfig(loaderInput);
    const cacheKey = config.key || this._generateCacheKey(match);

    let entry = this.dataCache.get(cacheKey) as CacheEntry<T> | undefined;

    if (!entry) {
        entry = {
            data$: new BehaviorSubject<T | null>(null),
            loading$: new BehaviorSubject<boolean>(false),
            error$: new BehaviorSubject<Error | null>(null),
            timestamp: 0,
            staleTime: config.staleTime,
            cacheTime: config.cacheTime,
            revalidateOnFocus: config.revalidateOnFocus,
            loaderFn: config.loadFn,
            subscribers: 0,
            key: cacheKey
        };
        this.dataCache.set(cacheKey, entry);
    }

    entry.subscribers++;

    const resultSignal = signal<RouteLoaderResult<T>>({
        data: entry.data$.value,
        loading: entry.loading$.value,
        error: entry.error$.value,
        key: cacheKey,
    });

    const dataSub = entry.data$.subscribe(data => resultSignal.value = { ...resultSignal.value, data });
    const loadingSub = entry.loading$.subscribe(loading => resultSignal.value = { ...resultSignal.value, loading });
    const errorSub = entry.error$.subscribe(error => resultSignal.value = { ...resultSignal.value, error });

    // Effect to unsubscribe when signal is no longer used (conceptual, depends on signal library)
    // effect(() => {
    //   return () => { // Cleanup function of the effect
    //     entry.subscribers--;
    //     dataSub.unsubscribe();
    //     loadingSub.unsubscribe();
    //     errorSub.unsubscribe();
    //     if (entry.subscribers === 0 && (Date.now() - entry.timestamp) > entry.cacheTime) {
    //       // Optionally cleanup cache if no subscribers and past cacheTime
    //       // this.dataCache.delete(cacheKey);
    //     }
    //   };
    // });

    const now = Date.now();
    if (forceFetch || !entry.promise && (now - entry.timestamp > entry.staleTime || entry.error$.value)) {
        this._fetchLoaderData(cacheKey, entry, match.params, match.query);
    } else if (entry.promise && entry.loading$.value) { // It's already loading
        // just ensure loading state is propagated
        resultSignal.value = { ...resultSignal.value, loading: true };
    }


    return resultSignal;
  }

  private _fetchLoaderData<T>(key: string, entry: CacheEntry<T>, params?: RouteParams, query?: QueryParams): Promise<T> {
    entry.loading$.next(true);
    entry.error$.next(null);

    const fetchPromise = Promise.resolve(entry.loaderFn(params || {}, query || {}))
        .then(data => {
            entry.data$.next(data);
            entry.timestamp = Date.now();
            entry.loading$.next(false);
            delete entry.promise;
            return data;
        })
        .catch(err => {
            entry.error$.next(err);
            entry.loading$.next(false);
            delete entry.promise;
            throw err;
        });
    entry.promise = fetchPromise;
    return fetchPromise;
  }


  private handleLocationChange(fullPath: string, isInitialLoad: boolean = false): void {
    const url = new URL(fullPath, window.location.origin);
    const match = this._findMatchRecursive(this.routes, url.pathname);

    if (match) {
        match.query = this._parseQuery(url.search);
        match.hash = url.hash;
        match.fullPath = fullPath;
        match.search = url.search;


        // If it's not initial load and it's not a popstate that we already handled
        // then we need to update history stack. Popstate is handled by its own logic.
        // For initial load, we set it as the first entry.
        if (isInitialLoad) {
            this.historyIndex = 0;
             this._updateRouterState({ historyStack: [match] });
        }

        this.navigate(fullPath, { replace: isInitialLoad }).catch(console.error);
    } else {
        console.warn(`No route match for initial location: ${fullPath}`);
         this._updateRouterState({ currentRoute: null, navigationError: new Error(`No route match for ${fullPath}`) });
         this.currentRouteSignal.value = null;
    }
  }

  private _revalidateOnFocus(): void {
    const now = Date.now();
    this.dataCache.forEach((entry, key) => {
      if (entry.revalidateOnFocus && (now - entry.timestamp) > entry.staleTime && entry.subscribers > 0) {
        console.log(`Revalidating ${key} on focus.`);
        this._fetchLoaderData(key, entry); // Assuming currentRoute params are still valid or loader doesn't need them
      }
    });
  }

  private _cleanupExpiredCache(): void {
    const now = Date.now();
    this.dataCache.forEach((entry, key) => {
      if (entry.subscribers === 0 && (now - entry.timestamp) > entry.cacheTime) {
        console.log(`Cleaning up expired cache for ${key}`);
        entry.data$.complete();
        entry.loading$.complete();
        entry.error$.complete();
        this.dataCache.delete(key);
      }
    });
  }
}

// --- Singleton Router Instance & Exports (Example Usage) ---
// export const router = new ZenithRouter();

// Example:
// const routes: RouteDefinition[] = [
//   { path: '/', component: () => import('./pages/Home'), name: 'home' },
//   { path: '/users/:userId', component: () => import('./pages/User'), name: 'userProfile', loader: async (params) => fetch(`/api/users/${params.userId}`).then(res => res.json()) },
// ];
// router.register(routes);

// export const navigate = router.navigate.bind(router);
// export const back = router.back.bind(router);
// ... other exports