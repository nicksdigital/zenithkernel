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
 * Create a signal-based reactive component with SignalManager integration
 */
function createSignalReactiveComponent(
    Component: (props: any) => HTMLElement | DocumentFragment,
    props: any
): HTMLElement | DocumentFragment {
  const {ecsEntity, ecsManager, signalId, hydraId, signal: enableSignals, ...componentProps} = props;
  const signalManager = getSignalManager();

  // Create wrapper element
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-signal-component', 'true');
  if (signalId) wrapper.setAttribute('data-signal-id', signalId);
  if (hydraId) wrapper.setAttribute('data-hydra-id', hydraId);

  // Create or get Hydra context for signal management
  let hydraContext;
  if (hydraId) {
    try {
      hydraContext = signalManager.createHydraContext(hydraId);
    } catch {
      // Context already exists, get signals
      hydraContext = {signals: signalManager.getHydraSignals(hydraId)};
    }
  }

  // Initialize legacy component instance for backward compatibility
  const componentInstance = initializeComponent(wrapper, ecsEntity, ecsManager);

  // Render component with signal context
  const result = withComponent(componentInstance, () => {
    return Component(componentProps);
  });

  // Handle result and apply signal reactivity
  let targetElement: HTMLElement;
  if (result instanceof DocumentFragment) {
    wrapper.appendChild(result);
    targetElement = wrapper;
  } else if (result instanceof HTMLElement) {
    targetElement = result;
    targetElement.setAttribute('data-signal-component', 'true');
    if (signalId) targetElement.setAttribute('data-signal-id', signalId);
    if (hydraId) targetElement.setAttribute('data-hydra-id', hydraId);
  } else {
    targetElement = wrapper;
  }

  // Setup cleanup for signals when component unmounts
  const cleanup = () => {
    if (hydraId) {
      signalManager.cleanupHydraContext(hydraId);
    }
    cleanupComponent(targetElement);
  };

  // Store cleanup function
  (targetElement as any).__signalCleanup = cleanup;

  return targetElement;
}
