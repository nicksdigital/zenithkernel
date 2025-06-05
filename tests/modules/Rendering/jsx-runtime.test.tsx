/**
 * Tests for ZenithKernel Custom JSX Runtime
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jsx, jsxs, Fragment, createElement, h } from '../../../src/modules/Rendering/jsx-runtime';

// Mock DOM environment setup
beforeEach(() => {
  // Clear the document body
  document.body.innerHTML = '';
});

describe('ZenithKernel JSX Runtime', () => {
  describe('jsx function', () => {
    it('should create basic HTML elements', () => {
      const element = jsx('div', { className: 'test' });
      
      expect(element).toBeInstanceOf(HTMLDivElement);
      expect(element.className).toBe('test');
    });

    it('should handle text content as children', () => {
      const element = jsx('div', { children: 'Hello, World!' });
      
      expect(element.textContent).toBe('Hello, World!');
    });

    it('should handle multiple children', () => {
      const child1 = jsx('span', { children: 'Child 1' });
      const child2 = jsx('span', { children: 'Child 2' });
      const element = jsx('div', { children: [child1, child2] });
      
      expect(element.children).toHaveLength(2);
      expect(element.children[0].textContent).toBe('Child 1');
      expect(element.children[1].textContent).toBe('Child 2');
    });

    it('should handle event listeners', () => {
      const clickHandler = vi.fn();
      const element = jsx('button', { onClick: clickHandler });
      
      // Trigger click event
      element.click();
      
      expect(clickHandler).toHaveBeenCalledOnce();
    });

    it('should handle style objects', () => {
      const element = jsx('div', { 
        style: { color: 'red', fontSize: '16px' }
      });
      
      expect(element.style.color).toBe('red');
      expect(element.style.fontSize).toBe('16px');
    });

    it('should handle boolean attributes', () => {
      const element = jsx('input', { 
        type: 'checkbox',
        checked: true,
        disabled: false
      });
      
      expect(element.hasAttribute('checked')).toBe(true);
      expect(element.hasAttribute('disabled')).toBe(false);
    });

    it('should handle ref callbacks', () => {
      const refCallback = vi.fn();
      const element = jsx('div', { ref: refCallback });
      
      expect(refCallback).toHaveBeenCalledWith(element);
    });

    it('should handle functional components', () => {
      const TestComponent = (props: { text: string; children?: any }) => {
        return jsx('div', { 
          className: 'test-component',
          children: [props.text, props.children]
        });
      };

      const element = jsx(TestComponent, { 
        text: 'Test',
        children: jsx('span', { children: 'Child' })
      });

      expect(element.className).toBe('test-component');
      expect(element.textContent).toContain('Test');
      expect(element.querySelector('span')?.textContent).toBe('Child');
    });

    it('should ignore null and undefined children', () => {
      const element = jsx('div', { 
        children: ['Hello', null, undefined, 'World'] 
      });
      
      expect(element.textContent).toBe('HelloWorld');
    });

    it('should handle nested elements', () => {
      const element = jsx('div', {
        className: 'container',
        children: jsx('div', {
          className: 'inner',
          children: jsx('span', {
            children: 'Nested content'
          })
        })
      });

      expect(element.className).toBe('container');
      expect(element.querySelector('.inner')).toBeTruthy();
      expect(element.querySelector('span')?.textContent).toBe('Nested content');
    });
  });

  describe('jsxs function', () => {
    it('should work as alias for jsx', () => {
      const element1 = jsx('div', { className: 'test' });
      const element2 = jsxs('div', { className: 'test' });
      
      expect(element1.className).toBe(element2.className);
      expect(element1.tagName).toBe(element2.tagName);
    });
  });

  describe('Fragment', () => {
    it('should create document fragment', () => {
      const fragment = Fragment({ children: [] });
      
      expect(fragment).toBeInstanceOf(DocumentFragment);
    });

    it('should handle children in fragment', () => {
      const child1 = jsx('div', { children: 'Child 1' });
      const child2 = jsx('div', { children: 'Child 2' });
      const fragment = Fragment({ children: [child1, child2] });
      
      expect(fragment.children).toHaveLength(2);
    });

    it('should work with jsx function', () => {
      const element = jsx('div', {
        children: jsx(Fragment, {
          children: [
            jsx('span', { children: 'Fragment child 1' }),
            jsx('span', { children: 'Fragment child 2' })
          ]
        })
      });

      expect(element.children).toHaveLength(2);
      expect(element.children[0].textContent).toBe('Fragment child 1');
      expect(element.children[1].textContent).toBe('Fragment child 2');
    });
  });

  describe('createElement', () => {
    it('should work like jsx with spread children', () => {
      const element = createElement('div', 
        { className: 'test' },
        'Child 1',
        jsx('span', { children: 'Child 2' })
      );

      expect(element.className).toBe('test');
      expect(element.textContent).toContain('Child 1');
      expect(element.querySelector('span')?.textContent).toBe('Child 2');
    });
  });

  describe('h function (legacy)', () => {
    it('should work like createElement', () => {
      const element = h('div',
        { className: 'legacy' },
        'Legacy child'
      );

      expect(element.className).toBe('legacy');
      expect(element.textContent).toBe('Legacy child');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complex nested structure with events', () => {
      const submitHandler = vi.fn();
      const inputChangeHandler = vi.fn();

      const form = jsx('form', {
        onSubmit: submitHandler,
        children: [
          jsx('div', {
            className: 'form-group',
            children: [
              jsx('label', { children: 'Name:' }),
              jsx('input', {
                type: 'text',
                name: 'name',
                onChange: inputChangeHandler
              })
            ]
          }),
          jsx('button', {
            type: 'submit',
            children: 'Submit'
          })
        ]
      });

      // Test structure
      expect(form.tagName).toBe('FORM');
      expect(form.querySelector('.form-group')).toBeTruthy();
      expect(form.querySelector('label')?.textContent).toBe('Name:');
      expect(form.querySelector('input')?.getAttribute('name')).toBe('name');
      expect(form.querySelector('button')?.textContent).toBe('Submit');

      // Test events
      const input = form.querySelector('input') as HTMLInputElement;
      const submitButton = form.querySelector('button') as HTMLButtonElement;

      // Simulate input change
      input.dispatchEvent(new Event('change'));
      expect(inputChangeHandler).toHaveBeenCalledOnce();

      // Simulate form submit
      form.dispatchEvent(new Event('submit'));
      expect(submitHandler).toHaveBeenCalledOnce();
    });

    it('should handle island-like component structure', () => {
      const IslandComponent = (props: { 
        id: string; 
        title: string; 
        children?: any 
      }) => {
        return jsx('div', {
          className: 'island-component',
          'data-island-id': props.id,
          children: [
            jsx('h3', { children: props.title }),
            jsx('div', { 
              className: 'island-content',
              children: props.children
            })
          ]
        });
      };

      const island = jsx(IslandComponent, {
        id: 'test-island',
        title: 'Test Island',
        children: jsx('p', { children: 'Island content' })
      });

      expect(island.className).toBe('island-component');
      expect(island.getAttribute('data-island-id')).toBe('test-island');
      expect(island.querySelector('h3')?.textContent).toBe('Test Island');
      expect(island.querySelector('.island-content p')?.textContent).toBe('Island content');
    });
  });
});
