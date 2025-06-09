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
 * Create Hydra island component
 */
function createHydraComponent(props: HydraProps, children: Children): HTMLElement {
  const {
    type,
    id,
    entry,
    execType,
    context = {},
    strategy = 'immediate',
    trustLevel = 'local',
    zkProof,
    manifestUrl,
    props: componentProps = {},
    ...attrs
  } = props;
  
  const element = document.createElement('div');
  element.className = 'hydra-island';
  element.setAttribute('data-hydra-id', id);
  element.setAttribute('data-hydra-entry', entry);
  element.setAttribute('data-hydra-exec-type', execType);
  element.setAttribute('data-hydra-strategy', strategy);
  element.setAttribute('data-hydra-trust-level', trustLevel);
  
  if (zkProof) {
    element.setAttribute('data-hydra-zk-proof', zkProof);
  }
  
  if (manifestUrl) {
    element.setAttribute('data-hydra-manifest', manifestUrl);
  }
  
  // Store hydration context and props
  (element as any).__hydraContext = context;
  (element as any).__hydraProps = componentProps;
  
  // Apply additional attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined) {
      element.setAttribute(key, String(value));
    }
  }
  
  // Add children as fallback content
  appendChildren(element, children);
  
  // Mark for hydration by the Hydra runtime
  element.setAttribute('data-hydra-state', 'pending');
  
  return element;
}
