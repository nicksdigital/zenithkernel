<Template
  zk-proof="required"
  zk-trust="verified"
  hydration-strategy="interaction"
  data-island="HydraStatusIsland"
>
  <div className="hydra-status-island">
    <div className="status-header">
      <h3>🌊 Hydra Status Monitor</h3>
      <div className="trust-indicator" :class="trustClass">
        {{ trustLevel }}
      </div>
    </div>
    
    <div className="status-grid" v-if="isVerified">
      <div className="status-item" v-for="item in statusItems">
        <span className="status-label">{{ item.label }}:</span>
        <span className="status-value" :class="item.status">{{ item.value }}</span>
      </div>
    </div>
    
    <div className="verification-pending" v-if="!isVerified">
      <div className="verification-spinner">🔒</div>
      <p>Verifying ZK proof...</p>
    </div>
    
    <div className="actions" v-if="isVerified && showActions">
      <button className="refresh-btn" @click="refresh">Refresh Status</button>
      <button className="details-btn" @click="showDetails">View Details</button>
    </div>
  </div>
</Template>

<script>
import { HydraContext } from '../../../lib/hydra-runtime';

export interface HydraStatusIslandProps {
  /** Show action buttons */
  showActions?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Status items to display */
  statusItems?: Array<{
    label: string;
    value: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }>;
  /** Trust level override */
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
}

export const metadata = {
  name: 'HydraStatusIsland',
  dependencies: ['ZKVerificationSystem'],
  trustLevel: 'verified',
  execType: 'local',
  ecsComponents: ['Status', 'Trust', 'Connection']
};

// Island state
let isVerified = false;
let trustLevel = props.trustLevel || 'unverified';
let trustClass = 'trust-' + trustLevel;
let statusItems = props.statusItems || [
  { label: 'Connection', value: 'Connected', status: 'success' },
  { label: 'ZK Proof', value: 'Valid', status: 'success' },
  { label: 'ECS Sync', value: 'Active', status: 'info' },
  { label: 'Trust Score', value: '95%', status: 'success' }
];

// Methods
function refresh() {
  console.log('Refreshing Hydra status...');
  // Simulate refresh
  statusItems = statusItems.map(item => ({
    ...item,
    value: item.label === 'Connection' ? 'Reconnecting...' : item.value,
    status: item.label === 'Connection' ? 'warning' : item.status
  }));
  
  setTimeout(() => {
    statusItems = statusItems.map(item => ({
      ...item,
      value: item.label === 'Connection' ? 'Connected' : item.value,
      status: item.label === 'Connection' ? 'success' : item.status
    }));
  }, 2000);
}

function showDetails() {
  console.log('Showing detailed status information...');
  // Emit event for parent components to handle
  window.dispatchEvent(new CustomEvent('hydra:show-details', {
    detail: { statusItems, trustLevel, context }
  }));
}

// Lifecycle hooks
onMount(async () => {
  // Simulate ZK verification
  console.log('Starting ZK verification for HydraStatus...');
  
  try {
    // In real implementation, this would verify the actual ZK proof
    await new Promise(resolve => setTimeout(resolve, 1500));
    isVerified = true;
    console.log('ZK verification successful for HydraStatus');
    
    // Set up auto-refresh if specified
    if (props.refreshInterval && props.refreshInterval > 0) {
      setInterval(refresh, props.refreshInterval);
    }
  } catch (error) {
    console.error('ZK verification failed:', error);
    isVerified = false;
  }
});

onDestroy(() => {
  console.log('HydraStatusIsland cleanup');
});
</script>
