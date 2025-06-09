
import { useState, useCallback } from 'react';
import { HydraContext } from '../lib/hydra-runtime';

export type HydraState = 'loading' | 'hydrated' | 'error';
export type HydraExecType = 'local' | 'remote' | 'edge';

export interface HydraRegistryEntry {
  id: string;
  state: HydraState;
  execType: HydraExecType;
  entry: string;
  context: HydraContext;
  elementId: string;
  registeredAt: Date;
  lastUpdate: Date;
  error?: string;
}

export interface HydraRegistryState {
  [id: string]: HydraRegistryEntry;
}

export interface UseHydraRegistryReturn {
  /** Current registry of all active Hydras */
  hydras: HydraRegistryState;
  /** Number of active Hydras */
  activeCount: number;
  /** Register a new Hydra instance */
  registerHydra: (hydraData: Omit<HydraRegistryEntry, 'registeredAt' | 'lastUpdate'>) => void;
  /** Update the state of an existing Hydra */
  updateHydraState: (id: string, state: HydraState, error?: string) => void;
  /** Unregister a Hydra instance */
  unregisterHydra: (id: string) => void;
  /** Get a specific Hydra by ID */
  getHydraById: (id: string) => HydraRegistryEntry | undefined;
  /** Get all Hydras with a specific state */
  getHydrasByState: (state: HydraState) => HydraRegistryEntry[];
  /** Get all Hydras with a specific execution type */
  getHydrasByExecType: (execType: HydraExecType) => HydraRegistryEntry[];
  /** Clear all Hydras from the registry */
  clearRegistry: () => void;
}

/**
 * useHydraRegistry - Hook for managing active Hydra component instances
 * 
 * This hook provides a centralized registry for tracking all active Hydra components
 * in the application, including their states, execution types, and metadata.
 */
export const useHydraRegistry = (): UseHydraRegistryReturn => {
  const [hydras, setHydras] = useState<HydraRegistryState>({});

  const registerHydra = useCallback((hydraData: Omit<HydraRegistryEntry, 'registeredAt' | 'lastUpdate'>) => {
    const now = new Date();
    setHydras(prev => ({
      ...prev,
      [hydraData.id]: {
        ...hydraData,
        registeredAt: now,
        lastUpdate: now
      }
    }));
  }, []);

  const updateHydraState = useCallback((id: string, state: HydraState, error?: string) => {
    setHydras(prev => {
      const existing = prev[id];
      if (!existing) {
        console.warn(`Attempted to update non-existent Hydra: ${id}`);
        return prev;
      }
      
      return {
        ...prev,
        [id]: {
          ...existing,
          state,
          error,
          lastUpdate: new Date()
        }
      };
    });
  }, []);

  const unregisterHydra = useCallback((id: string) => {
    setHydras(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const getHydraById = useCallback((id: string): HydraRegistryEntry | undefined => {
    return hydras[id];
  }, [hydras]);

  const getHydrasByState = useCallback((state: HydraState): HydraRegistryEntry[] => {
    return Object.values(hydras).filter(hydra => hydra.state === state);
  }, [hydras]);

  const getHydrasByExecType = useCallback((execType: HydraExecType): HydraRegistryEntry[] => {
    return Object.values(hydras).filter(hydra => hydra.execType === execType);
  }, [hydras]);

  const clearRegistry = useCallback(() => {
    setHydras({});
  }, []);

  const activeCount = Object.keys(hydras).length;

  return {
    hydras,
    activeCount,
    registerHydra,
    updateHydraState,
    unregisterHydra,
    getHydraById,
    getHydrasByState,
    getHydrasByExecType,
    clearRegistry
  };
};
