import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jsx } from '../../src/modules/Rendering/jsx-runtime';
import { HydraLoader } from '../../src/components/hydra/HydraLoader';
import { HydraTrustBar } from '../../src/components/hydra/HydraTrustBar';

describe('Hydra Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any existing DOM elements
    document.body.innerHTML = '';
  });

  it('should render and hydrate a complete Hydra component', async () => {
    const context = {
      peerId: 'peer123',
      message: 'Hello from integrated test!',
      zkProof: 'proof_abc123'
    };

    const element = jsx(HydraLoader, {
      id: 'integration-test',
      context,
      execType: 'local',
      entry: 'TestHydraComponent.tsx'
    });

    document.body.appendChild(element);

    // Verify the placeholder is initially rendered
    const placeholder = document.getElementById('hydra-integration-test');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.getAttribute('id')).toBe('hydra-integration-test');

    // Wait for the component to hydrate
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the hydrated content
    const hydratedElement = document.getElementById('test-hydra-component');
    expect(hydratedElement).toBeTruthy();
    expect(hydratedElement?.textContent).toContain('Hydrated Component');
    expect(hydratedElement?.querySelector('[data-testid="hydra-message"]')?.textContent)
      .toContain('Message: Hello from integrated test!');
    expect(hydratedElement?.querySelector('[data-testid="hydra-peer"]')?.textContent)
      .toContain('From Peer: peer123');
    expect(hydratedElement?.querySelector('[data-testid="hydra-status"]')?.textContent)
      .toContain('✅ Successfully Hydrated');

    // Verify the hydra state is updated
    expect(placeholder?.getAttribute('data-hydra-state')).toBe('hydrated');
  });

  it('should integrate HydraLoader with HydraTrustBar', async () => {
    const context = {
      peerId: 'trusted-peer',
      zkProof: 'verified_proof_123'
    };

    const container = jsx('div', {
      children: [
        jsx(HydraTrustBar, {
          hydraId: 'trust-test',
          peerId: context.peerId,
          execType: 'remote',
          entry: 'SecureComponent.wasm',
          zkProof: context.zkProof,
          trustScore: 95
        }),
        jsx(HydraLoader, {
          id: 'trust-test',
          context,
          execType: 'remote',
          entry: 'SecureComponent.wasm'
        })
      ]
    });

    document.body.appendChild(container);

    // Verify trust bar shows verified status
    const trustBar = document.querySelector('[data-testid="trust-bar-trust-test"]');
    expect(trustBar?.textContent).toContain('Verified');
    expect(trustBar?.textContent).toContain('Trust: 95%');
    expect(trustBar?.querySelector('[data-testid="verified-icon"]')).toBeTruthy();

    // Verify the loader is present
    const loader = document.getElementById('hydra-trust-test');
    expect(loader).toBeTruthy();

    // Wait for hydration
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(loader?.getAttribute('data-hydra-state')).toBe('hydrated');
  });

  it('should handle multiple Hydra components simultaneously', async () => {
    const container = jsx('div', {
      children: [
        jsx(HydraLoader, {
          id: 'multi-1',
          context: { peerId: 'peer1', message: 'Component 1' },
          execType: 'local',
          entry: 'TestHydraComponent.tsx'
        }),
        jsx(HydraLoader, {
          id: 'multi-2',
          context: { peerId: 'peer2', message: 'Component 2' },
          execType: 'local',
          entry: 'TestHydraComponent.tsx'
        }),
        jsx(HydraLoader, {
          id: 'multi-3',
          context: { peerId: 'peer3' },
          execType: 'remote',
          entry: 'RemoteComponent.wasm'
        })
      ]
    });

    document.body.appendChild(container);

    // Wait for all components to hydrate
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the test components rendered correctly
    const messages = document.querySelectorAll('[data-testid="hydra-message"]');
    expect(messages).toHaveLength(2); // Only local components render the test component
    expect(messages[0]?.textContent).toContain('Message: Component 1');
    expect(messages[1]?.textContent).toContain('Message: Component 2');
  });

  it('should handle hydration errors gracefully', async () => {
    const element = jsx(HydraLoader, {
      id: 'error-test',
      context: { peerId: 'peer123' },
      execType: 'local',
      entry: 'NonExistentComponent.tsx'
    });

    document.body.appendChild(element);

    const loader = document.getElementById('hydra-error-test');
    expect(loader).toBeTruthy();

    // Component should start in loading state
    expect(loader?.textContent).toContain('Loading Hydra...');

    // Wait for it to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(loader?.getAttribute('data-hydra-state')).toBe('hydrated');
  });
});
