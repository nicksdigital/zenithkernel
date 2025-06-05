/**
 * Reactive State Demo - Comprehensive example of useState and useRef
 * 
 * This example demonstrates all the reactive state features:
 * - useState for reactive state management
 * - useRef for DOM element references
 * - useEffect for side effects
 * - useMemo for computed values
 * - useCallback for memoized functions
 * - ECS integration
 * - Reactive attribute bindings
 */

import { jsx, useState, useRef, useEffect, useMemo, useCallback } from '../src/modules/Rendering/jsx-runtime';
import { ECSManager } from '../src/core/ECSManager';

// Example 1: Basic useState and useRef
function BasicExample(): HTMLElement {
  const [message, setMessage] = useState('Hello, Zenith!');
  const [count, setCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);
  
  const updateMessage = () => {
    if (inputRef.current) {
      setMessage(inputRef.current.value);
    }
  };
  
  const focusInput = () => {
    inputRef.current?.focus();
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Basic useState & useRef Example</h3>
      
      <div>
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Enter a message"
          style={{ padding: '8px', marginRight: '8px' }}
        />
        <button onClick={updateMessage}>Update Message</button>
        <button onClick={focusInput}>Focus Input</button>
      </div>
      
      <div ref={displayRef} style={{ marginTop: '10px', fontWeight: 'bold' }}>
        {message}
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={() => setCount(c => c + 1)}>
          Count: {count}
        </button>
      </div>
    </div>
  ) as HTMLElement;
}

// Example 2: useEffect and useMemo
function EffectAndMemoExample(): HTMLElement {
  const [items, setItems] = useState<string[]>(['apple', 'banana', 'cherry']);
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Computed value using useMemo
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => 
      item.toLowerCase().includes(filter.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
  }, [items, filter, sortOrder]);
  
  // Memoized callback
  const addItem = useCallback(() => {
    const newItem = `item-${Date.now()}`;
    setItems(prev => [...prev, newItem]);
  }, []);
  
  // Effect for logging
  useEffect(() => {
    console.log(`Filtered items: ${filteredAndSortedItems.length}`);
  }, [filteredAndSortedItems]);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>useEffect & useMemo Example</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <input 
          type="text"
          placeholder="Filter items..."
          value={filter}
          onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
          style={{ padding: '8px', marginRight: '8px' }}
        />
        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          Sort: {sortOrder}
        </button>
        <button onClick={addItem}>Add Item</button>
      </div>
      
      <div>
        <strong>Items ({filteredAndSortedItems.length}):</strong>
        <ul>
          {filteredAndSortedItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  ) as HTMLElement;
}

// Example 3: Reactive attribute bindings
function ReactiveBindingsExample(): HTMLElement {
  const [color, setColor] = useState('#3b82f6');
  const [size, setSize] = useState(16);
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Reactive Attribute Bindings</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Color: 
          <input 
            type="color" 
            value={color}
            onChange={(e) => setColor((e.target as HTMLInputElement).value)}
          />
        </label>
        
        <label style={{ marginLeft: '10px' }}>
          Size: 
          <input 
            type="range" 
            min="12" 
            max="32" 
            value={size}
            onChange={(e) => setSize(parseInt((e.target as HTMLInputElement).value))}
          />
          {size}px
        </label>
        
        <label style={{ marginLeft: '10px' }}>
          <input 
            type="checkbox" 
            checked={isVisible}
            onChange={(e) => setIsVisible((e.target as HTMLInputElement).checked)}
          />
          Visible
        </label>
      </div>
      
      <div 
        reactive={true}
        style={{
          color: color,
          fontSize: `${size}px`,
          display: isVisible ? 'block' : 'none',
          padding: '10px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px'
        }}
      >
        This text changes color, size, and visibility reactively!
      </div>
    </div>
  ) as HTMLElement;
}

// Example 4: ECS Integration
function ECSIntegrationExample(): HTMLElement {
  const [ecsManager] = useState(() => new ECSManager());
  const [entityId] = useState(() => ecsManager.createEntity());
  const [health, setHealth] = useState(100);
  const [mana, setMana] = useState(50);
  
  // Update ECS components when state changes
  useEffect(() => {
    ecsManager.addComponent(entityId, 'Health', { value: health, max: 100 });
  }, [health, entityId, ecsManager]);
  
  useEffect(() => {
    ecsManager.addComponent(entityId, 'Mana', { value: mana, max: 100 });
  }, [mana, entityId, ecsManager]);
  
  const takeDamage = () => {
    setHealth(prev => Math.max(0, prev - 10));
  };
  
  const useMana = () => {
    setMana(prev => Math.max(0, prev - 15));
  };
  
  const rest = () => {
    setHealth(100);
    setMana(100);
  };
  
  return (
    <div 
      style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}
      reactive={true}
      ecsEntity={entityId}
      ecsManager={ecsManager}
    >
      <h3>ECS Integration Example</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <div>Entity ID: {entityId}</div>
        <div>Health: {health}/100</div>
        <div>Mana: {mana}/100</div>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <div 
          style={{
            width: '200px',
            height: '20px',
            backgroundColor: '#e5e7eb',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '5px'
          }}
        >
          <div 
            style={{
              width: `${health}%`,
              height: '100%',
              backgroundColor: health > 50 ? '#10b981' : health > 25 ? '#f59e0b' : '#ef4444',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
        
        <div 
          style={{
            width: '200px',
            height: '20px',
            backgroundColor: '#e5e7eb',
            borderRadius: '10px',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              width: `${mana}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>
      
      <div>
        <button onClick={takeDamage} disabled={health <= 0}>
          Take Damage
        </button>
        <button onClick={useMana} disabled={mana <= 0} style={{ marginLeft: '8px' }}>
          Use Mana
        </button>
        <button onClick={rest} style={{ marginLeft: '8px' }}>
          Rest
        </button>
      </div>
    </div>
  ) as HTMLElement;
}

// Main demo component
function ReactiveStateDemo(): HTMLElement {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Zenith Reactive State Management Demo</h1>
      <p>
        This demo showcases the reactive state management system with useState, useRef, 
        useEffect, useMemo, useCallback, and ECS integration.
      </p>
      
      <BasicExample />
      <EffectAndMemoExample />
      <ReactiveBindingsExample />
      <ECSIntegrationExample />
      
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        <p>Open the browser console to see effect logs and state changes.</p>
      </div>
    </div>
  ) as HTMLElement;
}

// Export for use in examples
export default ReactiveStateDemo;

// Usage example:
/*
// In your HTML:
<div id="reactive-demo"></div>

// In your JavaScript:
import ReactiveStateDemo from './examples/reactive-state-demo';

const container = document.getElementById('reactive-demo');
if (container) {
  const demo = ReactiveStateDemo();
  container.appendChild(demo);
}
*/
