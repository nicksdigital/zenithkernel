import { jsx } from '../jsx-runtime';
import { IslandComponent } from '../types';
import { HydraContext } from '../../../lib/hydra-runtime';

export interface TestHydraComponentProps {
  message?: string;
  count?: number;
}

export const TestHydraComponent: IslandComponent = {
  mount: async (element: HTMLElement, props: TestHydraComponentProps, context?: HydraContext) => {
    const { message = 'Hello from Test Hydra!', count = 5 } = props;
    
    const container = (
      <div className="test-hydra-island">
        <div className="jsx-island">
          <h2>JSX Counter</h2>
          <div className="count">{count}</div>
        </div>
        <div data-testid="test-hydra-component" className="test-hydra-component">
          <h3>Hydrated Component</h3>
          <p data-testid="hydra-message">Message: {message}</p>
          <p data-testid="hydra-peer">From Peer: {context?.peerId || 'unknown'}</p>
          <p data-testid="hydra-timestamp">Timestamp: {Date.now()}</p>
          <div data-testid="hydra-status" className="hydra-status">
            ✅ Successfully Hydrated
          </div>
        </div>
      </div>
    ) as HTMLElement;

    // Replace element content
    element.innerHTML = '';
    element.appendChild(container);

    console.log('Test Hydra Component mounted:', { props, context });

    return () => {
      element.innerHTML = '';
      console.log('Test Hydra Component cleanup');
    };
  },

  unmount: (element: HTMLElement) => {
    element.innerHTML = '';
  },

  view: (props: TestHydraComponentProps) => {
    const { message = 'Hello from Test Hydra!', count = 5 } = props;
    
    return (
      <div className="test-hydra-island loading">
        <h2>Test Component</h2>
        <p>Loading: {message}</p>
        <div>Count: {count}</div>
      </div>
    ) as HTMLElement;
  }
};

// Export metadata for the island
export const metadata = {
  name: 'TestHydraComponent',
  trustLevel: 'local',
  execType: 'local',
  description: 'Test Hydra Component for integration/runtime tests.'
};

// Default export for dynamic loading
export default TestHydraComponent;