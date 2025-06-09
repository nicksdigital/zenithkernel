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



function applyStyles(element: HTMLElement, styleValue: any): void {
  if (typeof styleValue === 'string') {
    element.setAttribute('style', styleValue);
  } else if (styleValue && typeof styleValue === 'object') {
    for (const [property, val] of Object.entries(styleValue)) {
      if (val != null) {
        const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        element.style.setProperty(cssProperty, String(val));
      } else {
        const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        element.style.removeProperty(cssProperty);
      }
    }
  }
}
