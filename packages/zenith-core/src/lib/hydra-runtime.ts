/**
 * Hydra Runtime - Core functions for hydrating Hydra components
 * 
 * These functions handle the actual loading and mounting of Hydra components
 * into the DOM, with support for both local Islands and remote WASM modules.
 */

import { DynamicManifestResolver } from '../core/DynamicManifestResolver';
import { verifySignature } from '../utils/ManifestAuth';
import { WasmLoader } from '../utils/WasmLoader';
import type { IslandComponent, IslandLoader, IslandRegistration } from '../modules/Rendering/types';

export interface HydraContext {
  peerId: string;
  zkProof?: string;
  message?: string;
  ecsEntity?: number;
  manifestUrl?: string;
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
  [key: string]: any;
}

export interface HydraManifest {
  id: string;
  version: string;
  entry: string;
  execType: 'local' | 'remote' | 'edge';
  trustLevel: 'unverified' | 'local' | 'community' | 'verified';
  zkRequirement?: boolean;
  dependencies?: string[];
  permissions?: string[];
  signature?: string;
  blake3?: string;
  sourceUrl?: string;
}

// Registry for loaded island components
const islandRegistry = new Map<string, IslandRegistration>();
const loadedManifests = new Map<string, HydraManifest>();
const manifestResolver = new DynamicManifestResolver({
  trustedDomains: ['localhost', 'zenith.dev', 'zenithos.dev'],
  maxPermissions: ['ecs:read', 'ecs:write', 'dom:read', 'dom:write', 'storage:read'],
  requiredContext: undefined
});

// Create hydration controller instance
import { HydrationController } from '../modules/Rendering/hydration-controller';
const hydrationController = new HydrationController(hydrateLocalHydra);

/**
 * Hydrates a local Island component into the specified DOM element
 * 
 * @param elementId - The DOM element ID where the component should be mounted
 * @param entry - The component entry point (e.g., "ECSCounterIsland")
 * @param context - Hydra context including peer ID and optional ZK proof
 */
