/**
 * Example Island Component demonstrating different hydration strategies
 */
import type { IslandComponent } from '../types';
import type { HydraContext } from '../../../lib/hydra-runtime';

export interface ExampleIslandProps {
  title?: string;
  message?: string;
  entityId?: number;
}

const ExampleIsland: IslandComponent = {
  async mount(element: HTMLElement, props: ExampleIslandProps, context: HydraContext) {
    // Log hydration timing
    const hydrationTime = performance.now();
    console.log(`🌊 Hydrating ExampleIsland at ${hydrationTime}ms`);

    // Create component content
    const content = document.createElement('div');
    content.className = 'example-island';
    content.innerHTML = `
      <div class="island-header">
        <h3>${props.title || 'Example Island'}</h3>
        <span class="hydration-time">Hydrated at: ${new Date().toISOString()}</span>
      </div>
      <div class="island-content">
        <p>${props.message || 'Hello from Example Island!'}</p>
        ${context.peerId ? `<p>Peer ID: ${context.peerId}</p>` : ''}
        ${props.entityId ? `<p>Entity ID: ${props.entityId}</p>` : ''}
      </div>
      <div class="island-footer">
        <button class="island-button">Click me!</button>
      </div>
    `;

    // Add interactivity
    const button = content.querySelector('.island-button');
    if (button) {
      let clickCount = 0;
      button.addEventListener('click', () => {
        clickCount++;
        button.textContent = `Clicked ${clickCount} time${clickCount === 1 ? '' : 's'}!`;
      });
    }

    // Add some styling
    const style = document.createElement('style');
    style.textContent = `
      .example-island {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin: 8px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .island-header {
        border-bottom: 1px solid #eee;
        margin-bottom: 12px;
        padding-bottom: 8px;
      }
      
      .hydration-time {
        font-size: 0.8em;
        color: #666;
        display: block;
      }
      
      .island-content {
        margin: 12px 0;
      }
      
      .island-button {
        background: #0066cc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .island-button:hover {
        background: #0052a3;
      }
    `;

    // Mount component
    element.appendChild(style);
    element.appendChild(content);

    // Return cleanup function
    return () => {
      element.removeChild(style);
      element.removeChild(content);
    };
  }
};

// Add metadata for the island
export const metadata = {
  name: 'ExampleIsland',
  version: '1.0.0',
  trustLevel: 'local' as const,
  hydrationStrategies: ['immediate', 'visible', 'interaction', 'idle', 'manual'] as const
};

export default ExampleIsland;