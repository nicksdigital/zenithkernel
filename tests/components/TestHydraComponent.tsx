import React from 'react';

export interface TestHydraComponentProps {
  message: string;
  peerId: string;
  timestamp?: number;
}

/**
 * TestHydraComponent - A simple component for testing Hydra hydration
 */
export const TestHydraComponent: React.FC<TestHydraComponentProps> = ({
  message,
  peerId,
  timestamp = Date.now()
}) => {
  return (
    <div data-testid="test-hydra-component" className="test-hydra-component">
      <h3>Hydrated Component</h3>
      <p data-testid="hydra-message">Message: {message}</p>
      <p data-testid="hydra-peer">From Peer: {peerId}</p>
      <p data-testid="hydra-timestamp">Timestamp: {timestamp}</p>
      <div data-testid="hydra-status" className="hydra-status">
        ✅ Successfully Hydrated
      </div>
    </div>
  );
};
