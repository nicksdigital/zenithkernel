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
 * Create secure script component
 */
function createSafeScriptComponent(props: SafeScriptProps, children: Children): HTMLElement {
  const {
    type = 'on_load',
    src,
    integrity,
    crossorigin,
    nonce,
    async: isAsync,
    defer,
    ...attrs
  } = props;
  
  const script = document.createElement('script');
  
  // Set script type based on loading strategy
  script.setAttribute('data-script-type', type);
  
  if (src) {
    script.src = src;
    
    // Security attributes
    if (integrity) {
      script.integrity = integrity;
    }
    
    if (crossorigin) {
      script.crossOrigin = crossorigin;
    }
    
    if (nonce) {
      script.nonce = nonce;
    }
    
    if (isAsync) {
      script.async = true;
    }
    
    if (defer) {
      script.defer = true;
    }
  }
  
  // Add inline script content
  if (children) {
    const content = flattenChildren(children);
    if (content.trim()) {
      script.textContent = content;
    }
  }
  
  // Apply additional attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined) {
      script.setAttribute(key, String(value));
    }
  }
  
  return script;
}
