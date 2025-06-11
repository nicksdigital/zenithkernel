# ZenithKernel Demo App

A comprehensive demonstration of ZenithKernel's capabilities, built with Bun and TypeScript.

## 🌟 Features Demonstrated

### ⚡ Reactive Signals
- Fine-grained reactivity with automatic dependency tracking
- Computed signals that update automatically
- Effect system for side effects
- Signal-based DOM updates

### 🎯 Entity Component System (ECS)
- Counter component with reactive signals integration
- Component serialization/deserialization
- Entity management and lifecycle

### 🏪 ZenithStore
- Type-safe immutable state management
- Action-based state updates
- Middleware support (logging, performance, persistence)
- Time travel debugging capabilities

### 🏝️ Islands Architecture
- Selective client-side hydration
- Multiple hydration strategies
- Automatic island discovery and initialization
- Performance-optimized rendering

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18 (for compatibility)

### Installation

1. **Navigate to the demo app directory:**
   ```bash
   cd apps/demo-app
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Start the development server:**
   ```bash
   bun run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
# Build the application
bun run build

# Start the production server
bun run start
```

## 📁 Project Structure

```
apps/demo-app/
├── src/
│   ├── components/          # ECS components
│   │   ├── CounterComponent.ts
│   │   └── TodoListComponent.ts
│   ├── islands/             # Client-side islands
│   │   └── islandLoader.ts
│   ├── stores/              # Application stores
│   │   └── appStore.ts
│   ├── styles/              # CSS styles
│   │   └── main.css
│   └── main.ts              # Application entry point
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Build configuration
└── README.md                # This file
```

## 🎮 Demo Sections

### 1. Home Page
- Overview of ZenithKernel features
- Navigation to different demos
- Feature cards with descriptions

### 2. Counter Demo (ECS)
- Interactive counter using ECS components
- Reactive signals for state management
- Increment, decrement, and reset functionality
- Constraint handling (min/max values)

### 3. Todo List Demo (Store)
- Full-featured todo application
- ZenithStore for state management
- Add, edit, delete, and toggle todos
- Filter todos by status
- Persistent state across sessions

### 4. Signals Demo
- Live demonstration of reactive signals
- Text input with computed length
- Real-time updates and dependency tracking
- Effect system showcase

## 🔧 Technical Details

### Signal System
The demo showcases ZenithKernel's reactive signal system:

```typescript
// Create reactive signals
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Set up effects
effect(() => {
  console.log(`Count is now: ${count.value}`);
});

// Update signals
count.value = 5; // Automatically triggers computed and effects
```

### ECS Integration
Components integrate seamlessly with the ECS system:

```typescript
// Create ECS component with signals
const counter = new CounterComponent({
  value: 0,
  step: 1,
  min: 0,
  max: 100
});

// Register with ECS
ecs.registerComponentType('Counter', CounterComponent);
```

### Store Management
Type-safe state management with immutable updates:

```typescript
// Define state and actions
interface AppState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

// Dispatch actions
store.dispatch({
  type: 'ADD_TODO',
  payload: 'Learn ZenithKernel'
});
```

### Islands Architecture
Selective hydration for optimal performance:

```typescript
// Register island types
registerIsland({
  name: 'counter',
  selector: '[data-island="counter"]',
  hydrate: hydrateCounterIsland
});

// Automatic discovery and hydration
initializeIslands();
```

## 🧪 Testing

```bash
# Run tests
bun test

# Type checking
bun run type-check
```

## 🔍 Debugging

The demo includes comprehensive debugging features:

- **Signal Debug Mode**: Enable with `setDebugMode(true)`
- **Store Logger**: Automatic action logging in development
- **Performance Tracking**: Monitor signal and store performance
- **Island Hydration Indicators**: Visual feedback for hydrated islands

## 📚 Learning Resources

- [ZenithKernel Documentation](../../docs/)
- [Signal System Guide](../../docs/reactive-state-management.md)
- [ECS Architecture](../../docs/architecture/)
- [Store Management](../../packages/zenith-core/src/core/store/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This demo app is part of the ZenithKernel project and follows the same license terms.

---

**Happy coding with ZenithKernel! 🌊**
