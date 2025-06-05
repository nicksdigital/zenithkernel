<Template 
  zk-trust="local" 
  ecs-entity="counter" 
  hydration-strategy="visible"
  data-island="ECSCounterIsland"
>
  <div className="ecs-counter-island">
    <div className="counter-header">
      <h3>{{ label }}</h3>
      <span className="connection-status" :class="isConnected ? 'connected' : 'connecting'">
        {{ isConnected ? 'Connected' : 'Connecting...' }}
      </span>
    </div>
    
    <div className="counter-display">
      <span className="counter-value">{{ currentValue }}</span>
    </div>
    
    <div className="counter-controls" v-if="isConnected">
      <button className="decrement-btn" @click="decrement" type="button">
        -{{ step }}
      </button>
      <button className="increment-btn" @click="increment" type="button">
        +{{ step }}
      </button>
      <button className="reset-btn" @click="reset" type="button">
        Reset
      </button>
    </div>
    
    <div className="counter-info">
      <small>{{ connectionInfo }}</small>
    </div>
  </div>
</Template>

<script>
import { HydraContext } from '../../../lib/hydra-runtime';

export interface ECSCounterIslandProps {
  /** Label text for the counter */
  label?: string;
  /** Initial counter value */
  initialValue?: number;
  /** Step size for increment/decrement */
  step?: number;
  /** ECS entity ID to bind to */
  entityId?: string;
}

export const metadata = {
  name: 'ECSCounterIsland',
  dependencies: [],
  trustLevel: 'local',
  execType: 'local',
  ecsComponents: ['Counter', 'Position']
};

// Island state and logic
let currentValue = props.initialValue || 0;
let isConnected = false;
let connectionInfo = 'Initializing ECS connection...';

// Methods
function increment() {
  currentValue += props.step || 1;
  updateECS();
}

function decrement() {
  currentValue -= props.step || 1;
  updateECS();
}

function reset() {
  currentValue = props.initialValue || 0;
  updateECS();
}

function updateECS() {
  console.log(`ECS Update: Counter component updated`, {
    entityId: props.entityId || context?.ecsEntity,
    component: 'Counter',
    value: currentValue,
    timestamp: Date.now()
  });
}

// Lifecycle hooks
onMount(() => {
  // Simulate ECS connection
  setTimeout(() => {
    isConnected = true;
    connectionInfo = `Connected to ECS entity: ${props.entityId || context?.ecsEntity || context?.peerId || 'unknown'}`;
  }, 1000);
});

onDestroy(() => {
  isConnected = false;
  console.log('ECS Counter Island cleanup');
});
</script>
