import {
  useState as reactiveUseState,
  useRef as reactiveUseRef,
  useEffect,
  useMemo,
  useCallback,
  initializeComponent,
  withComponent,
  getComponentInstance,
  cleanupComponent,
  bindStateToAttribute,
  bindStateToText,
  bindStateToClass,
  bindStateToStyle,
  type ComponentInstance
} from '../../core/reactive-state';import {
  Signal,
  signal,
  computed,
  effect,
  isSignal,
  resolve,
  type MaybeSignal
} from '../../core/signals';import {getSignalManager, SignalManager} from '../../core/SignalManager';



/**
 * Cleanup function for JSX elements
 */
export function cleanup(element: HTMLElement): void {
  // Cleanup JSX reactive bindings
  if ((element as any).__jsxCleanup) {
    (element as any).__jsxCleanup();
  }
  
  // Cleanup signal-based reactive bindings
  if ((element as any).__signalCleanup) {
    (element as any).__signalCleanup();
  }
  
  // Cleanup legacy reactive-state bindings
  cleanupComponent(element);
  
  // Recursively cleanup children
  const children = element.querySelectorAll('*');
  children.forEach(child => {
    if (child instanceof HTMLElement) {
      cleanup(child);
    }
  });
}
