# ZenithKernel Template 🌊

A complete application template showcasing the power of ZenithKernel framework with reactive signals, stores, and islands architecture.

## 🚀 Features

### ⚡ Core ZenithKernel Features
- **Reactive Signals** - Fine-grained reactivity with `createSignal`, `createComputed`, and `createEffect`
- **ZenithStore** - Powerful state management with subscription system
- **Islands Architecture** - Selective hydration for optimal performance
- **ECS System** - Entity-Component-System architecture
- **TypeScript First** - Complete type safety throughout

### 🏗️ Template Features
- **Counter Component** - Interactive demo with store integration
- **Header Component** - Theme toggle, notifications, user management
- **Home Page** - Feature showcase and getting started guide
- **Vite Integration** - Hot module replacement and development server
- **Service Worker** - Offline support and caching

## 📦 What's Included

```
apps/template/
├── src/
│   ├── components/
│   │   ├── Counter.zk          # Interactive counter component
│   │   └── Header.zk           # Application header
│   ├── pages/
│   │   └── Home.zk             # Main landing page
│   ├── stores/
│   │   ├── CounterStore.ts     # Counter state management
│   │   └── AppStore.ts         # Global app state
│   ├── types/                  # TypeScript type definitions
│   └── main.ts                 # Application entry point
├── index.html                  # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ or Bun 1.0+
- Modern browser with ES2022 support

### Installation

1. **Clone or copy this template:**
   ```bash
   cp -r apps/template my-zenith-app
   cd my-zenith-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📚 Usage Examples

### Creating Reactive Signals

```typescript
import { createSignal, createEffect, createComputed } from '@zenithcore/core';

// Create a signal
const [count, setCount] = createSignal(0);

// Create computed value
const doubled = createComputed(() => count() * 2);

// Create effect
createEffect(() => {
  console.log('Count changed:', count());
});

// Update signal
setCount(42);
```

### Using ZenithStore

```typescript
import { CounterStore } from '@stores/CounterStore';

const store = new CounterStore();

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('Store updated:', state);
});

// Dispatch actions
store.increment();
store.incrementBy(5);
store.reset();
```

### Creating .zk Components

```vue
<!-- MyComponent.zk -->
<template>
  <div class="my-component">
    <h2>{{ title() }}</h2>
    <button @click="increment">Count: {{ count() }}</button>
  </div>
</template>

<script setup lang="ts">
import { createSignal } from '@zenithcore/core';

interface Props {
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'My Component'
});

const [count, setCount] = createSignal(0);

const increment = () => setCount(count() + 1);
</script>

<style scoped>
.my-component {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run lint` - Lint code

## 🔧 Configuration

### Vite Plugin Options

The template uses `@zenithcore/vite-plugin` with the following configuration:

```typescript
zenithKernel({
  bootstrap: {
    name: 'zenith-template',
    version: '1.0.0',
    features: ['signals', 'stores', 'islands', 'router']
  },
  autoGenerate: {
    routes: true,
    hydras: true,
    manifests: true,
    types: true
  },
  optimization: {
    quantumChunking: true,
    wasmInlining: true,
    hydraPreloading: true
  },
  development: {
    hotReloadHydras: true,
    enableDebugOverlay: true
  }
})
```

### Theme Support

The template includes built-in dark/light theme support:

```typescript
// Toggle theme
appStore.toggleTheme();

// Set specific theme
appStore.setTheme('dark');
```

## 🌊 Next Steps

1. **Explore the Components** - Check out `Counter.zk` and `Header.zk` for examples
2. **Add Your Pages** - Create new `.zk` files in `src/pages/`
3. **Create Stores** - Add state management in `src/stores/`
4. **Customize Styling** - Modify the CSS in component `<style>` blocks
5. **Add Routing** - Implement navigation between pages
6. **Deploy** - Build and deploy your application

## 📖 Documentation

- [ZenithKernel Core](https://github.com/nicksdigital/zenithkernel/tree/main/packages/zenith-core)
- [ZenithKernel SDK](https://github.com/nicksdigital/zenithkernel/tree/main/packages/zenith-sdk)
- [Vite Plugin](https://github.com/nicksdigital/zenithkernel/tree/main/packages/vite-plugin)

## 🤝 Contributing

This template is part of the ZenithKernel ecosystem. Contributions are welcome!

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details.

---

**Built with ZenithKernel** 🌊 - The future of web development
