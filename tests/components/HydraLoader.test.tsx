import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HydraLoader } from '../../src/components/hydra/HydraLoader';
import * as hydraRuntime from '../../src/lib/hydra-runtime';

// Mock the hydra runtime
vi.mock('../../src/lib/hydra-runtime');

function mountToDOM(node: HTMLElement | DocumentFragment) {
  document.body.appendChild(node);
}

function cleanupDOM() {
  document.body.innerHTML = '';
}

describe('HydraLoader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupDOM();
    global.requestAnimationFrame = ((cb: FrameRequestCallback) => { cb(0); return 0; }) as typeof global.requestAnimationFrame;
  });

  it('should render placeholder div with correct ID', () => {
    const mockHydrateLocal = vi.spyOn(hydraRuntime, 'hydrateLocalHydra').mockResolvedValue(undefined);
    
    const node = HydraLoader({
      id: 'test-hydra',
      context: { peerId: 'peer1' },
      execType: 'local',
      entry: 'TestComponent.tsx',
    });
    mountToDOM(node as HTMLElement);

    const placeholder = document.getElementById('hydra-test-hydra');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.getAttribute('id')).toBe('hydra-test-hydra');
  });

  it('should call hydrateLocalHydra for local execution', async () => {
    const mockHydrateLocal = vi.spyOn(hydraRuntime, 'hydrateLocalHydra').mockResolvedValue(undefined);
    const context = { peerId: 'peer1', zkProof: 'proof123' };
    
    const node = HydraLoader({
      id: 'local-hydra',
      context,
      execType: 'local',
      entry: 'LocalComponent.tsx',
    });
    mountToDOM(node as HTMLElement);

    // Wait for requestAnimationFrame and hydration
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockHydrateLocal).toHaveBeenCalledWith(
      'hydra-local-hydra',
      'LocalComponent.tsx',
      context
    );
  });

  it('should call hydrateRemoteHydra for remote execution', async () => {
    const mockHydrateRemote = vi.spyOn(hydraRuntime, 'hydrateRemoteHydra').mockResolvedValue(undefined);
    const context = { peerId: 'peer1', zkProof: 'proof123' };
    
    const node = HydraLoader({
      id: 'remote-hydra',
      context,
      execType: 'remote',
      entry: 'RemoteComponent.wasm',
    });
    mountToDOM(node as HTMLElement);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockHydrateRemote).toHaveBeenCalledWith(
      'hydra-remote-hydra',
      'RemoteComponent.wasm',
      context
    );
  });

  it('should show loading state initially', () => {
    const mockHydrateLocal = vi.spyOn(hydraRuntime, 'hydrateLocalHydra').mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    const node = HydraLoader({
      id: 'loading-hydra',
      context: { peerId: 'peer1' },
      execType: 'local',
      entry: 'LoadingComponent.tsx',
    });
    mountToDOM(node as HTMLElement);

    const loading = document.body.textContent;
    expect(loading).toContain('Loading Hydra');
  });

  it('should show error state on hydration failure', async () => {
    const mockHydrateLocal = vi.spyOn(hydraRuntime, 'hydrateLocalHydra').mockRejectedValue(
      new Error('Failed to load component')
    );
    
    const node = HydraLoader({
      id: 'error-hydra',
      context: { peerId: 'peer1' },
      execType: 'local',
      entry: 'ErrorComponent.tsx',
    });
    mountToDOM(node as HTMLElement);

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(document.body.textContent).toMatch(/Failed to load Hydra/);
  });

  it('should handle edge execution type', async () => {
    const mockHydrateRemote = vi.spyOn(hydraRuntime, 'hydrateRemoteHydra').mockResolvedValue(undefined);
    
    const node = HydraLoader({
      id: 'edge-hydra',
      context: { peerId: 'peer1' },
      execType: 'edge',
      entry: 'EdgeComponent.wasm',
    });
    mountToDOM(node as HTMLElement);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockHydrateRemote).toHaveBeenCalledWith(
      'hydra-edge-hydra',
      'EdgeComponent.wasm',
      { peerId: 'peer1' }
    );
  });

  it('should re-hydrate when props change', async () => {
    const mockHydrateLocal = vi.spyOn(hydraRuntime, 'hydrateLocalHydra').mockResolvedValue(undefined);
    
    let node = HydraLoader({
      id: 'rehydrate-hydra',
      context: { peerId: 'peer1' },
      execType: 'local',
      entry: 'Component1.tsx',
    });
    mountToDOM(node as HTMLElement);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockHydrateLocal).toHaveBeenCalledTimes(1);

    // Remove and re-insert with new props
    cleanupDOM();
    node = HydraLoader({
      id: 'rehydrate-hydra',
      context: { peerId: 'peer1' },
      execType: 'local',
      entry: 'Component2.tsx',
    });
    mountToDOM(node as HTMLElement);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockHydrateLocal).toHaveBeenCalledTimes(2);
    expect(mockHydrateLocal).toHaveBeenLastCalledWith(
      'hydra-rehydrate-hydra',
      'Component2.tsx',
      { peerId: 'peer1' }
    );
  });
});
