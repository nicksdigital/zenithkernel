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
 * Append a single child to an element
 */
function appendChild(element: HTMLElement, child: Children): void {
  if (child == null || typeof child === 'boolean') {
    return;
  }
  
  if (typeof child === 'string' || typeof child === 'number') {
    element.appendChild(document.createTextNode(String(child)));
    return;
  }
  
  if (child instanceof HTMLElement || child instanceof DocumentFragment) {
    element.appendChild(child);
    return;
  }
  
  if (Array.isArray(child)) {
    child.forEach(grandChild => appendChild(element, grandChild));
    return;
  }
  
  // Handle signals as text content
  if (isSignal(child)) {
    const textNode = document.createTextNode('');
    element.appendChild(textNode);
    
    // Create reactive binding for text content
    effect(() => {
      textNode.textContent = String((child as Signal<any>).value);
    });
    
    return;
  }
}
