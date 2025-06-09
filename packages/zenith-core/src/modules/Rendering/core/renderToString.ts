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
 * Render JSX to string (for SSR)
 */
export function renderToString(element: HTMLElement | DocumentFragment): string {
  if (element instanceof DocumentFragment) {
    const div = document.createElement('div');
    div.appendChild(element.cloneNode(true));
    return div.innerHTML;
  }
  
  return element.outerHTML;
}
