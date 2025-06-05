/**
 * Reactive Counter Island - Demonstrates useState and useRef functionality
 *
 * This island component showcases the new reactive state management system
 * with automatic DOM updates and ECS integration.
 */

import { jsx, useState, useRef, useEffect, useMemo } from '../jsx-runtime';
import type { IslandComponent } from '../types';

interface CounterProps {
  initialCount?: number;
  step?: number;
  maxCount?: number;
  ecsEntity?: number;
}

/**
 * Reactive Counter Component using Zenith's useState and useRef
 */
function ReactiveCounter(props: CounterProps): HTMLElement {
  const { initialCount = 0, step = 1, maxCount = 100 } = props;

  // State management with useState
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [history, setHistory] = useState<number[]>([initialCount]);

  // Refs for DOM elements
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);

  // Computed values using useMemo
  const isAtMax = useMemo(() => count >= maxCount, [count, maxCount]);
  const isAtMin = useMemo(() => count <= 0, [count]);
  const averageCount = useMemo(() => {
    if (history.length === 0) return 0;
    return history.reduce((sum, val) => sum + val, 0) / history.length;
  }, [history]);

  // Effects for side effects
  useEffect(() => {
    console.log(`Counter value changed to: ${count}`);

    // Add to history
    setHistory(prev => [...prev.slice(-9), count]); // Keep last 10 values

    // Animate counter
    if (counterRef.current) {
      setIsAnimating(true);
      counterRef.current.style.transform = 'scale(1.2)';
      counterRef.current.style.color = count > initialCount ? '#4ade80' : '#f87171';

      setTimeout(() => {
        if (counterRef.current) {
          counterRef.current.style.transform = 'scale(1)';
          counterRef.current.style.color = '';
        }
        setIsAnimating(false);
      }, 200);
    }
  }, [count]);

  // Event handlers
  const increment = () => {
    if (count < maxCount) {
      setCount(prev => prev + step);
    }
  };

  const decrement = () => {
    if (count > 0) {
      setCount(prev => prev - step);
    }
  };

  const reset = () => {
    setCount(initialCount);
  };

  const randomize = () => {
    const randomValue = Math.floor(Math.random() * (maxCount + 1));
    setCount(randomValue);
  };

  // Render the component
  return (
    <div
      className="reactive-counter"
      style={{
        padding: '20px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '400px',
        margin: '0 auto'
      }}
      reactive={true}
      ecsEntity={props.ecsEntity}
    >
      <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>
        Reactive Counter Island
      </h3>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span
          ref={counterRef}
          reactive={true}
          :style={() => ({
            fontSize: '3rem',
            fontWeight: 'bold',
            color: isAtMax ? '#dc2626' : isAtMin ? '#9ca3af' : '#1f2937',
            transition: 'all 0.2s ease',
            display: 'inline-block'
          })}
        >
          {count}
        </span>

        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '8px' }}>
          Average: {averageCount.toFixed(1)} |
          Range: 0 - {maxCount} |
          Step: {step}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        <button
          onClick={decrement}
          reactive={true}
          :disabled={() => isAtMin || isAnimating}
          :style={() => ({
            padding: '8px 16px',
            backgroundColor: isAtMin ? '#f3f4f6' : '#ef4444',
            color: isAtMin ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAtMin ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          })}
        >
          -{step}
        </button>

        <button
          ref={buttonRef}
          onClick={increment}
          reactive={true}
          :disabled={() => isAtMax || isAnimating}
          :style={() => ({
            padding: '8px 16px',
            backgroundColor: isAtMax ? '#f3f4f6' : '#10b981',
            color: isAtMax ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAtMax ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          })}
        >
          +{step}
        </button>

        <button
          onClick={reset}
          disabled={isAnimating}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Reset
        </button>

        <button
          onClick={randomize}
          disabled={isAnimating}
          style={{
            padding: '8px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Random
        </button>
      </div>

      <div
        ref={historyRef}
        style={{
          backgroundColor: '#f9fafb',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}
      >
        <div style={{ fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
          Recent History:
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {history.slice(-10).map((value, index) => (
            <span
              key={index}
              style={{
                padding: '2px 6px',
                backgroundColor: value === count ? '#dbeafe' : '#e5e7eb',
                borderRadius: '3px',
                fontSize: '0.75rem',
                color: value === count ? '#1d4ed8' : '#6b7280'
              }}
            >
              {value}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#9ca3af' }}>
        <div>State updates: {history.length}</div>
        <div>Animation: {isAnimating ? 'Active' : 'Idle'}</div>
        <div>ECS Entity: {props.ecsEntity || 'None'}</div>
      </div>
    </div>
  ) as HTMLElement;
}

// Island component implementation
const ReactiveCounterIsland: IslandComponent = {
  async mount(element: HTMLElement, props: CounterProps = {}, context: any = {}) {
    // Clear existing content
    element.innerHTML = '';

    // Create the reactive counter component
    const counter = ReactiveCounter({
      initialCount: props.initialCount || 0,
      step: props.step || 1,
      maxCount: props.maxCount || 100,
      ecsEntity: context.ecsEntity
    });

    // Mount the component
    element.appendChild(counter);

    // Add island-specific styling
    element.style.display = 'block';
    element.style.width = '100%';

    // Return cleanup function
    return () => {
      // Cleanup reactive state
      const event = new CustomEvent('zenith:cleanup');
      counter.dispatchEvent(event);

      // Clear content
      element.innerHTML = '';
    };
  }
};

export default ReactiveCounterIsland;
