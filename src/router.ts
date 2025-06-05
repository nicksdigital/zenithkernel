import { navigate, back, forward, prefetch, getRouterState, getCurrentRoute, getRouterStateSignal, getCurrentRouteSignal } from './utils/router-utils';

export { navigate, back, forward, prefetch };

// Export reactive state
export const routerState$ = getRouterState();
export const currentRoute$ = getCurrentRoute();
export const routerStateSignal = getRouterStateSignal();
export const currentRouteSignal = getCurrentRouteSignal();
