import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHydraEvents } from '../../src/hooks/useHydraEvents';
import { ECSManager } from '../../src/core/ECSManager';

// Mock ECSManager
vi.mock('../../src/core/ECSManager');

describe('useHydraEvents Hook', () => {
  let mockECSManager: any;

  beforeEach(() => {
    mockECSManager = {
      on: vi.fn(),
      off: vi.fn(),
      getEntitiesWithComponent: vi.fn()
    };
    
    vi.mocked(ECSManager).mockImplementation(() => mockECSManager);
  });

  it('should subscribe to hydra context events', () => {
    const mockContext = { peerId: 'peer1', zkProof: 'proof123' };
    
    const { result } = renderHook(() => 
      useHydraEvents('HydraTrustBar', mockContext)
    );

    expect(mockECSManager.on).toHaveBeenCalledWith(
      'hydraEvent',
      expect.any(Function)
    );
    expect(result.current.events).toEqual([]);
    expect(result.current.connected).toBe(true);
  });

  it('should collect events matching hydra context', async () => {
    const mockContext = { peerId: 'peer1', zkProof: 'proof123' };
    const mockEvent = {
      type: 'trustUpdate',
      payload: { score: 85, peerId: 'peer1' },
      timestamp: Date.now()
    };

    const { result } = renderHook(() => 
      useHydraEvents('HydraTrustBar', mockContext)
    );

    // Simulate event received
    const eventCallback = mockECSManager.on.mock.calls[0][1];
    
    await act(async () => {
      eventCallback({
        hydraId: 'HydraTrustBar',
        context: mockContext,
        event: mockEvent
      });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toEqual(mockEvent);
    expect(result.current.lastEvent).toEqual(mockEvent);
  });

  it('should filter events by hydra ID', async () => {
    const mockContext = { peerId: 'peer1' };
    const matchingEvent = { type: 'trustUpdate', payload: { score: 85 } };
    const nonMatchingEvent = { type: 'other', payload: { data: 'test' } };

    const { result } = renderHook(() => 
      useHydraEvents('HydraTrustBar', mockContext)
    );

    const eventCallback = mockECSManager.on.mock.calls[0][1];
    
    await act(async () => {
      // Send event for correct hydra
      eventCallback({
        hydraId: 'HydraTrustBar',
        context: mockContext,
        event: matchingEvent
      });
      
      // Send event for different hydra
      eventCallback({
        hydraId: 'OtherHydra',
        context: mockContext,
        event: nonMatchingEvent
      });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toEqual(matchingEvent);
  });

  it('should provide clearEvents function', async () => {
    const mockContext = { peerId: 'peer1' };
    const mockEvent = { type: 'test', payload: {} };

    const { result } = renderHook(() => 
      useHydraEvents('HydraTrustBar', mockContext)
    );

    const eventCallback = mockECSManager.on.mock.calls[0][1];
    
    // Add an event
    await act(async () => {
      eventCallback({
        hydraId: 'HydraTrustBar',
        context: mockContext,
        event: mockEvent
      });
    });

    expect(result.current.events).toHaveLength(1);
    
    // Clear events
    await act(async () => {
      result.current.clearEvents();
    });

    expect(result.current.events).toHaveLength(0);
    expect(result.current.lastEvent).toBeNull();
  });

  it('should cleanup event listeners on unmount', () => {
    const mockContext = { peerId: 'peer1' };
    
    const { unmount } = renderHook(() => 
      useHydraEvents('HydraTrustBar', mockContext)
    );

    expect(mockECSManager.on).toHaveBeenCalled();

    unmount();

    expect(mockECSManager.off).toHaveBeenCalledWith(
      'hydraEvent',
      expect.any(Function)
    );
  });

  it('should handle connection status changes', async () => {
    const mockContext = { peerId: 'peer1' };
    
    const { result } = renderHook(() => 
      useHydraEvents('HydraTrustBar', mockContext)
    );

    expect(result.current.connected).toBe(true);

    const eventCallback = mockECSManager.on.mock.calls[0][1];
    
    // Simulate connection lost event
    await act(async () => {
      eventCallback({
        hydraId: 'HydraTrustBar',
        context: mockContext,
        event: { type: 'connectionLost', payload: {} }
      });
    });

    expect(result.current.connected).toBe(false);
  });
});
