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
 * Create meta component for page metadata
 */
function createMetaComponent(props: MetaProps): DocumentFragment {
  const fragment = document.createDocumentFragment();
  
  // Create title element
  if (props.title) {
    const titleElement = document.createElement('title');
    titleElement.textContent = props.title;
    fragment.appendChild(titleElement);
  }
  
  // Create meta tags
  const metaTags: Array<[string, string]> = [];
  
  if (props.description) {
    metaTags.push(['name', 'description'], ['content', props.description]);
  }
  
  if (props.keywords) {
    metaTags.push(['name', 'keywords'], ['content', props.keywords.join(', ')]);
  }
  
  if (props.author) {
    metaTags.push(['name', 'author'], ['content', props.author]);
  }
  
  if (props.viewport) {
    metaTags.push(['name', 'viewport'], ['content', props.viewport]);
  }
  
  // OpenGraph tags
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('og:') && value) {
      metaTags.push(['property', key], ['content', String(value)]);
    }
    if (key.startsWith('twitter:') && value) {
      metaTags.push(['name', key], ['content', String(value)]);
    }
  }
  
  // Create meta elements in pairs
  for (let i = 0; i < metaTags.length; i += 2) {
    const metaElement = document.createElement('meta');
    metaElement.setAttribute(metaTags[i][0], metaTags[i][1]);
    metaElement.setAttribute(metaTags[i + 1][0], metaTags[i + 1][1]);
    fragment.appendChild(metaElement);
  }
  
  // Layout meta tag
  if (props.layout) {
    const layoutMeta = document.createElement('meta');
    layoutMeta.setAttribute('name', 'layout');
    layoutMeta.setAttribute('content', props.layout);
    fragment.appendChild(layoutMeta);
  }
  
  return fragment;
}
