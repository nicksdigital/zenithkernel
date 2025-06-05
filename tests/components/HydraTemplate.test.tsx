import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jsx } from '../../src/modules/Rendering/jsx-runtime';

describe('Hydra Template Syntax', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should create a Hydra island with template syntax', () => {
    const element = jsx('Hydra', {
      type: 'island',
      id: 'test-island',
      entry: 'TestComponent.tsx',
      execType: 'local',
      context: { message: 'Hello from island!' },
      children: [
        jsx('div', {
          className: 'island-content',
          children: 'This is an island component'
        })
      ]
    });

    document.body.appendChild(element);

    // Verify template element was created
    const template = document.querySelector('template[data-hydra-type="island"]') as HTMLTemplateElement;
    expect(template).toBeTruthy();
    expect(template?.getAttribute('data-hydra-id')).toBe('test-island');
    expect(template?.getAttribute('data-hydra-entry')).toBe('TestComponent.tsx');
    expect(template?.getAttribute('data-hydra-exec-type')).toBe('local');

    // Verify context was properly serialized
    const context = template?.getAttribute('data-hydra-context');
    expect(context).toBeTruthy();
    expect(JSON.parse(context!)).toEqual({ message: 'Hello from island!' });

    // Verify children were added to template content
    const content = template?.content;
    expect(content?.querySelector('.island-content')).toBeTruthy();
    expect(content?.querySelector('.island-content')?.textContent)
      .toBe('This is an island component');
  });

  it('should handle nested Hydra islands', () => {
    const element = jsx('div', {
      children: [
        jsx('Hydra', {
          type: 'island',
          id: 'parent-island',
          entry: 'ParentComponent.tsx',
          execType: 'local',
          children: [
            jsx('div', { children: 'Parent Island' }),
            jsx('Hydra', {
              type: 'island',
              id: 'child-island',
              entry: 'ChildComponent.tsx',
              execType: 'remote',
              children: jsx('div', { children: 'Child Island' })
            })
          ]
        })
      ]
    });

    document.body.appendChild(element);

    // Verify parent template
    const parentTemplate = document.querySelector('template[data-hydra-id="parent-island"]') as HTMLTemplateElement;
    expect(parentTemplate).toBeTruthy();
    expect(parentTemplate?.getAttribute('data-hydra-entry')).toBe('ParentComponent.tsx');

    // Verify child template
    const childTemplate = document.querySelector('template[data-hydra-id="child-island"]') as HTMLTemplateElement;
    expect(childTemplate).toBeTruthy();
    expect(childTemplate?.getAttribute('data-hydra-entry')).toBe('ChildComponent.tsx');
    expect(childTemplate?.getAttribute('data-hydra-exec-type')).toBe('remote');

    // Verify content hierarchy
    // Check that the parent template is in the DOM
    expect(parentTemplate?.parentElement).toBeTruthy();
    // Check that the child template is a descendant of the parent template in the DOM
    const childInParent = parentTemplate?.querySelector('template[data-hydra-id="child-island"]');
    expect(childInParent).toBeTruthy();
  });

  it('should throw error for invalid Hydra type', () => {
    expect(() => {
      jsx('Hydra', {
        type: 'invalid',
        id: 'test-island'
      });
    }).toThrow('Hydra component must have type="island"');
  });

  it('should handle remote execution with context', () => {
    const element = jsx('Hydra', {
      type: 'island',
      id: 'remote-island',
      entry: 'RemoteComponent.wasm',
      execType: 'remote',
      context: {
        peerId: 'peer123',
        zkProof: 'proof_abc123',
        trustScore: 95
      }
    });

    document.body.appendChild(element);

    const template = document.querySelector('template[data-hydra-id="remote-island"]') as HTMLTemplateElement;
    expect(template).toBeTruthy();
    expect(template?.getAttribute('data-hydra-exec-type')).toBe('remote');

    const context = JSON.parse(template?.getAttribute('data-hydra-context') || '{}');
    expect(context).toEqual({
      peerId: 'peer123',
      zkProof: 'proof_abc123',
      trustScore: 95
    });
  });
}); 