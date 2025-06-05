# Reactive State Management in Zenith Framework

The Zenith Framework provides a powerful reactive state management system that enables dynamic variables and automatic DOM updates. This system includes `useState`, `useRef`, and other hooks similar to React, but optimized for the Zenith architecture and ECS integration.

## Core Concepts

### useState Hook

The `useState` hook provides reactive state management with automatic DOM updates:

```typescript
import { useState } from '../modules/Rendering/jsx-runtime';

function MyComponent() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Hello');

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### useRef Hook

The `useRef` hook creates mutable references to DOM elements or values:

```typescript
import { useRef } from '../modules/Rendering/jsx-runtime';

function MyComponent() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  );
}
```

### useEffect Hook

The `useEffect` hook handles side effects and lifecycle events:

```typescript
import { useEffect, useState } from '../modules/Rendering/jsx-runtime';

function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(`Count changed to: ${count}`);

    // Cleanup function (optional)
    return () => {
      console.log('Cleanup effect');
    };
  }, [count]); // Dependencies array

  return <div>{count}</div>;
}
```

### useMemo Hook

The `useMemo` hook memoizes expensive computations:

```typescript
import { useMemo, useState } from '../modules/Rendering/jsx-runtime';

function MyComponent() {
  const [items, setItems] = useState(['apple', 'banana', 'cherry']);
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul>
        {filteredItems.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
```

### useCallback Hook

The `useCallback` hook memoizes functions:

```typescript
import { useCallback, useState } from '../modules/Rendering/jsx-runtime';

function MyComponent() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // Empty dependencies - function never changes

  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}
```

## Reactive Components

### Creating Reactive Components

To create a reactive component, use the `reactive` prop:

```typescript
function ReactiveComponent() {
  const [color, setColor] = useState('#blue');

  return (
    <div
      reactive={true}
      style={{ color: color }}
    >
      <button onClick={() => setColor('#red')}>
        Change Color
      </button>
    </div>
  );
}
```

### Reactive Attribute Bindings (Vue-Style)

Use the `:` prefix for reactive attribute bindings (Vue-style syntax):

```typescript
function ReactiveBindings() {
  const [isVisible, setIsVisible] = useState(true);
  const [className, setClassName] = useState('default');
  const [color, setColor] = useState('#blue');

  return (
    <div
      reactive={true}
      :class={() => className}
      :style={() => ({
        display: isVisible ? 'block' : 'none',
        color: color
      })}
      :data-visible={() => isVisible}
      :aria-hidden={() => !isVisible}
    >
      Content with Vue-style reactive bindings
    </div>
  );
}
```

### Vue-Style Class Bindings

The `:class` binding supports multiple formats:

```typescript
function ClassBindings() {
  const [isActive, setIsActive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [theme, setTheme] = useState('dark');

  return (
    <div>
      {/* Object syntax */}
      <div
        reactive={true}
        :class={() => ({
          'active': isActive,
          'error': hasError,
          'theme-dark': theme === 'dark'
        })}
      >
        Object-style classes
      </div>

      {/* Array syntax */}
      <div
        reactive={true}
        :class={() => [
          'base-class',
          theme,
          isActive && 'active',
          hasError && 'error'
        ]}
      >
        Array-style classes
      </div>

      {/* String syntax */}
      <div
        reactive={true}
        :class={() => `base ${theme} ${isActive ? 'active' : ''}`}
      >
        String-style classes
      </div>
    </div>
  );
}
```

### Vue-Style Style Bindings

The `:style` binding supports object and string formats:

```typescript
function StyleBindings() {
  const [color, setColor] = useState('#blue');
  const [size, setSize] = useState(16);
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div>
      {/* Object syntax */}
      <div
        reactive={true}
        :style={() => ({
          color: color,
          fontSize: `${size}px`,
          display: isVisible ? 'block' : 'none',
          backgroundColor: '#f0f0f0'
        })}
      >
        Object-style styles
      </div>

      {/* String syntax */}
      <div
        reactive={true}
        :style={() => `color: ${color}; font-size: ${size}px; display: ${isVisible ? 'block' : 'none'};`}
      >
        String-style styles
      </div>
    </div>
  );
}
```

### Dynamic Attributes

Any HTML attribute can be made reactive using the `:` prefix:

```typescript
function DynamicAttributes() {
  const [progress, setProgress] = useState(50);
  const [status, setStatus] = useState('loading');
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <div
      reactive={true}
      :data-progress={() => progress}
      :data-status={() => status}
      :aria-valuenow={() => progress}
      :aria-valuemin={() => 0}
      :aria-valuemax={() => 100}
      :aria-disabled={() => isDisabled}
      :title={() => `Progress: ${progress}%`}
      :disabled={() => isDisabled}
      role="progressbar"
    >
      <div
        reactive={true}
        :style={() => ({ width: `${progress}%` })}
      />
    </div>
  );
}
```

### Reactive Text Content

Bind functions directly to text content:

```typescript
function ReactiveText() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      reactive={true}
      textContent={() => time.toLocaleTimeString()}
    />
  );
}
```

## ECS Integration

### Connecting Components to ECS

Reactive components can be connected to the ECS system:

```typescript
import { ECSManager } from '../core/ECSManager';

