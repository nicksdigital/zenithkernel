import { useState, useEffect, useCallback, useRef } from 'react';
import { ECSManager } from '../core/ECSManager';

export interface HydraEvent {
  type: string;
  payload: any;
  timestamp?: number;
}

export interface HydraEventMessage {
  hydraId: string;
  context: Record<string, any>;
  event: HydraEvent;
}

export interface UseHydraEventsResult {
  events: HydraEvent[];
  lastEvent: HydraEvent | null;
  connected: boolean;
  clearEvents: () => void;
}

export function useHydraEvents(
  hydraId: string,
  context: Record<string, any>,
  ecsManager?: ECSManager
): UseHydraEventsResult {
  const [events, setEvents] = useState<HydraEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<HydraEvent | null>(null);
  const [connected, setConnected] = useState<boolean>(true);
  const ecsRef = useRef(ecsManager || new ECSManager());

  const handleHydraEvent = useCallback((eventMessage: HydraEventMessage) => {
    // Filter events for this specific hydra
    if (eventMessage.hydraId !== hydraId) {
      return;
    }

    const event = eventMessage.event;

    // Handle special connection events
    if (event.type === 'connectionLost') {
      setConnected(false);
    } else if (event.type === 'connectionRestored') {
      setConnected(true);
    }

    // Add to events list
    setEvents(prev => [...prev, event]);
    setLastEvent(event);
  }, [hydraId]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  useEffect(() => {
    const ecs = ecsRef.current;

    // Subscribe to hydra events if available
    if (ecs.on && typeof ecs.on === 'function') {
      ecs.on('hydraEvent', handleHydraEvent);
    }

    return () => {
      // Cleanup event listener
      if (ecs.off && typeof ecs.off === 'function') {
        ecs.off('hydraEvent', handleHydraEvent);
      }
    };
  }, [handleHydraEvent]);

  return {
    events,
    lastEvent,
    connected,
    clearEvents
  };
}
