/**
 * Hydra Status Island - Real-time status display using Hydra Events
 * 
 * This island demonstrates real-time event handling and connection status
 * using ZenithKernel's Hydra event system.
 */

import { jsx, Fragment } from '../jsx-runtime';
import { IslandComponent, HydraEventIslandProps } from '../types';
import { HydraContext } from '../../../lib/hydra-runtime';

export interface HydraStatusProps extends HydraEventIslandProps {
  title?: string;
  showConnectionInfo?: boolean;
  autoReconnect?: boolean;
}

/**
 * Hydra Status Island Component
 */
export const HydraStatusIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: HydraStatusProps, context?: HydraContext) => {
    const {
      title = 'Hydra Status',
      events = ['status', 'connection', 'error'],
      showConnectionInfo = true,
      autoReconnect = true,
      connection = {}
    } = props;

    // State
    let connectionStatus = 'connecting';
    let lastEvent: any = null;
    let eventCount = 0;
    let errors: string[] = [];

    // Create the UI structure
    const container = (
      <div className="hydra-status-island">
        <div className="status-header">
          <h3>{title}</h3>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">Connecting...</span>
          </div>
        </div>
        
        {showConnectionInfo && (
          <div className="connection-info">
            <div className="connection-detail">
              <label>URL:</label>
              <span className="connection-url">{connection.url || 'Default'}</span>
            </div>
            <div className="connection-detail">
              <label>Auto-reconnect:</label>
              <span className="auto-reconnect">{autoReconnect ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        )}

        <div className="event-stats">
          <div className="stat">
            <label>Events:</label>
            <span className="event-count">0</span>
          </div>
          <div className="stat">
            <label>Errors:</label>
            <span className="error-count">0</span>
          </div>
        </div>

        <div className="last-event">
          <h4>Last Event:</h4>
          <pre className="event-data">No events yet</pre>
        </div>

        <div className="error-log">
          <h4>Error Log:</h4>
          <div className="error-list">No errors</div>
        </div>

        <div className="controls">
          <button className="reconnect-btn" type="button">
            Reconnect
          </button>
          <button className="clear-logs-btn" type="button">
            Clear Logs
          </button>
        </div>
      </div>
    ) as HTMLElement;

    // Replace element content
    element.innerHTML = '';
    element.appendChild(container);

    // Get references to elements
    const statusDot = element.querySelector('.status-dot') as HTMLElement;
    const statusText = element.querySelector('.status-text') as HTMLElement;
    const eventCountEl = element.querySelector('.event-count') as HTMLElement;
    const errorCountEl = element.querySelector('.error-count') as HTMLElement;
    const eventDataEl = element.querySelector('.event-data') as HTMLElement;
    const errorListEl = element.querySelector('.error-list') as HTMLElement;
    const reconnectBtn = element.querySelector('.reconnect-btn') as HTMLButtonElement;
    const clearLogsBtn = element.querySelector('.clear-logs-btn') as HTMLButtonElement;

    // Update display
    const updateDisplay = () => {
      // Update status indicator
      if (statusDot && statusText) {
        statusDot.className = `status-dot ${connectionStatus}`;
        statusText.textContent = connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1);
      }

      // Update counts
      if (eventCountEl) {
        eventCountEl.textContent = String(eventCount);
      }
      if (errorCountEl) {
        errorCountEl.textContent = String(errors.length);
      }

      // Update last event
      if (eventDataEl) {
        eventDataEl.textContent = lastEvent 
          ? JSON.stringify(lastEvent, null, 2)
          : 'No events yet';
      }

      // Update error log
      if (errorListEl) {
        if (errors.length === 0) {
          errorListEl.textContent = 'No errors';
        } else {
          errorListEl.innerHTML = errors
            .slice(-5) // Show last 5 errors
            .map(error => `<div class="error-item">${error}</div>`)
            .join('');
        }
      }
    };

    // Mock Hydra event connection
    const simulateConnection = () => {
      connectionStatus = 'connecting';
      updateDisplay();

      setTimeout(() => {
        connectionStatus = 'connected';
        updateDisplay();

        // Simulate events
        const eventTypes = events;
        const simulateEvent = () => {
          if (connectionStatus === 'connected') {
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const eventData = {
              type: eventType,
              timestamp: Date.now(),
              data: { 
                message: `Simulated ${eventType} event`,
                value: Math.floor(Math.random() * 100)
              }
            };

            lastEvent = eventData;
            eventCount++;
            updateDisplay();

            // Schedule next event
            setTimeout(simulateEvent, 2000 + Math.random() * 3000);
          }
        };

        // Start event simulation
        setTimeout(simulateEvent, 1000);

      }, 1500);
    };

    // Event handlers
    if (reconnectBtn) {
      reconnectBtn.addEventListener('click', () => {
        connectionStatus = 'disconnected';
        updateDisplay();
        setTimeout(simulateConnection, 500);
      });
    }

    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        errors = [];
        eventCount = 0;
        lastEvent = null;
        updateDisplay();
      });
    }

    // Initialize connection
    simulateConnection();

    console.log(`Hydra Status Island mounted with events: ${events.join(', ')}`);
  },

  unmount: (element: HTMLElement) => {
    console.log('Hydra Status Island unmounted');
  },

  view: (props: HydraStatusProps) => {
    const { title = 'Hydra Status' } = props;
    
    return (
      <div className="hydra-status-island loading">
        <div className="status-header">
          <h3>{title}</h3>
          <div className="status-indicator">
            <span className="status-dot loading"></span>
            <span className="status-text">Loading...</span>
          </div>
        </div>
        <div className="loading-message">
          Initializing Hydra connection...
        </div>
      </div>
    ) as HTMLElement;
  }
};

// Export metadata for the island
export const metadata = {
  name: 'HydraStatusIsland',
  dependencies: [],
  trustLevel: 'local',
  execType: 'local'
};

// Default export for dynamic loading
export default HydraStatusIsland;
