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
 * Enhanced class binding with signal support
 */
function createSignalClassBinding(
    element: HTMLElement,
    value: ReactiveClass
): () => void {
  const signalManager = getSignalManager();
  const bindingId = `${element.tagName.toLowerCase()}-class-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (isSignal(value)) {
    signalManager.bindClassList(bindingId, element, value as Signal<any>);
    return () => signalManager.removeDOMBinding(bindingId);
  } else if (typeof value === 'function') {
    const computedSig = computed(value as () => any);
    signalManager.bindClassList(bindingId, element, computedSig);
    return () => {
      signalManager.removeDOMBinding(bindingId);
      computedSig.dispose();
    };
  } else {
    // Static class value
    if (typeof value === 'string') {
      element.className = value;
    } else if (Array.isArray(value)) {
      element.className = value.filter(Boolean).join(' ');
    } else if (value && typeof value === 'object') {
      const classes: string[] = [];
      for (const [className, condition] of Object.entries(value)) {
        if (condition) classes.push(className);
      }
      element.className = classes.join(' ');
    }
    return () => {
    };
  }
}
