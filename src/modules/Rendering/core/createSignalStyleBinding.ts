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
 * Enhanced style binding with signal support
 */
function createSignalStyleBinding(
    element: HTMLElement,
    value: ReactiveStyle
): () => void {
  if (isSignal(value)) {
    return effect(() => {
      const styleValue = (value as Signal<any>).value;
      applyStyles(element, styleValue);
    }).dispose;
  } else if (typeof value === 'function') {
    return effect(() => {
      const styleValue = (value as () => any)();
      applyStyles(element, styleValue);
    }).dispose;
  } else {
    applyStyles(element, value as any);
    return () => {
    };
  }
}