export async function hydrateLocalHydra(
  elementId: string,
  entry: string,
  context: HydraContext
): Promise<void> {
  try {
    // Get the target DOM element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    console.log(`🌊 Hydrating local island "${entry}" into element "${elementId}"`, context);
    
    // Set loading state
    element.setAttribute('data-hydra-state', 'loading');
    
    let island: IslandRegistration | undefined;
    
    // Check if island is already registered
    if (islandRegistry.has(entry)) {
      island = islandRegistry.get(entry);
    } else {
      // Try to dynamically load the island
      island = await loadIslandComponent(entry);
      if (island) {
        islandRegistry.set(entry, island);
      }
    }
    
    if (!island) {
      throw new Error(`Island component "${entry}" not found`);
    }
    
    // Verify trust level if ZK proof is provided
    if (context.zkProof && island.trustLevel && island.trustLevel !== 'unverified') {
      const isValid = await verifyZKProof(context.zkProof, context.peerId);
      if (!isValid) {
        throw new Error(`ZK proof verification failed for island "${entry}"`);
      }
      console.log(`✅ ZK proof verified for island "${entry}"`);
    }
    
    // Extract props from element attributes or context
    const props = extractIslandProps(element, context);
    
    // Mount the island component
    const cleanup = await island.component.mount(element, props, context);
    
    // Store cleanup function for later if it exists
    if (typeof cleanup === 'function') {
      (element as any).__zkCleanup = cleanup;
    }
    
    // Set hydrated state
    element.setAttribute('data-hydra-state', 'hydrated');
    element.setAttribute('data-hydra-entry', entry);
    
    console.log(`✅ Successfully hydrated local island "${entry}"`);
    
  } catch (error) {
    console.error(`❌ Failed to hydrate local island "${entry}":`, error);
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('data-hydra-state', 'error');
      element.innerHTML = `<div class="hydra-error">Failed to load component: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
    throw error;
  }
}

/**
 * Dynamically loads an island component by name
 */
async function loadIslandComponent(name: string): Promise<IslandRegistration | undefined> {
  try {
    // Try to import the island module
    const modulePath = `../modules/Rendering/islands/${name}`;
    const module = await import(modulePath);
    
    if (module.default && typeof module.default === 'object') {
      const island = module.default as IslandComponent;
      const metadata = module.metadata || {};
      
      return {
        name,
        component: island,
        modulePath,
        ...metadata
      };
    }
    
    throw new Error(`Invalid island module structure for "${name}"`);
  } catch (error) {
    console.warn(`Failed to load island "${name}":`, error);
    return undefined;
  }
}

/**
 * Extracts props from DOM element data attributes and context
 */
function extractIslandProps(element: HTMLElement, context: HydraContext): any {
  const props: any = {};
  
  // Extract from data-zk-props attribute
  const propsAttr = element.getAttribute('data-zk-props');
  if (propsAttr) {
    try {
      Object.assign(props, JSON.parse(propsAttr));
    } catch (error) {
      console.warn('Failed to parse data-zk-props:', error);
    }
  }
  
  // Add context data
  if (context.ecsEntity) {
    props.entityId = context.ecsEntity;
  }
  
  return props;
}

/**
 * Verifies ZK proof using the VerifySystem
 */
async function verifyZKProof(zkProof: string, peerId: string): Promise<boolean> {
  try {
    // In a real implementation, this would call the VerifySystem
    // For now, we'll simulate verification based on proof format
    if (!zkProof || zkProof.length < 10) {
      return false;
    }
    
    // Simulate async verification delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // For demo purposes, accept proofs that start with 'zk:'
    return zkProof.startsWith('zk:');
  } catch (error) {
    console.error('ZK proof verification failed:', error);
    return false;
  }
}

/**
 * Helper function for testing - creates a test component structure
 */
function createTestComponentHTML(context: HydraContext): string {
  const timestamp = Date.now();
  
  return `
    <div data-testid="test-hydra-component" class="test-hydra-component">
      <h3>Hydrated Component</h3>
      <p data-testid="hydra-message">Message: ${context.message || 'Hello from Hydra!'}</p>
      <p data-testid="hydra-peer">From Peer: ${context.peerId}</p>
      <p data-testid="hydra-timestamp">Timestamp: ${timestamp}</p>
      <div data-testid="hydra-status" class="hydra-status">
        ✅ Successfully Hydrated
      </div>
    </div>
  `;
}

/**
 * Hydrates a remote WASM-based component into the specified DOM element
 * 
 * @param elementId - The DOM element ID where the component should be mounted
 * @param entry - The WASM module entry point or manifest reference
 * @param context - Hydra context including peer ID and optional ZK proof
 */
export async function hydrateRemoteHydra(
  elementId: string,
  entry: string,
  context: HydraContext
): Promise<void> {
  try {
    // Get the target DOM element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    console.log(`🌐 Hydrating remote component "${entry}" into element "${elementId}"`, context);
    
    // Set loading state
    element.setAttribute('data-hydra-state', 'loading');
    
    let manifest: HydraManifest;
    
    // Check if we have a manifest URL in context
    if (context.manifestUrl) {
      manifest = await fetchManifest(context.manifestUrl);
    } else {
      // Try to resolve manifest from entry name
      manifest = await resolveManifest(entry);
    }
    
    // Verify manifest signature if present
    if (manifest.signature) {
      const isValid = await verifyManifestSignature(manifest);
      if (!isValid) {
        throw new Error(`Invalid manifest signature for "${entry}"`);
      }
    }
    
    // Check ZK requirements
    if (manifest.zkRequirement && !context.zkProof) {
      throw new Error(`ZK proof required but not provided for "${entry}"`);
    }
    
    // Hydrate the WASM component
    await hydrateWasmComponent(element, manifest, context);
    
    // Set hydrated state
    element.setAttribute('data-hydra-state', 'hydrated');
    element.setAttribute('data-hydra-entry', entry);
    
  } catch (error) {
    console.error(`❌ Failed to hydrate remote component "${entry}":`, error);
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('data-hydra-state', 'error');
      element.innerHTML = `<div class="hydra-error">Failed to load component: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
    throw error;
  }
}

/**
 * Loads and executes a WASM component
 */
