/**
 * Hydra Registry Island - Display and manage active Hydra instances
 * 
 * This island demonstrates the registry system integration and provides
 * a UI for viewing and managing active Hydra components.
 */

import { jsx, Fragment } from '../jsx-runtime';
import { IslandComponent } from '../types';
import { HydraContext } from '../../../lib/hydra-runtime';

export interface HydraRegistryProps {
  title?: string;
  showDetails?: boolean;
  allowActions?: boolean;
}

interface HydraInstance {
  id: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastSeen: number;
  metadata?: Record<string, any>;
}

/**
 * Hydra Registry Island Component
 */
export const HydraRegistryIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: HydraRegistryProps, context?: HydraContext) => {
    const {
      title = 'Hydra Registry',
      showDetails = true,
      allowActions = true
    } = props;

    // State
    let instances: HydraInstance[] = [];
    let selectedInstance: string | null = null;

    // Create the UI structure
    const container = (
      <div className="hydra-registry-island">
        <div className="registry-header">
          <h3>{title}</h3>
          <div className="registry-stats">
            <span className="instance-count">0 instances</span>
            <button className="refresh-btn" type="button">
              ⟳ Refresh
            </button>
          </div>
        </div>

        <div className="registry-content">
          <div className="instance-list">
            <div className="list-header">
              <span>Active Instances</span>
            </div>
            <div className="instance-items">
              <div className="empty-state">No active instances</div>
            </div>
          </div>

          {showDetails && (
            <div className="instance-details">
              <div className="details-header">
                <span>Instance Details</span>
              </div>
              <div className="details-content">
                <div className="no-selection">Select an instance to view details</div>
              </div>
            </div>
          )}
        </div>

        {allowActions && (
          <div className="registry-actions">
            <button className="create-btn" type="button">
              + Create Instance
            </button>
            <button className="cleanup-btn" type="button">
              🗑 Cleanup Inactive
            </button>
          </div>
        )}
      </div>
    ) as unknown as HTMLElement;

    // Replace element content
    element.innerHTML = '';
    element.appendChild(container);

    // Get references to elements
    const instanceCountEl = element.querySelector('.instance-count') as HTMLElement;
    const instanceItemsEl = element.querySelector('.instance-items') as HTMLElement;
    const detailsContentEl = element.querySelector('.details-content') as HTMLElement;
    const refreshBtn = element.querySelector('.refresh-btn') as HTMLButtonElement;
    const createBtn = element.querySelector('.create-btn') as HTMLButtonElement;
    const cleanupBtn = element.querySelector('.cleanup-btn') as HTMLButtonElement;

    // Update display
    const updateDisplay = () => {
      // Update instance count
      if (instanceCountEl) {
        instanceCountEl.textContent = `${instances.length} instance${instances.length !== 1 ? 's' : ''}`;
      }

      // Update instance list
      if (instanceItemsEl) {
        if (instances.length === 0) {
          instanceItemsEl.innerHTML = '<div class="empty-state">No active instances</div>';
        } else {
          instanceItemsEl.innerHTML = instances
            .map(instance => `
              <div class="instance-item ${instance.id === selectedInstance ? 'selected' : ''}" 
                   data-instance-id="${instance.id}">
                <div class="instance-info">
                  <div class="instance-name">${instance.id}</div>
                  <div class="instance-type">${instance.type}</div>
                </div>
                <div class="instance-status ${instance.status}">
                  <span class="status-dot"></span>
                  <span class="status-text">${instance.status}</span>
                </div>
              </div>
            `)
            .join('');

          // Add click listeners to instance items
          instanceItemsEl.querySelectorAll('.instance-item').forEach(item => {
            item.addEventListener('click', () => {
              const instanceId = item.getAttribute('data-instance-id');
              if (instanceId) {
                selectedInstance = instanceId;
                updateDisplay();
              }
            });
          });
        }
      }

      // Update details panel
      if (detailsContentEl && showDetails) {
        if (selectedInstance) {
          const instance = instances.find(i => i.id === selectedInstance);
          if (instance) {
            detailsContentEl.innerHTML = `
              <div class="detail-section">
                <h4>Instance Information</h4>
                <div class="detail-row">
                  <label>ID:</label>
                  <span>${instance.id}</span>
                </div>
                <div class="detail-row">
                  <label>Type:</label>
                  <span>${instance.type}</span>
                </div>
                <div class="detail-row">
                  <label>Status:</label>
                  <span class="status-badge ${instance.status}">${instance.status}</span>
                </div>
                <div class="detail-row">
                  <label>Last Seen:</label>
                  <span>${new Date(instance.lastSeen).toLocaleString()}</span>
                </div>
              </div>
              ${instance.metadata ? `
                <div class="detail-section">
                  <h4>Metadata</h4>
                  <pre class="metadata-json">${JSON.stringify(instance.metadata, null, 2)}</pre>
                </div>
              ` : ''}
              ${allowActions ? `
                <div class="detail-actions">
                  <button class="terminate-btn" data-instance-id="${instance.id}">
                    Terminate
                  </button>
                  <button class="restart-btn" data-instance-id="${instance.id}">
                    Restart
                  </button>
                </div>
              ` : ''}
            `;

            // Add action listeners
            if (allowActions) {
              const terminateBtn = detailsContentEl.querySelector('.terminate-btn') as HTMLButtonElement;
              const restartBtn = detailsContentEl.querySelector('.restart-btn') as HTMLButtonElement;

              if (terminateBtn) {
                terminateBtn.addEventListener('click', () => {
                  terminateInstance(instance.id);
                });
              }

              if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                  restartInstance(instance.id);
                });
              }
            }
          }
        } else {
          detailsContentEl.innerHTML = '<div class="no-selection">Select an instance to view details</div>';
        }
      }
    };

    // Mock registry operations
    const loadInstances = () => {
      // Simulate loading instances from registry
      instances = [
        {
          id: 'hydra-counter-1',
          type: 'ECSCounterIsland',
          status: 'active',
          lastSeen: Date.now() - 1000,
          metadata: { entityId: 'counter-entity', label: 'Main Counter' }
        },
        {
          id: 'hydra-status-1',
          type: 'HydraStatusIsland',
          status: 'active',
          lastSeen: Date.now() - 500,
          metadata: { events: ['status', 'connection'], autoReconnect: true }
        },
        {
          id: 'hydra-chat-1',
          type: 'ChatIsland',
          status: 'inactive',
          lastSeen: Date.now() - 30000,
          metadata: { channel: '#general' }
        }
      ];
      updateDisplay();
    };

    const createInstance = () => {
      const newInstance: HydraInstance = {
        id: `hydra-${Date.now()}`,
        type: 'TestIsland',
        status: 'active',
        lastSeen: Date.now(),
        metadata: { created: new Date().toISOString() }
      };
      instances.push(newInstance);
      updateDisplay();
    };

    const terminateInstance = (instanceId: string) => {
      const index = instances.findIndex(i => i.id === instanceId);
      if (index !== -1) {
        instances.splice(index, 1);
        if (selectedInstance === instanceId) {
          selectedInstance = null;
        }
        updateDisplay();
      }
    };

    const restartInstance = (instanceId: string) => {
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        instance.status = 'active';
        instance.lastSeen = Date.now();
        updateDisplay();
      }
    };

    const cleanupInactive = () => {
      instances = instances.filter(i => i.status === 'active');
      if (selectedInstance && !instances.find(i => i.id === selectedInstance)) {
        selectedInstance = null;
      }
      updateDisplay();
    };

    // Event handlers
    if (refreshBtn) {
      refreshBtn.addEventListener('click', loadInstances);
    }

    if (createBtn) {
      createBtn.addEventListener('click', createInstance);
    }

    if (cleanupBtn) {
      cleanupBtn.addEventListener('click', cleanupInactive);
    }

    // Initialize
    loadInstances();

    console.log('Hydra Registry Island mounted');
  },

  unmount: (element: HTMLElement) => {
    console.log('Hydra Registry Island unmounted');
  },

  view: (props: HydraRegistryProps) => {
    const { title = 'Hydra Registry' } = props;
    
    return (
      <div className="hydra-registry-island loading">
        <div className="registry-header">
          <h3>{title}</h3>
          <div className="loading-spinner"></div>
        </div>
        <div className="loading-message">
          Loading registry data...
        </div>
      </div>
    ) as unknown as HTMLElement;
  }
};

// Export metadata for the island
export const metadata = {
  name: 'HydraRegistryIsland',
  dependencies: [],
  trustLevel: 'local',
  execType: 'local'
};

// Default export for dynamic loading
export default HydraRegistryIsland;
