/**
 * Tests for ZenithKernel Example Islands
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ECSCounterIsland from '../../../src/modules/Rendering/islands/ECSCounterIsland';
import HydraStatusIsland from '../../../src/modules/Rendering/islands/HydraStatusIsland';
import HydraRegistryIsland from '../../../src/modules/Rendering/islands/HydraRegistryIsland';

describe('ZenithKernel Example Islands', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('ECSCounterIsland', () => {
    it('should mount successfully with default props', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await ECSCounterIsland.mount(element, {});

      expect(element.querySelector('.ecs-counter-island')).toBeTruthy();
      expect(element.querySelector('.counter-value')).toBeTruthy();
      expect(element.querySelector('.increment-btn')).toBeTruthy();
      expect(element.querySelector('.decrement-btn')).toBeTruthy();
      expect(element.querySelector('.reset-btn')).toBeTruthy();
    });

    it('should display custom label and initial value', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await ECSCounterIsland.mount(element, {
        label: 'Custom Counter',
        initialValue: 10
      });

      const header = element.querySelector('.counter-header h3');
      const value = element.querySelector('.counter-value');

      expect(header?.textContent).toBe('Custom Counter');
      expect(value?.textContent).toBe('10');
    });

    it('should handle increment button clicks', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await ECSCounterIsland.mount(element, {
        initialValue: 5,
        step: 2
      });

      const incrementBtn = element.querySelector('.increment-btn') as HTMLButtonElement;
      const valueDisplay = element.querySelector('.counter-value');

      expect(valueDisplay?.textContent).toBe('5');

      incrementBtn.click();
      expect(valueDisplay?.textContent).toBe('7');

      incrementBtn.click();
      expect(valueDisplay?.textContent).toBe('9');
    });

    it('should handle decrement button clicks', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await ECSCounterIsland.mount(element, {
        initialValue: 10,
        step: 3
      });

      const decrementBtn = element.querySelector('.decrement-btn') as HTMLButtonElement;
      const valueDisplay = element.querySelector('.counter-value');

      expect(valueDisplay?.textContent).toBe('10');

      decrementBtn.click();
      expect(valueDisplay?.textContent).toBe('7');

      decrementBtn.click();
      expect(valueDisplay?.textContent).toBe('4');
    });

    it('should handle reset button clicks', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      const initialValue = 15;

      await ECSCounterIsland.mount(element, {
        initialValue,
        step: 1
      });

      const incrementBtn = element.querySelector('.increment-btn') as HTMLButtonElement;
      const resetBtn = element.querySelector('.reset-btn') as HTMLButtonElement;
      const valueDisplay = element.querySelector('.counter-value');

      // Increment a few times
      incrementBtn.click();
      incrementBtn.click();
      expect(valueDisplay?.textContent).toBe('17');

      // Reset
      resetBtn.click();
      expect(valueDisplay?.textContent).toBe(String(initialValue));
    });

    it('should simulate ECS connection status', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await ECSCounterIsland.mount(element, {});

      const statusDisplay = element.querySelector('.connection-status');
      expect(statusDisplay?.textContent).toBe('Connecting...');

      // Wait for connection simulation
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(statusDisplay?.textContent).toBe('Connected');
      expect(statusDisplay?.classList.contains('connected')).toBe(true);
    });

    it('should display entity ID information', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await ECSCounterIsland.mount(element, {
        entityId: 'custom-entity-123'
      });

      const entityInfo = element.querySelector('.counter-info small');
      expect(entityInfo?.textContent).toContain('custom-entity-123');
    });

    it('should generate correct view structure', () => {
      const viewElement = ECSCounterIsland.view!({
        label: 'Test View',
        initialValue: 42
      });

      expect(viewElement.className).toContain('ecs-counter-island');
      expect(viewElement.className).toContain('loading');
      expect(viewElement.querySelector('h3')?.textContent).toBe('Test View');
      expect(viewElement.querySelector('.counter-value')?.textContent).toBe('42');
      
      // Buttons should be disabled in view mode
      const buttons = viewElement.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should call unmount without errors', () => {
      const element = document.createElement('div');
      expect(() => ECSCounterIsland.unmount!(element)).not.toThrow();
    });
  });

  describe('HydraStatusIsland', () => {
    it('should mount successfully with default props', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraStatusIsland.mount(element, {});

      expect(element.querySelector('.hydra-status-island')).toBeTruthy();
      expect(element.querySelector('.status-header')).toBeTruthy();
      expect(element.querySelector('.connection-info')).toBeTruthy();
      expect(element.querySelector('.event-stats')).toBeTruthy();
    });

    it('should display custom title', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraStatusIsland.mount(element, {
        title: 'Custom Status Monitor'
      });

      const header = element.querySelector('.status-header h3');
      expect(header?.textContent).toBe('Custom Status Monitor');
    });

    it('should handle connection info visibility', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraStatusIsland.mount(element, {
        showConnectionInfo: false
      });

      expect(element.querySelector('.connection-info')).toBeFalsy();
    });

    it('should handle reconnect button', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraStatusIsland.mount(element, {});

      const reconnectBtn = element.querySelector('.reconnect-btn') as HTMLButtonElement;
      const statusText = element.querySelector('.status-text');

      expect(reconnectBtn).toBeTruthy();
      
      // Click reconnect
      reconnectBtn.click();
      expect(statusText?.textContent).toBe('Disconnected');
    });

    it('should handle clear logs button', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraStatusIsland.mount(element, {});

      const clearBtn = element.querySelector('.clear-logs-btn') as HTMLButtonElement;
      const eventCount = element.querySelector('.event-count');

      expect(clearBtn).toBeTruthy();
      
      // Click clear logs
      clearBtn.click();
      expect(eventCount?.textContent).toBe('0');
    });

    it('should simulate connection and events', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraStatusIsland.mount(element, {
        events: ['test-event']
      });

      const statusDot = element.querySelector('.status-dot');
      const statusText = element.querySelector('.status-text');

      // Initial state
      expect(statusText?.textContent).toBe('Connecting');

      // Wait for connection simulation
      await new Promise(resolve => setTimeout(resolve, 1600));

      expect(statusText?.textContent).toBe('Connected');
      expect(statusDot?.classList.contains('connected')).toBe(true);
    });

    it('should generate correct view structure', () => {
      const viewElement = HydraStatusIsland.view!({
        title: 'Test Status View'
      });

      expect(viewElement.className).toContain('hydra-status-island');
      expect(viewElement.className).toContain('loading');
      expect(viewElement.querySelector('h3')?.textContent).toBe('Test Status View');
      expect(viewElement.querySelector('.loading-message')).toBeTruthy();
    });
  });

  describe('HydraRegistryIsland', () => {
    it('should mount successfully with default props', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {});

      expect(element.querySelector('.hydra-registry-island')).toBeTruthy();
      expect(element.querySelector('.registry-header')).toBeTruthy();
      expect(element.querySelector('.instance-list')).toBeTruthy();
      expect(element.querySelector('.instance-details')).toBeTruthy();
    });

    it('should display custom title', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {
        title: 'Custom Registry View'
      });

      const header = element.querySelector('.registry-header h3');
      expect(header?.textContent).toBe('Custom Registry View');
    });

    it('should handle details visibility', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {
        showDetails: false
      });

      expect(element.querySelector('.instance-details')).toBeFalsy();
    });

    it('should handle actions visibility', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {
        allowActions: false
      });

      expect(element.querySelector('.registry-actions')).toBeFalsy();
    });

    it('should display mock instances', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {});

      // Wait a bit for instance loading
      await new Promise(resolve => setTimeout(resolve, 100));

      const instanceItems = element.querySelectorAll('.instance-item');
      const instanceCount = element.querySelector('.instance-count');

      expect(instanceItems.length).toBeGreaterThan(0);
      expect(instanceCount?.textContent).toContain('instance');
    });

    it('should handle instance selection', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {});

      // Wait for instances to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const firstInstance = element.querySelector('.instance-item') as HTMLElement;
      const detailsContent = element.querySelector('.details-content');

      // Click on first instance
      if (firstInstance) {
        firstInstance.click();
        
        // Should show details
        expect(detailsContent?.textContent).not.toBe('Select an instance to view details');
      }
    });

    it('should handle refresh button', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {});

      const refreshBtn = element.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshBtn).toBeTruthy();
      
      // Click refresh should not throw
      expect(() => refreshBtn.click()).not.toThrow();
    });

    it('should handle create instance button', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {});

      const createBtn = element.querySelector('.create-btn') as HTMLButtonElement;
      const instanceCount = element.querySelector('.instance-count');

      if (createBtn) {
        const initialCount = instanceCount?.textContent;
        createBtn.click();
        
        // Wait for update
        await new Promise(resolve => setTimeout(resolve, 50));
        
        expect(instanceCount?.textContent).not.toBe(initialCount);
      }
    });

    it('should handle cleanup button', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await HydraRegistryIsland.mount(element, {});

      const cleanupBtn = element.querySelector('.cleanup-btn') as HTMLButtonElement;
      expect(cleanupBtn).toBeTruthy();
      
      // Click cleanup should not throw
      expect(() => cleanupBtn.click()).not.toThrow();
    });

    it('should generate correct view structure', () => {
      const viewElement = HydraRegistryIsland.view!({
        title: 'Test Registry View'
      });

      expect(viewElement.className).toContain('hydra-registry-island');
      expect(viewElement.className).toContain('loading');
      expect(viewElement.querySelector('h3')?.textContent).toBe('Test Registry View');
      expect(viewElement.querySelector('.loading-spinner')).toBeTruthy();
    });

    it('should call unmount without errors', () => {
      const element = document.createElement('div');
      expect(() => HydraRegistryIsland.unmount!(element)).not.toThrow();
    });
  });

  describe('Island Metadata', () => {
    it('should export correct metadata for all islands', async () => {
      // Import metadata using dynamic imports
      const ecsModule = await import('../../../src/modules/Rendering/islands/ECSCounterIsland');
      const statusModule = await import('../../../src/modules/Rendering/islands/HydraStatusIsland');
      const registryModule = await import('../../../src/modules/Rendering/islands/HydraRegistryIsland');

      const ecsMetadata = ecsModule.metadata;
      const statusMetadata = statusModule.metadata;
      const registryMetadata = registryModule.metadata;

      expect(ecsMetadata.name).toBe('ECSCounterIsland');
      expect(ecsMetadata.trustLevel).toBe('local');
      expect(ecsMetadata.execType).toBe('local');

      expect(statusMetadata.name).toBe('HydraStatusIsland');
      expect(statusMetadata.trustLevel).toBe('local');
      expect(statusMetadata.execType).toBe('local');

      expect(registryMetadata.name).toBe('HydraRegistryIsland');
      expect(registryMetadata.trustLevel).toBe('local');
      expect(registryMetadata.execType).toBe('local');
    });
  });
});
