/**
 * ZenithKernel Template Application
 * 
 * This template demonstrates the core features of ZenithKernel:
 * - Reactive signals and computed values
 * - ZenithStore for state management
 * - Islands-based hydration
 * - Component system
 */

import { ZenithApp } from '@zenithcore/sdk';
import { quickBootstrap, createSignal, createEffect, createComputed } from '@zenithcore/core';
import { CounterStore } from './stores/CounterStore';
import { AppStore } from './stores/AppStore';

console.log('🌊 ZenithKernel Template App Starting...');

// Initialize the ZenithKernel application
const app = new ZenithApp({
  name: 'ZenithKernel Template',
  version: '1.0.0'
});

// Bootstrap the kernel
const kernel = await quickBootstrap({
  name: 'template-kernel',
  version: '1.0.0',
  features: ['signals', 'stores', 'islands']
});

console.log('✅ Kernel bootstrapped successfully');

// Initialize stores
const counterStore = new CounterStore();
const appStore = new AppStore();

// Demo: Reactive signals
console.log('\n📡 Testing Reactive Signals...');

const [message, setMessage] = createSignal('Welcome to ZenithKernel!');
const [count, setCount] = createSignal(0);

// Computed value that depends on count
const doubledCount = createComputed(() => count() * 2);

// Effect that runs when signals change
createEffect(() => {
  console.log(`Message: ${message()}`);
});

createEffect(() => {
  console.log(`Count: ${count()}, Doubled: ${doubledCount()}`);
});

// Update signals to trigger effects
setMessage('ZenithKernel Template is running! 🚀');
setCount(5);

// Demo: Store integration
console.log('\n🏪 Testing Store Integration...');

// Subscribe to store changes
counterStore.subscribe((state) => {
  console.log('Counter store updated:', state);
});

appStore.subscribe((state) => {
  console.log('App store updated:', state);
});

// Update stores
counterStore.increment();
counterStore.increment();
appStore.setTheme('dark');
appStore.setUser({ id: '1', name: 'ZenithKernel User', email: 'user@zenithkernel.dev' });

// Demo: Component hydration simulation
console.log('\n🏝️ Simulating Islands Hydration...');

// Simulate hydrating components
const islands = [
  { id: 'counter', component: 'CounterIsland', props: { initialValue: counterStore.getState().count } },
  { id: 'header', component: 'HeaderIsland', props: { user: appStore.getState().user } },
  { id: 'theme-toggle', component: 'ThemeToggleIsland', props: { theme: appStore.getState().theme } }
];

islands.forEach(island => {
  console.log(`🏝️ Hydrating ${island.component} with props:`, island.props);
  // In a real app, this would hydrate the actual DOM components
});

// Demo: Cleanup and lifecycle
console.log('\n🔄 Demonstrating Lifecycle Management...');

// Set up cleanup
const cleanup = () => {
  console.log('🧹 Cleaning up application...');
  counterStore.reset();
  appStore.reset();
  console.log('✅ Cleanup complete');
};

// Simulate app lifecycle
setTimeout(() => {
  console.log('\n📊 Final State Summary:');
  console.log('Counter Store:', counterStore.getState());
  console.log('App Store:', appStore.getState());
  console.log('Current Message:', message());
  console.log('Current Count:', count());
  
  console.log('\n🎉 ZenithKernel Template Demo Complete!');
  console.log('Ready to build amazing applications! 🌊');
}, 1000);

// Export for potential external use
export { app, kernel, counterStore, appStore, cleanup };
