import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useECSState } from '../../src/hooks/useECSState';
import { ECSManager } from '../../src/core/ECSManager';

// Mock ECSManager
vi.mock('../../src/core/ECSManager');

describe('useECSState Hook', () => {
  let mockECSManager: any;

  beforeEach(() => {
    mockECSManager = {
      getComponent: vi.fn(),
      hasComponent: vi.fn(),
      addComponent: vi.fn(),
      removeComponent: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
    
    // Mock the ECSManager instance
    vi.mocked(ECSManager).mockImplementation(() => mockECSManager);
  });

  it('should return component data for existing entity and component', () => {
    const mockComponent = { x: 10, y: 20 };
    mockECSManager.getComponent.mockReturnValue(mockComponent);
    mockECSManager.hasComponent.mockReturnValue(true);

    const { result } = renderHook(() => 
      useECSState('entity-1', 'Position')
    );

    expect(result.current.data).toEqual(mockComponent);
    expect(result.current.exists).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should return null for non-existent component', () => {
    mockECSManager.getComponent.mockReturnValue(null);
    mockECSManager.hasComponent.mockReturnValue(false);

    const { result } = renderHook(() => 
      useECSState('entity-1', 'NonExistent')
    );

    expect(result.current.data).toBeNull();
    expect(result.current.exists).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should update when component changes', async () => {
    const initialComponent = { x: 10, y: 20 };
    const updatedComponent = { x: 30, y: 40 };
    
    mockECSManager.getComponent.mockReturnValue(initialComponent);
    mockECSManager.hasComponent.mockReturnValue(true);

    const { result } = renderHook(() => 
      useECSState('entity-1', 'Position')
    );

    expect(result.current.data).toEqual(initialComponent);

    // Simulate component change
    mockECSManager.getComponent.mockReturnValue(updatedComponent);
    
    // Trigger the change event callback
    const changeCallback = mockECSManager.on.mock.calls[0][1];
    
    await act(async () => {
      changeCallback({ entityId: 'entity-1', componentKey: 'Position' });
    });

    expect(result.current.data).toEqual(updatedComponent);
  });

  it('should provide updateComponent function', async () => {
    const mockComponent = { x: 10, y: 20 };
    mockECSManager.getComponent.mockReturnValue(mockComponent);
    mockECSManager.hasComponent.mockReturnValue(true);

    const { result } = renderHook(() => 
      useECSState('entity-1', 'Position')
    );

    const newData = { x: 50, y: 60 };
    
    await act(async () => {
      result.current.updateComponent(newData);
    });

    expect(mockECSManager.addComponent).toHaveBeenCalledWith('entity-1', 'Position', newData);
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => 
      useECSState('entity-1', 'Position')
    );

    expect(mockECSManager.on).toHaveBeenCalled();

    unmount();

    expect(mockECSManager.off).toHaveBeenCalled();
  });
});
