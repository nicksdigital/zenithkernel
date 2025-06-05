import { HydrationController, HydrationStrategy } from '../../../src/modules/Rendering/hydration-controller';
import type { HydraContext } from '../../../src/lib/hydra-runtime';

describe('HydrationController', () => {
  let hydrationController: HydrationController;
  let mockHydrateComponent: jest.Mock;
  let element: HTMLElement;

  beforeEach(() => {
    // Setup mock hydrate function
    mockHydrateComponent = jest.fn().mockResolvedValue(undefined);
    hydrationController = new HydrationController(mockHydrateComponent);

    // Setup test element
    element = document.createElement('div');
    element.id = 'test-island';
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Cleanup
    document.body.removeChild(element);
    hydrationController.destroy();
    jest.clearAllMocks();
  });

  describe('Immediate Hydration', () => {
    it('should hydrate immediately when strategy is immediate', () => {
      const context: HydraContext = { peerId: 'test' };
      
      hydrationController.queueHydration(element, 'TestIsland', context, 'immediate');
      
      // Wait for next animation frame
      jest.runOnlyPendingTimers();
      
      expect(mockHydrateComponent).toHaveBeenCalledWith(
        'test-island',
        'TestIsland',
        context
      );
    });
  });

  describe('Visible Hydration', () => {
    it('should hydrate when element becomes visible', () => {
      const context: HydraContext = { peerId: 'test' };
      const mockIntersectionObserver = jest.fn();
      
      // Mock Intersection Observer
      (window as any).IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: mockIntersectionObserver,
        disconnect: jest.fn(),
        unobserve: jest.fn()
      }));

      hydrationController.queueHydration(element, 'TestIsland', context, 'visible');
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(element);
      expect(mockHydrateComponent).not.toHaveBeenCalled();
    });
  });

  describe('Interaction Hydration', () => {
    it('should hydrate on user interaction', () => {
      const context: HydraContext = { peerId: 'test' };
      
      hydrationController.queueHydration(element, 'TestIsland', context, 'interaction');
      
      // Simulate user interaction
      element.click();
      jest.runOnlyPendingTimers();
      
      expect(mockHydrateComponent).toHaveBeenCalledWith(
        'test-island',
        'TestIsland',
        context
      );
    });
  });

  describe('Idle Hydration', () => {
    it('should hydrate during idle time', () => {
      const context: HydraContext = { peerId: 'test' };
      const mockRequestIdleCallback = jest.fn();
      
      // Mock requestIdleCallback
      (window as any).requestIdleCallback = mockRequestIdleCallback;
      
      hydrationController.queueHydration(element, 'TestIsland', context, 'idle');
      
      expect(mockRequestIdleCallback).toHaveBeenCalled();
    });
  });

  describe('Manual Hydration', () => {
    it('should only hydrate when manually triggered', () => {
      const context: HydraContext = { peerId: 'test' };
      
      hydrationController.queueHydration(element, 'TestIsland', context, 'manual');
      
      // Should not hydrate automatically
      jest.runOnlyPendingTimers();
      expect(mockHydrateComponent).not.toHaveBeenCalled();
      
      // Should hydrate when manually triggered
      hydrationController.triggerManualHydration('test-island');
      jest.runOnlyPendingTimers();
      
      expect(mockHydrateComponent).toHaveBeenCalledWith(
        'test-island',
        'TestIsland',
        context
      );
    });
  });

  describe('Priority Handling', () => {
    it('should process items in priority order', () => {
      const context: HydraContext = { peerId: 'test' };
      const element2 = document.createElement('div');
      element2.id = 'test-island-2';
      document.body.appendChild(element2);
      
      // Queue items with different priorities
      hydrationController.queueHydration(element2, 'TestIsland2', context, 'idle');
      hydrationController.queueHydration(element, 'TestIsland1', context, 'immediate');
      
      jest.runOnlyPendingTimers();
      
      // Immediate should be processed before idle
      expect(mockHydrateComponent.mock.calls[0][1]).toBe('TestIsland1');
      
      document.body.removeChild(element2);
    });
  });

  describe('Error Handling', () => {
    it('should handle hydration errors gracefully', () => {
      const context: HydraContext = { peerId: 'test' };
      mockHydrateComponent.mockRejectedValueOnce(new Error('Test error'));
      
      // Should not throw
      expect(() => {
        hydrationController.queueHydration(element, 'TestIsland', context, 'immediate');
        jest.runOnlyPendingTimers();
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources when destroyed', () => {
      const mockDisconnect = jest.fn();
      const mockUnobserve = jest.fn();
      
      // Mock Intersection Observer
      (window as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        disconnect: mockDisconnect,
        unobserve: mockUnobserve
      }));
      
      hydrationController.queueHydration(element, 'TestIsland', { peerId: 'test' }, 'visible');
      hydrationController.destroy();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});