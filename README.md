# ZenithKernel

A hyper-performant modular TypeScript microkernel framework with WASM support, islands architecture, reactive signals, and post-quantum cryptography.

## ✨ Features

- 🏝️ **Islands Architecture** - Selective hydration for optimal performance
- ⚡ **Reactive Signals** - Fine-grained reactivity with automatic dependency tracking
- 🎯 **Entity Component System (ECS)** - Efficient state management and game-like architecture
- 🏪 **ZenithStore** - Type-safe immutable state management with time travel
- 🔐 **Post-Quantum Cryptography** - Future-proof security
- 🌊 **Zero-Knowledge Proofs** - Privacy-preserving verification
- 📦 **Modular Design** - Composable and extensible architecture
- 🚀 **Bun-First** - Built for speed with Bun runtime
- 📱 **TypeScript Native** - Full TypeScript support throughout

## 🚀 Quick Start

### Installation

```bash
# Install the CLI globally
npm install -g @zenithcore/zenny
# or with bun
bun install -g @zenithcore/zenny

# Create a new project
zenny init my-zenith-app
cd my-zenith-app

# Start development
bun run dev
```

### Using Individual Packages

```bash
# Core framework
npm install @zenithcore/core

# Runtime and codec
npm install @zenithcore/runtime

# Developer SDK
npm install @zenithcore/sdk

# CLI tools
npm install @zenithcore/zenny

# OST compression algorithm
npm install @zenithcore/ost-compression
```

## 📦 Packages

All packages are now **published on npm** and ready for use! 🎉

| Package | Description | Version |
|---------|-------------|---------|
| [`@zenithcore/core`](./packages/zenith-core) | Core framework with ECS, signals, and stores | [![npm](https://img.shields.io/npm/v/@zenithcore/core)](https://www.npmjs.com/package/@zenithcore/core) |
| [`@zenithcore/runtime`](./packages/zenith-runtime) | Runtime codec and compression | [![npm](https://img.shields.io/npm/v/@zenithcore/runtime)](https://www.npmjs.com/package/@zenithcore/runtime) |
| [`@zenithcore/sdk`](./packages/zenith-sdk) | Developer-friendly SDK | [![npm](https://img.shields.io/npm/v/@zenithcore/sdk)](https://www.npmjs.com/package/@zenithcore/sdk) |
| [`@zenithcore/zenny`](./packages/zenny) | Command-line interface | [![npm](https://img.shields.io/npm/v/@zenithcore/zenny)](https://www.npmjs.com/package/@zenithcore/zenny) |
| [`@zenithcore/ost-compression`](./packages/ost-compression) | Okaily-Srivastava-Tbakhi compression algorithm | [![npm](https://img.shields.io/npm/v/@zenithcore/ost-compression)](https://www.npmjs.com/package/@zenithcore/ost-compression) |
| [`@zenithcore/dcloud`](./packages/zenith-dcloud) | Decentralized cloud infrastructure (WIP) | ![npm](https://img.shields.io/npm/v/@zenithcore/dcloud) |

## 🏗️ Project Structure

```
zenithkernel/
├── packages/
│   ├── zenith-core/          # Core framework (@zenithcore/core)
│   ├── zenith-runtime/       # Runtime codec (@zenithcore/runtime)
│   ├── zenith-sdk/          # Developer SDK (@zenithcore/sdk)
│   ├── ost-compression/     # OST compression algorithm (@zenithcore/ost-compression)
│   ├── zenith-dcloud/       # Decentralized cloud (@zenithcore/dcloud)
│   └── zenny/               # CLI tools (@zenithcore/zenny)
├── apps/
│   └── demo-app/            # Demo application
├── docs/                    # Documentation
├── examples/                # Example projects
└── tests/                   # Test suites
```

## 🎯 Core Concepts

### Reactive Signals
```typescript
import { signal, computed, effect } from '@zenithcore/core';

const count = signal(0);
const doubled = computed(() => count.value * 2);

effect(() => {
  console.log(`Count: ${count.value}, Doubled: ${doubled.value}`);
});

count.value = 5; // Logs: "Count: 5, Doubled: 10"
```

### Entity Component System
```typescript
import { ZenithKernel } from '@zenithcore/core';

const kernel = new ZenithKernel();
const ecs = kernel.getECS();

// Create entity with components
const entity = ecs.createEntity();
ecs.addComponent(entity, PositionComponent, { x: 0, y: 0 });
ecs.addComponent(entity, VelocityComponent, { dx: 1, dy: 0 });
```

### ZenithStore
```typescript
import { createStore } from '@zenithcore/core';

const store = createStore({
  initialState: { count: 0 },
  reducer: (state, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return { ...state, count: state.count + 1 };
      default:
        return state;
    }
  }
});
```

### Islands Architecture
```typescript
// Component automatically hydrates on the client
export function CounterIsland() {
  const [count, setCount] = useState(0);

  return (
    <div data-island="counter">
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18 (for compatibility)
- TypeScript >= 5.0

### Setup
```bash
# Clone the repository
git clone https://github.com/nicksdigital/zenithkernel.git
cd zenithkernel

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test

# Start demo app
bun run demo
```

### CLI Development
```bash
# Test CLI locally
bun run zenny --help

# Create a new component
bun run zenny create hydra MyComponent

# Initialize a new project
bun run zenny init
```

src/: Core source code
runtime/: Runtime-specific code
cli/: Command-line interface tools
docs/: Documentation
tests/: Test files
examples/: Example projects

Documentation
See the docs directory for detailed documentation.
License
MIT