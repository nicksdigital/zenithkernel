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
 * Hydra-specific utility functions
 */
export const hydra = {
  /**
   * Create a Hydra island programmatically
   */
  createIsland(
    id: string,
    entry: string,
    options: Partial<HydraProps> = {}
  ): HTMLElement {
    return jsx('Hydra', {
      type: 'island',
      id,
      entry,
      execType: 'local',
      ...options
    }) as HTMLElement;
  },
  
  /**
   * Create a meta tag set
   */
  createMeta(props: MetaProps): DocumentFragment {
    return createMetaComponent(props);
  },
  
  /**
   * Create a secure script
   */
  createScript(
    content: string,
    options: Partial<SafeScriptProps> = {}
  ): HTMLElement {
    return jsx('safeScript', options, content) as HTMLElement;
  }
};
