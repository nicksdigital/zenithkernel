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
 * Create CSS component
 */
function createCSSComponent(props: CSSProps, children: Children): HTMLElement {
  if (props.href) {
    // External stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = props.href;
    
    if (props.media) {
      link.media = props.media;
    }
    
    if (props.integrity) {
      link.integrity = props.integrity;
    }
    
    if (props.crossorigin) {
      link.crossOrigin = props.crossorigin;
    }
    
    return link;
  } else {
    // Inline styles
    const style = document.createElement('style');
    
    if (props.media) {
      style.media = props.media;
    }
    
    if (children) {
      const content = flattenChildren(children);
      style.textContent = content;
    }
    
    return style;
  }
}
