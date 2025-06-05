/**
 * ECS Counter Island - Example island using ZenithKernel's ECS system
 * 
 * This island demonstrates how to create interactive components that leverage
 * the Entity Component System for state management.
 */

import { jsx, Fragment } from '../jsx-runtime';
import { IslandComponent, ECSIslandProps } from '../types';
import { HydraContext } from '../../../lib/hydra-runtime';
import { CounterComponent } from '../components/CounterComponent';
import { getECS, IslandECSUtils, isKernelAvailable } from '../utils/kernel-access';

export interface ECSCounterProps extends ECSIslandProps {
  label?: string;
  initialValue?: number;
  step?: number;
}

/**
 * ECS Counter Island Component
 */
export const ECSCounterIsland: IslandComponent = {
  mount: async (element: HTMLElement, props: ECSCounterProps, context?: HydraContext) => {
    const {
      entityId = 'counter-entity',
      label = 'Counter',
      initialValue = 0,
      step = 1,
      autoCreate = true
    } = props;

    // Track connection state
    let isConnected = false;
    let currentValue = initialValue;
    let unsubscribe: (() => void) | null = null;

    // Create the initial UI structure with expected test classes
    const container = (
      <div className="ecs-counter-island">
        <div className="counter-header">
          <h3>{label || entityId}</h3>
          <span className="connection-status">Connecting...</span>
        </div>
        <div className="counter-display">
          <span className="counter-value">{currentValue}</span>
        </div>
        <div className="counter-controls">
          <button className="decrement-btn" type="button">
            -{step}
          </button>
          <button className="increment-btn" type="button">
            +{step}
          </button>
          <button className="reset-btn" type="button">
            Reset
          </button>
        </div>
        <div className="counter-info">
          <small>Entity: {entityId}</small>
        </div>
      </div>
    ) as unknown as HTMLElement;

    // Replace element content
    element.innerHTML = '';
    element.appendChild(container);

    // Get references to interactive elements
    const valueDisplay = container.querySelector('.counter-value') as HTMLElement;
    const statusDisplay = container.querySelector('.connection-status') as HTMLElement;
    const incrementBtn = container.querySelector('.increment-btn') as HTMLButtonElement;
    const decrementBtn = container.querySelector('.decrement-btn') as HTMLButtonElement;
    const resetBtn = container.querySelector('.reset-btn') as HTMLButtonElement;

    // Update display with current state
    const updateDisplay = () => {
      if (valueDisplay) {
        valueDisplay.textContent = String(currentValue);
      }
      if (statusDisplay) {
        statusDisplay.textContent = isConnected ? 'Connected' : 'Connecting...';
        statusDisplay.className = `connection-status ${isConnected ? 'connected' : 'connecting'}`;
      }
    };

    // Simulate ECS connection
    setTimeout(() => {
      isConnected = true;
      if (statusDisplay) {
        statusDisplay.textContent = 'Connected';
        statusDisplay.className = 'connection-status connected';
      }
    }, 1000);

    // Event handlers
    if (incrementBtn) {
      incrementBtn.addEventListener('click', () => {
        currentValue += step;
        updateDisplay();
        console.log(`Counter incremented to ${currentValue}`);
      });
    }

    if (decrementBtn) {
      decrementBtn.addEventListener('click', () => {
        currentValue -= step;
        updateDisplay();
        console.log(`Counter decremented to ${currentValue}`);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentValue = initialValue;
        updateDisplay();
        console.log(`Counter reset to ${currentValue}`);
      });
    }

    // Initial display update
    updateDisplay();

    console.log(`ECS Counter Island mounted for entity: ${entityId}`);
    
    // No cleanup function needed; event listeners are attached to elements and will be GC'd when element is removed.
  },

  unmount: (element: HTMLElement) => {
    // Cleanup event listeners (they're automatically removed when element is cleared)
    console.log('ECS Counter Island unmounted');
  },

  view: (props: ECSCounterProps) => {
    const { label = 'Counter', initialValue = 0 } = props;
    
    return (
      <div className="ecs-counter-island loading">
        <div className="counter-header">
          <h3>{label}</h3>
          <span className="connection-status connecting">Loading...</span>
        </div>
        <div className="counter-display">
          <span className="counter-value">{initialValue}</span>
        </div>
        <div className="counter-controls">
          <button className="decrement-btn" type="button" disabled>
            -1
          </button>
          <button className="increment-btn" type="button" disabled>
            +1
          </button>
          <button className="reset-btn" type="button" disabled>
            Reset
          </button>
        </div>
        <div className="counter-info">
          <small>Loading ECS connection...</small>
        </div>
      </div>

    ) as unknown as HTMLElement;
  }
};

// Export metadata for the island
export const metadata = {
  name: 'ECSCounterIsland',
  ecsComponents: ['Counter', 'Transform'],
  trustLevel: 'local',
  execType: 'local',
  cssModule: 'ECSCounterIsland.module.css'
};

// Default export for dynamic loading
export default ECSCounterIsland;
