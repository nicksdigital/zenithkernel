import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHydraRegistry } from '../../src/hooks/useHydraRegistry';

describe('useHydraRegistry Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty registry', () => {
    const { result } = renderHook(() => useHydraRegistry());
    
    expect(result.current.hydras).toEqual({});
    expect(result.current.activeCount).toBe(0);
    expect(result.current.getHydraById('test')).toBeUndefined();
  });

  it('should register a new Hydra instance', () => {
    const { result } = renderHook(() => useHydraRegistry());
    
    const hydraData = {
      id: 'test-hydra',
      state: 'loading' as const,
      execType: 'local' as const,
      entry: 'TestComponent.tsx',
      context: { peerId: 'peer1' },
      elementId: 'hydra-test-hydra'
    };

    act(() => {
      result.current.registerHydra(hydraData);
    });

    expect(result.current.hydras['test-hydra']).toEqual({
      ...hydraData,
      registeredAt: expect.any(Date),
      lastUpdate: expect.any(Date)
    });
    expect(result.current.activeCount).toBe(1);
    expect(result.current.getHydraById('test-hydra')).toBeDefined();
  });

  it('should update existing Hydra state', () => {
    const { result } = renderHook(() => useHydraRegistry());
    
    const hydraData = {
      id: 'test-hydra',
      state: 'loading' as const,
      execType: 'local' as const,
      entry: 'TestComponent.tsx',
      context: { peerId: 'peer1' },
      elementId: 'hydra-test-hydra'
    };

    act(() => {
      result.current.registerHydra(hydraData);
    });

    act(() => {
      result.current.updateHydraState('test-hydra', 'hydrated');
    });

    expect(result.current.hydras['test-hydra'].state).toBe('hydrated');
    expect(result.current.hydras['test-hydra'].lastUpdate).toBeInstanceOf(Date);
  });

  it('should unregister a Hydra instance', () => {
    const { result } = renderHook(() => useHydraRegistry());
    
    const hydraData = {
      id: 'test-hydra',
      state: 'loading' as const,
      execType: 'local' as const,
      entry: 'TestComponent.tsx',
      context: { peerId: 'peer1' },
      elementId: 'hydra-test-hydra'
    };

    act(() => {
      result.current.registerHydra(hydraData);
    });

    expect(result.current.activeCount).toBe(1);

    act(() => {
      result.current.unregisterHydra('test-hydra');
    });

    expect(result.current.hydras['test-hydra']).toBeUndefined();
    expect(result.current.activeCount).toBe(0);
    expect(result.current.getHydraById('test-hydra')).toBeUndefined();
  });

  it('should get Hydras by state', () => {
    const { result } = renderHook(() => useHydraRegistry());
    
    const hydra1 = {
      id: 'hydra-1',
      state: 'loading' as const,
      execType: 'local' as const,
      entry: 'Component1.tsx',
      context: { peerId: 'peer1' },
      elementId: 'hydra-hydra-1'
    };

    const hydra2 = {
      id: 'hydra-2',
      state: 'hydrated' as const,
      execType: 'remote' as const,
      entry: 'Component2.wasm',
      context: { peerId: 'peer2' },
      elementId: 'hydra-hydra-2'
    };

    const hydra3 = {
      id: 'hydra-3',
      state: 'error' as const,
      execType: 'local' as const,
      entry: 'Component3.tsx',
      context: { peerId: 'peer3' },
      elementId: 'hydra-hydra-3'
    };

    act(() => {
      result.current.registerHydra(hydra1);
      result.current.registerHydra(hydra2);
      result.current.registerHydra(hydra3);
    });

    expect(result.current.getHydrasByState('loading')).toHaveLength(1);
    expect(result.current.getHydrasByState('hydrated')).toHaveLength(1);
    expect(result.current.getHydrasByState('error')).toHaveLength(1);
    expect(result.current.activeCount).toBe(3);
  });

  it('should get Hydras by execution type', () => {
    const { result } = renderHook(() => useHydraRegistry());
    
    const localHydra = {
      id: 'local-hydra',
      state: 'hydrated' as const,
      execType: 'local' as const,
      entry: 'LocalComponent.tsx',
      context: { peerId: 'peer1' },
      elementId: 'hydra-local-hydra'
    };

    const remoteHydra = {
      id: 'remote-hydra',
      state: 'hydrated' as const,
      execType: 'remote' as const,
      entry: 'RemoteComponent.wasm',
      context: { peerId: 'peer2' },
      elementId: 'hydra-remote-hydra'
    };

    const edgeHydra = {
      id: 'edge-hydra',
      state: 'hydrated' as const,
      execType: 'edge' as const,
      entry: 'EdgeComponent.wasm',
      context: { peerId: 'peer3' },
      elementId: 'hydra-edge-hydra'
    };

    act(() => {
      result.current.registerHydra(localHydra);
      result.current.registerHydra(remoteHydra);
      result.current.registerHydra(edgeHydra);
    });

    expect(result.current.getHydrasByExecType('local')).toHaveLength(1);
    expect(result.current.getHydrasByExecType('remote')).toHaveLength(1);
    expect(result.current.getHydrasByExecType('edge')).toHaveLength(1);
  });

  it('should clear all Hydras', () => {
    const { result } = renderHook(() => useHydraRegistry());
    
    const hydra1 = {
      id: 'hydra-1',
      state: 'hydrated' as const,
      execType: 'local' as const,
      entry: 'Component1.tsx',
      context: { peerId: 'peer1' },
      elementId: 'hydra-hydra-1'
    };

    const hydra2 = {
      id: 'hydra-2',
      state: 'hydrated' as const,
      execType: 'remote' as const,
      entry: 'Component2.wasm',
      context: { peerId: 'peer2' },
      elementId: 'hydra-hydra-2'
    };

    act(() => {
      result.current.registerHydra(hydra1);
      result.current.registerHydra(hydra2);
    });

    expect(result.current.activeCount).toBe(2);

    act(() => {
      result.current.clearRegistry();
    });

    expect(result.current.hydras).toEqual({});
    expect(result.current.activeCount).toBe(0);
  });
});
