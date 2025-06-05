/**
 * Tests for the Reactive State Management System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  initializeComponent,
  withComponent,
  getComponentInstance,
  cleanupComponent
} from '../src/core/reactive-state';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement;
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

describe('Reactive State Management', () => {
  let testElement: HTMLElement;

  beforeEach(() => {
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    if (testElement.parentNode) {
      testElement.parentNode.removeChild(testElement);
    }
    cleanupComponent(testElement);
  });

  describe('useState', () => {
    it('should create state with initial value', () => {
      const component = initializeComponent(testElement);

      let stateValue: number;
      let setState: (value: number) => void;

      withComponent(component, () => {
        [stateValue, setState] = useState(42);
      });

      expect(stateValue!).toBe(42);
      expect(typeof setState!).toBe('function');
    });

    it('should update state value', () => {
      const component = initializeComponent(testElement);
      let stateValue: number;
      let setState: (value: number) => void;

      withComponent(component, () => {
        [stateValue, setState] = useState(0);
      });

      // Update state
      setState!(10);

      // Re-run to get updated value
      withComponent(component, () => {
        [stateValue] = useState(0);
      });

      expect(stateValue!).toBe(10);
    });

    it('should support functional updates', () => {
      const component = initializeComponent(testElement);
      let stateValue: number;
      let setState: (value: number | ((prev: number) => number)) => void;

      withComponent(component, () => {
        [stateValue, setState] = useState(5);
      });

      // Functional update
      setState!((prev) => prev * 2);

      // Re-run to get updated value
      withComponent(component, () => {
        [stateValue] = useState(5);
      });

      expect(stateValue!).toBe(10);
    });
  });

  describe('useRef', () => {
    it('should create ref with initial value', () => {
      const component = initializeComponent(testElement);
      let ref: { current: string };

      withComponent(component, () => {
        ref = useRef('initial');
      });

      expect(ref!.current).toBe('initial');
    });

    it('should maintain ref value across renders', () => {
      const component = initializeComponent(testElement);
      let ref1: { current: string } = { current: '' };
      let ref2: { current: string } = { current: '' };

      // First render
      withComponent(component, () => {
        ref1 = useRef('test');
      });

      // Modify ref
      if(typeof ref1 !== 'undefined') ref1.current = 'modified';

      // Second render
      withComponent(component, () => {
        ref2 = useRef('test');
      });

      expect(ref2!.current).toBe('modified');
      expect(ref1).toBe(ref2); // Same object reference
    });
  });

  describe('useEffect', () => {
    it('should run effect on mount', (done) => {
      const component = initializeComponent(testElement);
      let effectRan = false;

      withComponent(component, () => {
        useEffect(() => {
          effectRan = true;
        }, []);
      });

      // Effects run asynchronously
      setTimeout(() => {
        expect(effectRan).toBe(true);
       
      }, 10);
    });

    it('should run effect when dependencies change', (done) => {
      const component = initializeComponent(testElement);
      let effectCount = 0;
      let state: number;
      let setState: (value: number) => void;

      // First render
      withComponent(component, () => {
        [state, setState] = useState(1);
        useEffect(() => {
          effectCount++;
        }, [state]);
      });

      // Change state
      setState!(2);

      // Second render
      withComponent(component, () => {
        [state] = useState(1);
        useEffect(() => {
          effectCount++;
        }, [state]);
      });

      setTimeout(() => {
        expect(effectCount).toBe(2);
        
      }, 20);
    });

    it('should cleanup effect on unmount', (done) => {
      const component = initializeComponent(testElement);
      let cleanupRan = false;

      withComponent(component, () => {
        useEffect(() => {
          return () => {
            cleanupRan = true;
          };
        }, []);
      });

      // Cleanup component
      cleanupComponent(testElement);

      setTimeout(() => {
        expect(cleanupRan).toBe(true);
       
      }, 10);
    });
  });

  describe('useMemo', () => {
    it('should memoize computed value', () => {
      const component = initializeComponent(testElement);
      let computeCount = 0;
      let memoValue: string;

      const compute = (input: string) => {
        computeCount++;
        return input.toUpperCase();
      };

      // First render
      withComponent(component, () => {
        memoValue = useMemo(() => compute('hello'), ['hello']);
      });

      expect(memoValue!).toBe('HELLO');
      expect(computeCount).toBe(1);

      // Second render with same deps
      withComponent(component, () => {
        memoValue = useMemo(() => compute('hello'), ['hello']);
      });

      expect(memoValue!).toBe('HELLO');
      expect(computeCount).toBe(1); // Should not recompute
    });

    it('should recompute when dependencies change', () => {
      const component = initializeComponent(testElement);
      let computeCount = 0;
      let memoValue: string;

      const compute = (input: string) => {
        computeCount++;
        return input.toUpperCase();
      };

      // First render
      withComponent(component, () => {
        memoValue = useMemo(() => compute('hello'), ['hello']);
      });

      expect(computeCount).toBe(1);

      // Second render with different deps
      withComponent(component, () => {
        memoValue = useMemo(() => compute('world'), ['world']);
      });

      expect(memoValue!).toBe('WORLD');
      expect(computeCount).toBe(2); // Should recompute
    });
  });

  describe('useCallback', () => {
    it('should memoize callback function', () => {
      const component = initializeComponent(testElement);
      let callback1: () => void;
      let callback2: () => void;

      // First render
      withComponent(component, () => {
        callback1 = useCallback(() => {}, []);
      });

      // Second render with same deps
      withComponent(component, () => {
        callback2 = useCallback(() => {}, []);
      });

      expect(callback1!).toBe(callback2!); // Same function reference
    });

    it('should create new callback when dependencies change', () => {
      const component = initializeComponent(testElement);
      let callback1: () => void;
      let callback2: () => void;

      // First render
      withComponent(component, () => {
        callback1 = useCallback(() => {}, ['dep1']);
      });

      // Second render with different deps
      withComponent(component, () => {
        callback2 = useCallback(() => {}, ['dep2']);
      });

      expect(callback1!).not.toBe(callback2!); // Different function reference
    });
  });

  describe('Component Instance Management', () => {
    it('should initialize component instance', () => {
      const component = initializeComponent(testElement);

      expect(component).toBeDefined();
      expect(component.element).toBe(testElement);
      expect(component.hooks).toEqual([]);
      expect(component.isHydrated).toBe(false);
    });

    it('should get component instance', () => {
      const component = initializeComponent(testElement);
      const retrieved = getComponentInstance(testElement);

      expect(retrieved).toBe(component);
    });

    it('should cleanup component instance', () => {
      initializeComponent(testElement);

      cleanupComponent(testElement);

      const retrieved = getComponentInstance(testElement);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Vue-Style Reactive Bindings', () => {
    it('should handle Vue-style class bindings with objects', () => {
      const component = initializeComponent(testElement);
      let isActive: boolean;
      let setIsActive: (value: boolean) => void;

      withComponent(component, () => {
        [isActive, setIsActive] = useState(false);
      });

      // Simulate Vue-style class binding
      const classGetter = () => ({
        'active': isActive,
        'disabled': !isActive
      });

      // Test initial state
      const result1 = classGetter();
      expect(result1).toEqual({ 'active': false, 'disabled': true });

      // Update state
      setIsActive!(true);

      // Re-run to get updated value
      withComponent(component, () => {
        [isActive] = useState(false);
      });

      // Test updated state
      const result2 = classGetter();
      expect(result2).toEqual({ 'active': true, 'disabled': false });
    });

    it('should handle Vue-style style bindings with objects', () => {
      const component = initializeComponent(testElement);
      let color: string;
      let setColor: (value: string) => void;
      let size: number;
      let setSize: (value: number) => void;

      withComponent(component, () => {
        [color, setColor] = useState('#blue');
        [size, setSize] = useState(16);
      });

      // Simulate Vue-style style binding
      const styleGetter = () => ({
        color: color,
        fontSize: `${size}px`,
        display: 'block'
      });

      // Test initial state
      const result1 = styleGetter();
      expect(result1).toEqual({
        color: '#blue',
        fontSize: '16px',
        display: 'block'
      });

      // Update state
      setColor!('#red');
      setSize!(20);

      // Re-run to get updated values
      withComponent(component, () => {
        [color] = useState('#blue');
        [size] = useState(16);
      });

      // Test updated state
      const result2 = styleGetter();
      expect(result2).toEqual({
        color: '#red',
        fontSize: '20px',
        display: 'block'
      });
    });
  });
});
