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
 * Enhanced reactive binding using signals
 */
function createSignalBinding<T>(
    element: HTMLElement,
    property: string,
    value: ReactiveValue<T>,
    transform?: (val: T) => string
): () => void {
  const signalManager = getSignalManager();
  const bindingId = `${element.tagName.toLowerCase()}-${property}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (isSignal(value)) {
    // Direct signal binding
    signalManager.bindToDOM(bindingId, element, property, value as Signal<T>, transform);
    return () => signalManager.removeDOMBinding(bindingId);
  } else if (typeof value === 'function') {
    // Create computed signal from function
    const computedSig = computed(value as () => T);
    signalManager.bindToDOM(bindingId, element, property, computedSig, transform);
    return () => {
      signalManager.removeDOMBinding(bindingId);
      computedSig.dispose();
    };
  } else {
    // Static value - set immediately
    const stringValue = transform ? transform(value as T) : String(value);
    if (property === 'textContent' || property === 'innerHTML') {
      (element as any)[property] = stringValue;
    } else {
      element.setAttribute(property, stringValue);
    }
    return () => {
    }; // No cleanup needed for static values
  }
}