function ECSComponent() {
  const [ecsManager] = useState(() => new ECSManager());
  const [entityId] = useState(() => ecsManager.createEntity());
  const [health, setHealth] = useState(100);

  // Update ECS component when state changes
  useEffect(() => {
    ecsManager.addComponent(entityId, 'Health', {
      value: health,
      max: 100
    });
  }, [health, entityId, ecsManager]);

  return (
    <div
      reactive={true}
      ecsEntity={entityId}
      ecsManager={ecsManager}
    >
      Health: {health}
      <button onClick={() => setHealth(h => h - 10)}>
        Take Damage
      </button>
    </div>
  );
}
```

### Automatic ECS Updates

When a component has `ecsEntity` and `ecsManager` props, state changes are automatically synchronized with ECS components:

```typescript
// This will automatically update the ECS component
const [position, setPosition] = useState({ x: 0, y: 0 });

// ECS component 'ReactiveState' will be updated with:
// { hookIndex: 0, value: { x: 0, y: 0 }, timestamp: Date.now() }
```

## Island Components

### Creating Reactive Islands

Reactive islands combine the island architecture with reactive state:

```typescript
import { IslandComponent } from '../modules/Rendering/types';

const ReactiveIsland: IslandComponent = {
  async mount(element: HTMLElement, props: any = {}, context: any = {}) {
    // Create reactive component
    const component = ReactiveComponent(props);

    // Mount to element
    element.appendChild(component);

    // Return cleanup function
    return () => {
      const event = new CustomEvent('zenith:cleanup');
      component.dispatchEvent(event);
      element.innerHTML = '';
    };
  }
};

export default ReactiveIsland;
```

### Using Reactive Islands in HTML

```html
<div
  data-hydra-entry="ReactiveIsland"
  data-hydra-strategy="immediate"
  data-hydra-context='{"initialValue": 42}'
>
  Loading reactive island...
</div>
```

## Performance Considerations

### Batched Updates

State updates are automatically batched using `requestAnimationFrame`:

```typescript
// These updates will be batched together
setCount(1);
setMessage('Hello');
setVisible(true);
// Only one re-render will occur
```

### Memory Management

Components are automatically cleaned up when removed from the DOM:

```typescript
// Cleanup is handled automatically
element.remove(); // All hooks and effects are cleaned up
```

### Optimization Tips

1. **Use useMemo for expensive computations**:
   ```typescript
   const expensiveValue = useMemo(() => {
     return heavyComputation(data);
   }, [data]);
   ```

2. **Use useCallback for stable function references**:
   ```typescript
   const stableCallback = useCallback(() => {
     doSomething();
   }, []);
   ```

3. **Minimize dependencies in useEffect**:
   ```typescript
   // Good - minimal dependencies
   useEffect(() => {
     updateSomething(id);
   }, [id]);

   // Avoid - too many dependencies
   useEffect(() => {
     updateSomething(id);
   }, [id, name, email, address]); // Consider splitting
   ```

## Advanced Usage

### Custom Hooks

Create reusable stateful logic:

```typescript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

// Usage
function CounterComponent() {
  const { count, increment, decrement, reset } = useCounter(10);

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### State Persistence

Persist state across component remounts:

```typescript
function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}
```

## Migration from Legacy State

If you have existing code using the legacy state system, you can migrate gradually:

```typescript
// Legacy (still supported)
import { legacyUseState } from '../modules/Rendering/jsx-runtime';
const [getValue, setValue] = legacyUseState(0);

// New reactive system
import { useState } from '../modules/Rendering/jsx-runtime';
const [value, setValue] = useState(0);
```

The new system provides better performance, automatic DOM updates, and ECS integration while maintaining backward compatibility.

## Vue-Style Binding Syntax Reference

The Zenith framework supports Vue-style reactive bindings using the `:` prefix:

### Basic Syntax
- `:attribute={() => value}` - Dynamic attribute binding
- `:class={() => classValue}` - Dynamic class binding
- `:style={() => styleValue}` - Dynamic style binding

### Class Binding Formats
```typescript
// Object syntax
:class={() => ({ 'active': isActive, 'error': hasError })}

// Array syntax
:class={() => ['base', theme, isActive && 'active']}

// String syntax
:class={() => `base ${theme} ${isActive ? 'active' : ''}`}
```

### Style Binding Formats
```typescript
// Object syntax
:style={() => ({ color: '#red', fontSize: '16px' })}

// String syntax
:style={() => `color: red; font-size: 16px;`}
```

### Common Use Cases
- `:data-*={() => value}` - Data attributes
- `:aria-*={() => value}` - ARIA attributes
- `:disabled={() => boolean}` - Boolean attributes
- `:title={() => string}` - Tooltip text
- `:href={() => url}` - Dynamic links
- `:src={() => imageUrl}` - Dynamic images

This Vue-style syntax makes reactive bindings more intuitive and familiar to developers coming from Vue.js while maintaining the power and performance of the Zenith framework.
