import ExampleIsland, { metadata } from '../../../../src/modules/Rendering/islands/ExampleIsland';
import type { HydraContext } from '../../../../src/lib/hydra-runtime';

describe('ExampleIsland', () => {
  let container: HTMLElement;
  let context: HydraContext;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    context = { peerId: 'test-peer' };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should mount with default props', async () => {
    await ExampleIsland.mount(container, {}, context);

    expect(container.querySelector('.example-island')).toBeTruthy();
    expect(container.querySelector('h3')).toHaveTextContent('Example Island');
    expect(container.querySelector('.island-content p')).toHaveTextContent('Hello from Example Island!');
  });

  it('should mount with custom props', async () => {
    const props = {
      title: 'Custom Title',
      message: 'Custom Message',
      entityId: 123
    };

    await ExampleIsland.mount(container, props, context);

    expect(container.querySelector('h3')).toHaveTextContent('Custom Title');
    expect(container.querySelector('.island-content')).toHaveTextContent('Custom Message');
    expect(container.querySelector('.island-content')).toHaveTextContent('Entity ID: 123');
  });

  it('should handle button clicks', async () => {
    await ExampleIsland.mount(container, {}, context);

    const button = container.querySelector('.island-button') as HTMLButtonElement;
    expect(button).toBeTruthy();

    // First click
    button.click();
    expect(button).toHaveTextContent('Clicked 1 time!');

    // Second click
    button.click();
    expect(button).toHaveTextContent('Clicked 2 times!');
  });

  it('should include peer ID from context', async () => {
    await ExampleIsland.mount(container, {}, context);

    expect(container.querySelector('.island-content')).toHaveTextContent('Peer ID: test-peer');
  });

  it('should return cleanup function', async () => {
    const cleanup = await ExampleIsland.mount(container, {}, context);

    expect(container.children.length).toBeGreaterThan(0);
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(container.children.length).toBe(0);
  });

  it('should have correct metadata', () => {
    expect(metadata).toEqual({
      name: 'ExampleIsland',
      version: '1.0.0',
      trustLevel: 'local',
      hydrationStrategies: ['immediate', 'visible', 'interaction', 'idle', 'manual']
    });
  });
});