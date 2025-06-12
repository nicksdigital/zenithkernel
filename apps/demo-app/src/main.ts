/**
 * ZenithKernel Demo App
 *
 * This demonstrates the core features of ZenithKernel using the SDK,
 * including routing, ECS components, signals, and island hydration.
 */

import './styles/main.css';
import { ZenithApp } from '@sdk/core/ZenithApp';
import { ZenithKernel } from '@core/ZenithKernel';

// Import ZK components
import CounterComponent from './components/Counter.zk';
import TodoListComponent from './components/TodoList.zk';

// Initialize the demo app
async function bootstrapDemoApp() {
  console.log('🌊 Starting ZenithKernel Demo App...');

  // Create a new kernel instance
  const kernel = new ZenithKernel();

  // Initialize the kernel first
  await kernel.initialize();

  // Create the app using the SDK
  const app = new ZenithApp(kernel, {
    debug: true,
    defaultHydrationStrategy: 'visible',
    autoStart: false
  });

  // Register ZK components
  app.registerComponent('Counter', CounterComponent);
  app.registerComponent('TodoList', TodoListComponent);

  // Render the ZK components!
  const appContainer = document.getElementById('app')!;

  // Create navigation
  appContainer.innerHTML = `
    <div class="max-w-6xl mx-auto p-8">
      <div class="bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-xl font-semibold text-white">🌊 ZenithKernel Dashboard</h1>
          <div class="text-green-400">✅ ZK Components Active</div>
        </div>

        <!-- Navigation -->
        <div class="mb-12">
          <div class="flex items-center justify-center gap-4">
            <button id="show-counter" class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200">
              Show Counter.zk
            </button>
            <button id="show-todos" class="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-200">
              Show TodoList.zk
            </button>
          </div>
        </div>

        <!-- Component Container -->
        <div id="component-container">
          <div class="text-center py-12">
            <div class="text-4xl mb-4">🎉</div>
            <h2 class="text-2xl font-bold text-white mb-4">ZK Components Ready!</h2>
            <p class="text-gray-400">Click a button above to render a ZK component</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners to render components
  document.getElementById('show-counter')?.addEventListener('click', () => {
    const container = document.getElementById('component-container')!;
    const counterInstance = CounterComponent();
    container.innerHTML = '';
    counterInstance.mount(container);
  });

  document.getElementById('show-todos')?.addEventListener('click', () => {
    const container = document.getElementById('component-container')!;
    const todoInstance = TodoListComponent();
    container.innerHTML = '';
    todoInstance.mount(container);
  });

  // Start the app
  app.start();

  console.log('✅ ZenithKernel Demo App initialized successfully!');
  console.log('✅ ZK Components:', { CounterComponent, TodoListComponent });

  // Make app available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).ZenithApp = app;
    (window as any).ZKComponents = { CounterComponent, TodoListComponent };
  }

  return { app };
}

// Start the demo app
bootstrapDemoApp().catch(error => {
  console.error('❌ Failed to initialize demo app:', error);
});

export { bootstrapDemoApp };
