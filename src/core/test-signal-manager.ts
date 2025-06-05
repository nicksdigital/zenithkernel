/**
 * SignalManager Demo Script
 */

import { SignalManager } from './SignalManager';
import { ECSManager } from './ECSManager';

console.log('🎯 SignalManager Demo Starting...\n');

// Create ECS and SignalManager
const ecs = new ECSManager();
const manager = new SignalManager({
  ecsManager: ecs,
  debugMode: true,
  performanceTracking: true
});

// 1. Basic Signal Management
console.log('1. Creating managed signals...');
const count = manager.createSignal('counter', 0);
const name = manager.createSignal('username', 'Alice');

console.log(`Counter: ${count.value}, Username: ${name.value}`);

// 2. Computed Signals
console.log('\n2. Creating computed signals...');
const display = manager.createComputed('display', () => 
  `${name.value} has ${count.value} points`
);

console.log(`Display: ${display.value}`);

// 3. ECS Integration
console.log('\n3. Testing ECS integration...');
const entity = ecs.createEntity();
const health = manager.createSignal('player-health', 100, { entity });

console.log(`Entity ${entity} health: ${health.value}`);
console.log(`Entity signals:`, manager.getEntitySignals(entity).map(s => s.name));

// 4. DOM Binding Simulation
console.log('\n4. Simulating DOM bindings...');
const mockElement = {
  textContent: '',
  className: '',
  setAttribute: function(name: string, value: string) {
    (this as any)[name] = value;
  },
  getAttribute: function(name: string) {
    return (this as any)[name];
  }
} as HTMLElement;

manager.bindTextContent('count-display', mockElement, count);

// Simulate DOM update cycle
setTimeout(() => {
  console.log(`Mock element text after binding: "${mockElement.textContent}"`);
  
  count.value = 42;
  
  setTimeout(() => {
    console.log(`Mock element text after update: "${mockElement.textContent}"`);
  }, 20);
}, 20);

// 5. Hydra Context Management
console.log('\n5. Creating Hydra context...');
const hydraContext = manager.createHydraContext('demo-component');
manager.addToHydraContext('demo-component', 'counter', count);
manager.addToHydraContext('demo-component', 'username', name);

const hydraSignals = manager.getHydraSignals('demo-component');
console.log(`Hydra signals:`, Array.from(hydraSignals.keys()));

// 6. Async Signal Demo
console.log('\n6. Testing async signals...');
const asyncData = manager.createAsyncSignal('user-data', async () => {
  console.log('  Loading user data...');
  await new Promise(resolve => setTimeout(resolve, 100));
  return { id: 123, name: 'Bob', role: 'admin' };
});

console.log(`Async loading: ${asyncData.loading}`);
asyncData.reload();
console.log(`Async loading after reload: ${asyncData.loading}`);

setTimeout(() => {
  console.log(`Async data loaded:`, asyncData.value);
  console.log(`Async success: ${asyncData.isSuccess}`);
}, 150);

// 7. Performance Stats
setTimeout(() => {
  console.log('\n7. Performance statistics:');
  const stats = manager.getStats();
  console.log(`Total signals: ${stats.totalSignals}`);
  console.log(`Active signals: ${stats.activeSignals}`);
  console.log(`DOM bindings: ${stats.domBindings}`);
  console.log(`Hydra contexts: ${stats.hydraContexts}`);
  console.log(`Memory usage:`, stats.memoryUsage);
}, 200);

// 8. Entity Cleanup Test
setTimeout(() => {
  console.log('\n8. Testing entity cleanup...');
  console.log(`Before cleanup - Entity signals: ${manager.getEntitySignals(entity).length}`);
  
  ecs.destroyEntity(entity);
  
  console.log(`After cleanup - Entity signals: ${manager.getEntitySignals(entity).length}`);
  console.log(`Health signal still exists: ${manager.getSignal('player-health') !== undefined}`);
}, 250);

// 9. Effect Management
console.log('\n9. Creating managed effects...');
let effectRuns = 0;
const effect = manager.createEffect('counter-watcher', () => {
  console.log(`  Effect triggered: count is now ${count.value}`);
  effectRuns++;
});

count.value = 10;
count.value = 20;

setTimeout(() => {
  console.log(`Effect ran ${effectRuns} times`);
}, 50);

// 10. Cleanup
setTimeout(() => {
  console.log('\n10. Cleaning up demo...');
  
  const debugInfo = manager.getDebugInfo();
  console.log('Debug info before cleanup:');
  console.log(`- Signals: ${debugInfo.signals.length}`);
  console.log(`- Computed: ${debugInfo.computedSignals.length}`);
  console.log(`- Async: ${debugInfo.asyncSignals.length}`);
  console.log(`- DOM bindings: ${debugInfo.domBindings.length}`);
  console.log(`- Hydra contexts: ${debugInfo.hydraContexts.length}`);
  
  manager.dispose();
  console.log('\n✅ SignalManager demo completed!');
}, 300);
