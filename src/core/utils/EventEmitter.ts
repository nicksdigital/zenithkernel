/**
 * EventEmitter.ts
 * 
 * A simple event emitter implementation for the Zenith framework.
 * This provides a way for components to communicate through events.
 */

type EventListener = (...args: any[]) => void;

/**
 * EventEmitter class for handling events in the Zenith framework
 */
export class EventEmitter {
  private events: Map<string, EventListener[]> = new Map();

  /**
   * Register an event listener
   * 
   * @param event The event name
   * @param listener The callback function
   */
  on(event: string, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    this.events.get(event)!.push(listener);
    return this;
  }

  /**
   * Register a one-time event listener
   * 
   * @param event The event name
   * @param listener The callback function
   */
  once(event: string, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    
    return this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   * 
   * @param event The event name
   * @param listener The callback function to remove
   */
  off(event: string, listener: EventListener): this {
    if (!this.events.has(event)) {
      return this;
    }
    
    const listeners = this.events.get(event)!;
    const index = listeners.indexOf(listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    return this;
  }

  /**
   * Remove all listeners for an event
   * 
   * @param event The event name (optional, if not provided, removes all listeners)
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    
    return this;
  }

  /**
   * Emit an event
   * 
   * @param event The event name
   * @param args Arguments to pass to the listeners
   */
  emit(event: string, ...args: any[]): boolean {
    if (!this.events.has(event)) {
      return false;
    }
    
    const listeners = this.events.get(event)!;
    
    for (const listener of listeners) {
      listener(...args);
    }
    
    return true;
  }

  /**
   * Get the number of listeners for an event
   * 
   * @param event The event name
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * Get all listeners for an event
   * 
   * @param event The event name
   */
  listeners(event: string): EventListener[] {
    return this.events.get(event) || [];
  }
}
