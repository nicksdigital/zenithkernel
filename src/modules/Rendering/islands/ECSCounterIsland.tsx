/**
 * ECS Counter Island - Interactive counter with ECS integration
 * 
 * This island demonstrates ECS component integration and real-time updates
 * using ZenithKernel's Entity Component System.
 */

import { jsx, Fragment } from '../jsx-runtime';
import { IslandComponent } from '../types';
import { HydraContext } from '../../../lib/hydra-runtime';

export interface ECSCounterIslandProps {
  label?: string;
  initialValue?: number;
  step?: number;
  entityId?: string;
}

/**
 * ECS Counter Island Component
 */
export const ECSCounterIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: ECSCounterIslandProps, context?: HydraContext) => {
    const {
      label = 'ECS Counter',
      initialValue = 0,
      step = 1,
      entityId
    } = props;

    // State
    let currentValue = initialValue;
    let isConnected = false;

    // Create the UI structure using template-like approach
    const container = (
      <div className="ecs-counter-island">
        <div className="counter-header">
          <h3>{label}</h3>
          <span className="connection-status connecting">Connecting...</span>
        </div>
        
        <div className="counter-display">
          <span className="counter-value">{currentValue}</span>
        </div>
        
        <div className="counter-controls">
          <button className="decrement-btn" type="button" disabled>
            -{step}
          </button>
          <button className="increment-btn" type="button" disabled>
            +{step}
          </button>
          <button className="reset-btn" type="button" disabled>
            Reset
          </button>
        </div>
        
        <div className="counter-info">
          <small>Initializing ECS connection...</small>
        </div>
      </div>
    ) as HTMLElement;

    // Replace element content
    element.innerHTML = '';
    element.appendChild(container);

    // Get references to DOM elements
    const valueDisplay = element.querySelector('.counter-value') as HTMLElement;
    const statusDisplay = element.querySelector('.connection-status') as HTMLElement;
    const decrementBtn = element.querySelector('.decrement-btn') as HTMLButtonElement;
    const incrementBtn = element.querySelector('.increment-btn') as HTMLButtonElement;
    const resetBtn = element.querySelector('.reset-btn') as HTMLButtonElement;
    const infoDisplay = element.querySelector('.counter-info small') as HTMLElement;

    // Update display function
    const updateDisplay = () => {
      if (valueDisplay) {
        valueDisplay.textContent = String(currentValue);
      }
      
      if (statusDisplay) {
        statusDisplay.textContent = isConnected ? 'Connected' : 'Connecting...';
        statusDisplay.className = `connection-status ${isConnected ? 'connected' : 'connecting'}`;
      }
      
      if (infoDisplay) {
        const entityInfo = entityId || context?.ecsEntity || context?.peerId || 'unknown';
        infoDisplay.textContent = isConnected 
          ? `Connected to ECS entity: ${entityInfo}`
          : 'Establishing ECS connection...';
      }

      // Enable/disable buttons based on connection
      [decrementBtn, incrementBtn, resetBtn].forEach(btn => {
        if (btn) {
          btn.disabled = !isConnected;
        }
      });
    };

    // Value update function with ECS integration
    const updateValue = (newValue: number) => {
      currentValue = newValue;
      updateDisplay();
      
      // Simulate ECS component update
      console.log(`ECS Update: Counter component updated`, {
        entityId: entityId || context?.ecsEntity,
        component: 'Counter',
        value: currentValue,
        timestamp: Date.now()
      });

      // In a real implementation, this would call:
      // ecs.updateComponent(entityId, 'Counter', { value: currentValue });
    };

    // Event handlers
    if (decrementBtn) {
      decrementBtn.addEventListener('click', () => {
        updateValue(currentValue - step);
      });
    }

    if (incrementBtn) {
      incrementBtn.addEventListener('click', () => {
        updateValue(currentValue + step);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        updateValue(initialValue);
      });
    }

    // Simulate ECS connection
    const connectToECS = () => {
      setTimeout(() => {
        isConnected = true;
        updateDisplay();
        console.log(`ECS Counter Island connected with context:`, context);
        
        // Simulate periodic ECS sync
        setInterval(() => {
          if (isConnected) {
            console.log(`ECS Sync: Counter value = ${currentValue}`);
          }
        }, 5000);
      }, 1000 + Math.random() * 1000);
    };

    // Initialize
    updateDisplay();
    connectToECS();

    console.log(`ECS Counter Island mounted:`, {
      label,
      initialValue,
      step,
      entityId,
      context
    });

    // Return cleanup function
    return () => {
      isConnected = false;
      console.log('ECS Counter Island cleanup');
    };
  },

  unmount: (element: HTMLElement) => {
    element.innerHTML = '';
    console.log('ECS Counter Island unmounted');
  },

  view: (props: ECSCounterIslandProps) => {
    const { label = 'ECS Counter', initialValue = 0 } = props;
    
    return (
      <div className="ecs-counter-island loading">
        <div className="counter-header">
          <h3>{label}</h3>
          <div className="loading-spinner">🌊</div>
        </div>
        <div className="counter-display">
          <span className="counter-value">{initialValue}</span>
        </div>
        <div className="loading-message">
          Loading ECS connection...
        </div>
      </div>
    ) as HTMLElement;
  }
};

// Export metadata for the island
export const metadata = {
  name: 'ECSCounterIsland',
  dependencies: [],
  trustLevel: 'local',
  execType: 'local',
  ecsComponents: ['Counter', 'Position']
};

// Default export for dynamic loading
export default ECSCounterIsland;