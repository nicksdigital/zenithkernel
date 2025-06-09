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
 * Flatten children array to text content
 */
function flattenChildren(children: Children): string {
  if (children == null || typeof children === 'boolean') {
    return '';
  }
  
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  
  if (Array.isArray(children)) {
    return children.map(flattenChildren).join('');
  }
  
  return '';
}