async function hydrateWasmComponent(
  element: HTMLElement,
  manifest: HydraManifest,
  context: HydraContext
): Promise<void> {
  try {
    const sandbox: WebAssembly.Imports = {
      env: {
        createElement: (tagName: string) => document.createElement(tagName),
        createTextNode: (text: string) => document.createTextNode(text),
        appendChild: (child: Node) => element.appendChild(child),
        removeChild: (child: Node) => element.removeChild(child),
        addEventListener: (type: string, listener: EventListener) => 
          element.addEventListener(type, listener),
        removeEventListener: (type: string, listener: EventListener) => 
          element.removeEventListener(type, listener),
        getContext: () => context,
        log: (...args: any[]) => console.log('[WASM]', ...args),
        warn: (...args: any[]) => console.warn('[WASM]', ...args),
        error: (...args: any[]) => console.error('[WASM]', ...args),
        memory: new WebAssembly.Memory({ initial: 1 })
      }
    };

    const exports = await WasmLoader.load(manifest.entry, sandbox);
    
    // Initialize the WASM module if it has an init function
    if (exports.init && typeof exports.init === 'function') {
      await exports.init();
    }
    
    console.log(`✅ Successfully hydrated WASM component "${manifest.entry}"`);
  } catch (error) {
    console.error(`❌ Failed to hydrate WASM component "${manifest.entry}":`, error);
    throw error;
  }
}

/**
 * Cleans up a hydrated component and resets the element
 * 
 * @param elementId - The DOM element ID to clean up
 */
export async function cleanupHydra(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (element) {
    // Call cleanup function if it exists
    const cleanup = (element as any).__zkCleanup;
    if (cleanup && typeof cleanup === 'function') {
      try {
        await cleanup();
      } catch (error) {
        console.warn(`Cleanup function failed for ${elementId}:`, error);
      }
    }
    
    // Reset element state
    element.innerHTML = '';
    element.removeAttribute('data-hydra-state');
    element.removeAttribute('data-hydra-entry');
    
    // Remove cleanup function reference
    delete (element as any).__zkCleanup;
    
    console.log(`🧽 Cleaned up Hydra component in element "${elementId}"`);
  }
}

/**
 * Fetches a manifest from a URL
 */
async function fetchManifest(url: string): Promise<HydraManifest> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
    }
    
    const manifest = await response.json() as HydraManifest;
    manifest.sourceUrl = url;
    return manifest;
  } catch (error) {
    throw new Error(`Failed to fetch manifest from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Resolves a manifest using the DynamicManifestResolver
 */
async function resolveManifest(entry: string): Promise<HydraManifest> {
  try {
    const manifest = await manifestResolver.resolve(entry) as HydraManifest;
    loadedManifests.set(entry, manifest);
    return manifest;
  } catch (error) {
    throw new Error(`Failed to resolve manifest for ${entry}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies a manifest signature
 */
async function verifyManifestSignature(manifest: HydraManifest): Promise<boolean> {
  try {
    if (!manifest.signature) {
      return false;
    }
    
    // In a real implementation, this would use actual public keys
    // For now, we'll simulate signature verification
    const isValid = await verifySignature(manifest, new Uint8Array(32));
    return isValid;
  } catch (error) {
    console.error('Manifest signature verification failed:', error);
    return false;
  }
}

/**
 * Gets a registered island component
 */
export function getRegisteredIsland(name: string): IslandRegistration | undefined {
  return islandRegistry.get(name);
}

/**
 * Registers an island component manually
 */
export function registerIsland(registration: IslandRegistration): void {
  islandRegistry.set(registration.name, registration);
  console.log(`🏝️ Registered island: ${registration.name}`);
}

export function getRegisteredIslands(): string[] {
  return Array.from(islandRegistry.keys());
}

export function unregisterIsland(name: string): void {
  islandRegistry.delete(name);
}

export function discoverIslands(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[data-hydra-entry]'));
}

export async function autoHydrateIslands(): Promise<void> {
  const islands = discoverIslands();
  for (const element of islands) {
    const islandName = element.getAttribute('data-hydra-entry');
    const strategy = element.getAttribute('data-hydra-strategy') as 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual' || 'visible';
    const contextAttr = element.getAttribute('data-zk-context');
    if (!islandName) continue;
    
    let context: HydraContext = { peerId: 'auto-hydration' };
    if (contextAttr) {
      try {
        context = JSON.parse(contextAttr);
      } catch (error) {
        console.warn('Failed to parse island context:', error);
      }
    }

    // Queue hydration with the appropriate strategy
    hydrationController.queueHydration(element, islandName, context, strategy);
  }
}