/**
 * CounterIsland - Example island component using Hydra JSX syntax
 */

import { jsx, type IslandComponent } from '../lib/core';
import { HydraContext, Hydra } from '../lib/runtime';

// Counter Island component
const CounterIsland: IslandComponent = {
  async mount(element: HTMLElement, props: any, context?: HydraContext): Promise<void> {
    const startTime = performance.now();
    console.log(`🌊 Hydrating CounterIsland at ${startTime}ms`);

    // Extract props with defaults
    const { 
      title = 'Counter Island', 
      initialCount = 0,
      entityId 
    } = props;

    // Create a local state for the counter
    let count = initialCount;

    // Create the Hydra component structure using the new syntax
    const content = (
      <Hydra
        type="island"
        id="counter-island"
        execType="local"
        context={{ count, entityId }}
      >
        <meta
          title={title}
          description="Interactive counter component with ECS integration"
        />
        
        <css>
          {`
            .counter-island {
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              margin: 10px 0;
              font-family: system-ui, sans-serif;
            }
            .island-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            .hydration-info {
              font-size: 12px;
              color: #666;
            }
            .count-display {
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .controls {
              display: flex;
              justify-content: center;
              gap: 10px;
            }
            .controls button {
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            .increment-btn {
              background-color: #4CAF50;
              color: white;
            }
            .decrement-btn {
              background-color: #f44336;
              color: white;
            }
            .reset-btn {
              background-color: #2196F3;
              color: white;
            }
            .entity-info {
              margin-top: 15px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .island-footer {
              margin-top: 15px;
              font-size: 12px;
              color: #666;
              text-align: right;
            }
          `}
        </css>
        
        <safeScript type="on_load">
          {`
            console.log("Counter Island loaded", { count: ${count}, entityId: "${entityId || ''}" });
          `}
        </safeScript>
        
        <div className="counter-island">
          <div className="island-header">
            <h3>{title}</h3>
            <span className="hydration-info">
              Strategy: {context?.strategy || 'immediate'} | 
              Trust: {context?.trustLevel || 'local'}
            </span>
          </div>
          <div className="island-content">
            <div className="count-display">{count}</div>
            <div className="controls">
              <button className="decrement-btn" zk-entity={entityId}>-</button>
              <button className="increment-btn" zk-entity={entityId}>+</button>
              <button className="reset-btn" zk-entity={entityId}>Reset</button>
            </div>
            {entityId && <div className="entity-info">Entity ID: {entityId}</div>}
          </div>
          <div className="island-footer">
            <span className="hydration-time">Hydrated in {Math.round(performance.now() - startTime)}ms</span>
          </div>
        </div>
      </Hydra>
    );
    
    // Render the content to the element
    element.appendChild(content as unknown as Node);
    
    // Get references to DOM elements
    const countDisplay = element.querySelector('.count-display') as HTMLDivElement;
    const incrementBtn = element.querySelector('.increment-btn') as HTMLButtonElement;
    const decrementBtn = element.querySelector('.decrement-btn') as HTMLButtonElement;
    const resetBtn = element.querySelector('.reset-btn') as HTMLButtonElement;

    // Add event handlers
    const updateCountDisplay = () => {
      countDisplay.textContent = count.toString();
    };
    
    incrementBtn.addEventListener('click', () => {
      count++;
      updateCountDisplay();
      
      // If an entity ID was provided, update the ECS component
      if (entityId && context?.kernel) {
        const ecs = context.kernel.getECS();
        const counterComponent = ecs.getComponent(entityId, 'Counter');
        if (counterComponent) {
          counterComponent.value = count;
        }
      }
    });
    
    decrementBtn.addEventListener('click', () => {
      count--;
      updateCountDisplay();
      
      // If an entity ID was provided, update the ECS component
      if (entityId && context?.kernel) {
        const ecs = context.kernel.getECS();
        const counterComponent = ecs.getComponent(entityId, 'Counter');
        if (counterComponent) {
          counterComponent.value = count;
        }
      }
    });
    
    resetBtn.addEventListener('click', () => {
      count = 0;
      updateCountDisplay();
      
      // If an entity ID was provided, update the ECS component
      if (entityId && context?.kernel) {
        const ecs = context.kernel.getECS();
        const counterComponent = ecs.getComponent(entityId, 'Counter');
        if (counterComponent) {
          counterComponent.value = 0;
        }
      }
    });
    
    // Register cleanup function to be called when the element receives zenith:cleanup event
    element.addEventListener('zenith:cleanup', () => {
      incrementBtn.removeEventListener('click', () => {});
      decrementBtn.removeEventListener('click', () => {});
      resetBtn.removeEventListener('click', () => {});
      console.log('CounterIsland: Unmounted and cleaned up');
    });
    
    // Return void instead of a cleanup function
    return;
  }
};

// Add metadata for the island
export const metadata = {
  name: 'CounterIsland',
  version: '1.0.0',
  trustLevel: 'local' as const,
  hydrationStrategies: ['immediate', 'visible', 'interaction', 'idle'] as const,
  ecsComponents: ['Counter']
};

export default CounterIsland;
