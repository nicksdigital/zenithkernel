import { useState, useEffect, useCallback, useRef } from 'react';
import { ECSManager } from '../core/ECSManager';

export interface UseECSStateResult<T = any> {
  data: T | null;
  exists: boolean;
  loading: boolean;
  updateComponent: (newData: T) => void;
}

export interface ComponentChangeEvent {
  entityId: string;
  componentKey: string;
}

export function useECSState<T = any>(
  entityId: string, 
  componentKey: string,
  ecsManager?: ECSManager
): UseECSStateResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const ecsRef = useRef(ecsManager || new ECSManager());
  
  const updateData = useCallback(() => {
    try {
      const ecs = ecsRef.current;
      const componentData = ecs.getComponent(entityId, componentKey);
      
      setData(componentData);
      setLoading(false);
      
      return { data: componentData, exists: ecs.hasComponent(entityId, componentKey) };
    } catch (error) {
      console.error('Error fetching ECS component:', error);
      setData(null);
      setLoading(false);
      return { data: null, exists: false };
    }
  }, [entityId, componentKey]);

  useEffect(() => {
    // Initial load
    updateData();

    // Listen for component changes
    const handleComponentChange = (event: ComponentChangeEvent) => {
      if (event.entityId === entityId && event.componentKey === componentKey) {
        updateData();
      }
    };

    const ecs = ecsRef.current;
    
    // Subscribe to ECS events if available
    if (ecs.on && typeof ecs.on === 'function') {
      ecs.on('componentChanged', handleComponentChange);
    }

    return () => {
      // Cleanup event listener
      if (ecs.off && typeof ecs.off === 'function') {
        ecs.off('componentChanged', handleComponentChange);
      }
    };
  }, [entityId, componentKey, updateData]);

  const updateComponent = useCallback((newData: T) => {
    const ecs = ecsRef.current;
    
    try {
      ecs.addComponent(entityId, componentKey, newData);
      setData(newData);
    } catch (error) {
      console.error('Error updating ECS component:', error);
    }
  }, [entityId, componentKey]);

  const exists = ecsRef.current.hasComponent?.(entityId, componentKey) || false;

  return {
    data,
    exists,
    loading,
    updateComponent
  };
}
