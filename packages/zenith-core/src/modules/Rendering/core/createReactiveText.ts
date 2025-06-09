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
 * Create a reactive text node that updates when signal changes
 */
export function createReactiveText(value: ReactiveValue<string | number>): Text {
  const textNode = document.createTextNode('');
  
  if (isSignal(value)) {
    effect(() => {
      textNode.textContent = String((value as Signal<any>).value);
    });
  } else if (typeof value === 'function') {
    effect(() => {
      textNode.textContent = String((value as () => any)());
    });
  } else {
    textNode.textContent = String(value);
  }
  
  return textNode;
}
