/**
 * Tests for the enhanced Hydra Runtime system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  hydrateLocalHydra,
  hydrateRemoteHydra,
  cleanupHydra,
  registerIsland,
  unregisterIsland,
  getRegisteredIsland,
  getRegisteredIslands,
  discoverIslands,
  autoHydrateIslands,
  HydraContext,
  HydraManifest
} from '../../src/lib/hydra-runtime';

// Mock DOM environment
Object.defineProperty(window, 'requestIdleCallback', {
  value: vi.fn((callback) => setTimeout(callback, 0)),
  writable: true
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(public callback: Function, public options?: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true
});

describe('Enhanced Hydra Runtime', () => {
  beforeEach(() => {
	document.body.innerHTML = '';
	vi.clearAllMocks();
  });

  afterEach(() => {
	document.body.innerHTML = '';
  });

  describe('Island Registration', () => {
	it('should register and retrieve islands', () => {
	  const mockIsland = {
		name: 'TestIsland',
		component: {
		  mount: vi.fn(),
		  unmount: vi.fn()
		},
		trustLevel: 'local' as const,
		execType: 'local' as const
	  };

	  registerIsland(mockIsland);
	  
	  const retrieved = getRegisteredIsland('TestIsland');
	  expect(retrieved).toBeDefined();
	  expect(retrieved?.name).toBe('TestIsland');
	  
	  const allIslands = getRegisteredIslands();
	  expect(allIslands).toContain('TestIsland');
	});

	it('should unregister islands', () => {
	  const mockIsland = {
		name: 'TestIsland',
		component: {
		  mount: vi.fn()
		}
	  };

	  registerIsland(mockIsland);
	  expect(getRegisteredIsland('TestIsland')).toBeDefined();
	  
	  unregisterIsland('TestIsland');
	  expect(getRegisteredIsland('TestIsland')).toBeUndefined();
	});
  });

  describe('Local Hydration', () => {
	it('should hydrate a registered local island', async () => {
	  // Create test element
	  const element = document.createElement('div');
	  element.id = 'test-element';
	  document.body.appendChild(element);

	  // Mock island component
	  const mockMount = vi.fn().mockResolvedValue(() => {});
	  const mockIsland = {
		name: 'TestIsland',
		component: {
		  mount: mockMount
		},
		trustLevel: 'local' as const,
		execType: 'local' as const
	  };

	  registerIsland(mockIsland);

	  const context: HydraContext = {
		peerId: 'test-peer',
		message: 'Hello Test'
	  };

	  await hydrateLocalHydra('test-element', 'TestIsland', context);

	  expect(mockMount).toHaveBeenCalledWith(
		element,
		expect.any(Object),
		context
	  );
	  expect(element.getAttribute('data-hydra-state')).toBe('hydrated');
	  expect(element.getAttribute('data-hydra-entry')).toBe('TestIsland');
	});

	it('should handle ZK proof verification', async () => {
	  const element = document.createElement('div');
	  element.id = 'test-zk-element';
	  document.body.appendChild(element);

	  const mockIsland = {
		name: 'SecureIsland',
		component: {
		  mount: vi.fn().mockResolvedValue(() => {})
		},
		trustLevel: 'verified' as const,
		execType: 'local' as const
	  };

	  registerIsland(mockIsland);

	  const contextWithValidProof: HydraContext = {
		peerId: 'test-peer',
		zkProof: 'zk:valid-proof-data' // Valid proof format
	  };

	  await expect(hydrateLocalHydra('test-zk-element', 'SecureIsland', contextWithValidProof))
		.resolves.not.toThrow();

	  const contextWithInvalidProof: HydraContext = {
		peerId: 'test-peer',
		zkProof: 'invalid-proof' // Invalid proof format
	  };

	  await expect(hydrateLocalHydra('test-zk-element', 'SecureIsland', contextWithInvalidProof))
		.rejects.toThrow('ZK proof verification failed');
	});

	it('should handle missing islands gracefully', async () => {
	  const element = document.createElement('div');
	  element.id = 'missing-element';
	  document.body.appendChild(element);

	  const context: HydraContext = {
		peerId: 'test-peer'
	  };

	  await expect(hydrateLocalHydra('missing-element', 'NonExistentIsland', context))
		.rejects.toThrow('Island component "NonExistentIsland" not found');

	  expect(element.getAttribute('data-hydra-state')).toBe('error');
	  expect(element.innerHTML).toContain('Failed to load component');
	});
  });

  describe('Remote Hydration', () => {
	it('should handle manifest resolution and verification', async () => {
	  const element = document.createElement('div');
	  element.id = 'remote-element';
	  document.body.appendChild(element);

	  // Mock fetch for manifest
	  global.fetch = Object.assign(
		vi.fn().mockResolvedValue({
		  ok: true,
		  json: () => Promise.resolve({
			id: 'RemoteComponent',
			version: '1.0.0',
			entry: 'RemoteComponent.wasm',
			execType: 'remote',
			trustLevel: 'verified',
			zkRequirement: false
		  } as HydraManifest)
		}),
		{ preconnect: vi.fn() }
	  );

	  const context: HydraContext = {
		peerId: 'test-peer',
		manifestUrl: 'https://example.com/manifest.json'
	  };

	  // This should attempt to load the manifest and then fail at WASM loading
	  // which is expected since we don't have a real WASM loader
	  await expect(hydrateRemoteHydra('remote-element', 'RemoteComponent', context))
		.rejects.toThrow();

	  expect(global.fetch).toHaveBeenCalledWith('https://example.com/manifest.json');
	});

	it('should enforce ZK requirements for remote components', async () => {
	  const element = document.createElement('div');
	  element.id = 'secure-remote-element';
	  document.body.appendChild(element);

	  global.fetch = Object.assign(
		vi.fn().mockResolvedValue({
		  ok: true,
		  json: () => Promise.resolve({
			id: 'SecureRemoteComponent',
			version: '1.0.0',
			entry: 'SecureComponent.wasm',
			execType: 'remote',
			trustLevel: 'verified',
			zkRequirement: true // Requires ZK proof
		  } as HydraManifest)
		}),
		{ preconnect: vi.fn() }
	  );

	  const contextWithoutProof: HydraContext = {
		peerId: 'test-peer',
		manifestUrl: 'https://example.com/secure-manifest.json'
	  };

	  await expect(hydrateRemoteHydra('secure-remote-element', 'SecureComponent', contextWithoutProof))
		.rejects.toThrow('ZK proof required but not provided');
	});
  });

  describe('Island Discovery and Auto-Hydration', () => {
	it('should discover islands in the DOM', () => {
	  // Create test islands
	  const island1 = document.createElement('div');
	  island1.setAttribute('data-hydra-entry', 'Island1');
	  island1.setAttribute('data-zk-strategy', 'immediate');
	  
	  const island2 = document.createElement('div');
	  island2.setAttribute('data-hydra-entry', 'Island2');
	  island2.setAttribute('data-zk-strategy', 'visible');
	  
	  const notAnIsland = document.createElement('div');
	  notAnIsland.className = 'regular-component';
	  
	  document.body.appendChild(island1);
	  document.body.appendChild(island2);
	  document.body.appendChild(notAnIsland);
	  
	  const discoveredIslands = discoverIslands();
	  
	  expect(discoveredIslands).toHaveLength(2);
	  expect(discoveredIslands[0]).toBe(island1);
	  expect(discoveredIslands[1]).toBe(island2);
	});

	it('should handle different hydration strategies', async () => {
	  // Register a test island
	  const mockIsland = {
		name: 'StrategyTestIsland',
		component: {
		  mount: vi.fn().mockResolvedValue(() => {})
		},
		trustLevel: 'local' as const,
		execType: 'local' as const
	  };
	  registerIsland(mockIsland);

	  // Create elements with different strategies
	  const immediateElement = document.createElement('div');
	  immediateElement.id = 'immediate-island';
	  immediateElement.setAttribute('data-hydra-entry', 'StrategyTestIsland');
	  immediateElement.setAttribute('data-zk-strategy', 'immediate');
	  immediateElement.setAttribute('data-zk-context', JSON.stringify({ peerId: 'test' }));
	  
	  const manualElement = document.createElement('div');
	  manualElement.id = 'manual-island';
	  manualElement.setAttribute('data-hydra-entry', 'StrategyTestIsland');
	  manualElement.setAttribute('data-zk-strategy', 'manual');
	  manualElement.setAttribute('data-zk-context', JSON.stringify({ peerId: 'test' }));
	  
	  document.body.appendChild(immediateElement);
	  document.body.appendChild(manualElement);
	  
	  await autoHydrateIslands();
	  
	  // Immediate strategy should hydrate automatically
	  expect(mockIsland.component.mount).toHaveBeenCalledWith(
		immediateElement,
		expect.any(Object),
		expect.objectContaining({ peerId: 'test' })
	  );
	  
	  // Manual strategy should not hydrate automatically
	  expect(manualElement.getAttribute('data-hydra-state')).not.toBe('hydrated');
	});
  });

  describe('Cleanup', () => {
	it('should properly cleanup hydrated components', async () => {
	  const element = document.createElement('div');
	  element.id = 'cleanup-test';
	  document.body.appendChild(element);

	  const mockCleanup = vi.fn();
	  const mockIsland = {
		name: 'CleanupTestIsland',
		component: {
		  mount: vi.fn().mockResolvedValue(mockCleanup)
		}
	  };

	  registerIsland(mockIsland);

	  const context: HydraContext = {
		peerId: 'test-peer'
	  };

	  await hydrateLocalHydra('cleanup-test', 'CleanupTestIsland', context);
	  
	  // Verify element was hydrated
	  expect(element.getAttribute('data-hydra-state')).toBe('hydrated');
	  
	  // Cleanup
	  await cleanupHydra('cleanup-test');
	  
	  // Verify cleanup was called
	  expect(mockCleanup).toHaveBeenCalled();
	  
	  // Verify element was reset
	  expect(element.innerHTML).toBe('');
	  expect(element.getAttribute('data-hydra-state')).toBeNull();
	  expect(element.getAttribute('data-hydra-entry')).toBeNull();
	});
  });

  describe('Error Handling', () => {
	it('should handle island mount errors gracefully', async () => {
	  const element = document.createElement('div');
	  element.id = 'error-test';
	  document.body.appendChild(element);

	  const mockIsland = {
		name: 'ErrorIsland',
		component: {
		  mount: vi.fn().mockRejectedValue(new Error('Mount failed'))
		}
	  };

	  registerIsland(mockIsland);

	  const context: HydraContext = {
		peerId: 'test-peer'
	  };

	  await expect(hydrateLocalHydra('error-test', 'ErrorIsland', context))
		.rejects.toThrow('Mount failed');

	  expect(element.getAttribute('data-hydra-state')).toBe('error');
	  expect(element.innerHTML).toContain('Failed to load component');
	});

	it('should handle missing DOM elements', async () => {
	  const context: HydraContext = {
		peerId: 'test-peer'
	  };

	  await expect(hydrateLocalHydra('non-existent-element', 'TestIsland', context))
		.rejects.toThrow('Element with ID "non-existent-element" not found');
	});
  });
});