import { jsx } from '../../modules/Rendering/jsx-runtime';
import { hydrateLocalHydra, hydrateRemoteHydra, cleanupHydra, HydraContext } from '../../lib/hydra-runtime';

export interface HydraLoaderProps {
  /** Unique identifier for this Hydra instance */
  id: string;
  /** Context data passed to the hydrated component */
  context: HydraContext;
  /** Where to execute the component: local React, remote WASM, or edge computing */
  execType: 'local' | 'remote' | 'edge';
  /** Entry point for the component (file path or module name) */
  entry: string;
  /** Hydration strategy - when to hydrate the component */
  strategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
  /** Custom props to pass to the island component */
  props?: Record<string, any>;
}

export type HydraState = 'loading' | 'hydrated' | 'error';

/**
 * HydraLoader - Core component for loading and rendering Hydra components
 * 
 * This component creates a placeholder div and handles the hydration process
 * for both local Island components and remote WASM-based components.
 */
export function HydraLoader(props: HydraLoaderProps) {
  const {
    id,
    context,
    execType,
    entry,
    strategy = 'immediate',
    props: customProps = {}
  } = props;

  const elementId = `hydra-${id}`;
  
  // Create the container element
  const container = jsx('div', {
    id: elementId,
    'data-testid': elementId,
    'data-hydra-id': id,
    'data-hydra-state': 'loading',
    'data-hydra-exec-type': execType,
    'data-hydra-entry': entry,
    'data-hydra-strategy': strategy,
    className: 'hydra-container hydra-loading',
    children: [
      jsx('div', {
        className: 'hydra-loading',
        style: { 
          padding: '16px', 
          textAlign: 'center', 
          backgroundColor: '#f5f5f5', 
          border: '1px dashed #ccc',
          borderRadius: '4px'
        },
        children: [
          jsx('div', { className: 'loading-spinner', children: '🌊' }),
          jsx('p', { children: 'Loading Hydra component...' }),
          jsx('small', { children: `Entry: ${entry} | Type: ${execType}` })
        ]
      })
    ]
  });

  // Start hydration process
  const hydrateComponent = async () => {
    try {
      // Choose hydration method based on execution type
      if (execType === 'local') {
        await hydrateLocalHydra(elementId, entry, context);
      } else if (execType === 'remote' || execType === 'edge') {
        await hydrateRemoteHydra(elementId, entry, context);
      } else {
        throw new Error(`Unsupported execution type: ${execType}`);
      }
      
      // Update state after successful hydration
      const element = document.getElementById(elementId);
      if (element) {
        element.setAttribute('data-hydra-state', 'hydrated');
        element.classList.remove('hydra-loading');
        element.classList.add('hydra-hydrated');
      }
    } catch (err) {
      console.error('Hydration failed:', err);
      const element = document.getElementById(elementId);
      if (element) {
        element.setAttribute('data-hydra-state', 'error');
        element.classList.remove('hydra-loading');
        element.classList.add('hydra-error');
        element.innerHTML = `
          <div class="hydra-error" style="padding: 16px; text-align: center; background-color: #fee; border: 1px solid #fcc; border-radius: 4px; color: #c00;">
            <div class="error-icon">❌</div>
            <p>Failed to load Hydra component</p>
            <details>
              <summary>Error Details</summary>
              <code>${err instanceof Error ? err.message : 'Unknown error occurred'}</code>
            </details>
            <small>Entry: ${entry} | Type: ${execType}</small>
          </div>
        `;
      }
    }
  };

  // Handle different hydration strategies
  if (strategy === 'immediate') {
    // Use requestAnimationFrame to ensure the element is in the DOM
    requestAnimationFrame(() => {
      hydrateComponent();
    });
  } else if (strategy === 'manual') {
    // Manual hydration - don't hydrate automatically
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="hydra-manual" style="padding: 16px; text-align: center; background-color: #fff8dc; border: 1px dashed #deb887; border-radius: 4px;">
          <div class="manual-icon">⏸️</div>
          <p>Manual hydration required</p>
          <small>Entry: ${entry} | Type: ${execType}</small>
        </div>
      `;
    }
  } else {
    // For other strategies, set up the element for auto-hydration
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('data-zk-island', entry);
      element.setAttribute('data-zk-strategy', strategy);
      element.setAttribute('data-zk-context', JSON.stringify(context));
      if (Object.keys(customProps).length > 0) {
        element.setAttribute('data-zk-props', JSON.stringify(customProps));
      }
    }
  }

  return container;
}

/**
 * Manually trigger hydration for a HydraLoader component
 * Useful for components with strategy='manual'
 */
export async function triggerHydration(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }
  
  const entry = element.getAttribute('data-hydra-entry');
  const execType = element.getAttribute('data-hydra-exec-type') as 'local' | 'remote' | 'edge';
  const contextAttr = element.getAttribute('data-zk-context');
  
  if (!entry || !execType) {
    throw new Error('Missing hydration data on element');
  }
  
  let context: HydraContext = { peerId: 'manual-trigger' };
  if (contextAttr) {
    try {
      context = JSON.parse(contextAttr);
    } catch (error) {
      console.warn('Failed to parse context for manual hydration:', error);
    }
  }
  
  if (execType === 'local') {
    await hydrateLocalHydra(elementId, entry, context);
  } else {
    await hydrateRemoteHydra(elementId, entry, context);
  }
}
