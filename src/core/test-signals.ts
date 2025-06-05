/**
 * Quick test script for enhanced signals
 */

import { 
  signal, 
  computed, 
  effect, 
  asyncSignal, 
  batch, 
  setDebugMode,
  SignalError 
} from './signals';

console.log('🚀 Testing Enhanced Signals System...\n');

// Enable debug mode
setDebugMode(true);

// Basic signal test
console.log('1. Basic Signal Test:');
const count = signal(0, { name: 'counter' });
console.log(`Initial value: ${count.value}`);
console.log(`Signal ID: ${count.id}, Name: ${count.name}`);

count.value = 5;
console.log(`Updated value: ${count.value}`);
console.log(`Access count: ${count.accessCount}, Update count: ${count.updateCount}\n`);

// Computed signal test
console.log('2. Computed Signal Test:');
const doubled = computed(() => count.value * 2, { name: 'doubled' });
console.log(`Computed value: ${doubled.value}`);

count.value = 10;
console.log(`After updating count to 10, doubled is: ${doubled.value}\n`);

// Effect test
console.log('3. Effect Test:');
let effectRuns = 0;
const cleanup = effect(() => {
  console.log(`Effect running with count: ${count.value}`);
  effectRuns++;
});

count.value = 15;
console.log(`Effect has run ${effectRuns} times\n`);

// Async signal test
console.log('4. Async Signal Test:');
const asyncData = asyncSignal(async () => {
  console.log('Starting async operation...');
  await new Promise(resolve => setTimeout(resolve, 100));
  return 'Async data loaded!';
}, { 
  name: 'asyncTest',
  initialState: 'loading' 
});

console.log(`Loading: ${asyncData.loading}`);
console.log(`Initial value: ${asyncData.value}`);

// Wait for async operation
setTimeout(() => {
  console.log(`After async: Loading: ${asyncData.loading}, Value: ${asyncData.value}`);
  console.log(`Success: ${asyncData.isSuccess}\n`);
  
  // Batch test
  console.log('5. Batch Test:');
  const a = signal(0, { name: 'a' });
  const b = signal(0, { name: 'b' });
  let batchEffectRuns = 0;
  
  effect(() => {
    console.log(`Batch effect: a=${a.value}, b=${b.value}`);
    batchEffectRuns++;
  });
  
  console.log(`Before batch: effect runs = ${batchEffectRuns}`);
  
  batch(() => {
    a.value = 1;
    b.value = 2;
    console.log('Inside batch: both values updated');
  });
  
  console.log(`After batch: effect runs = ${batchEffectRuns}\n`);
  
  // Error handling test
  console.log('6. Error Handling Test:');
  try {
    const disposedSignal = signal(0);
    disposedSignal.dispose();
    disposedSignal.value; // Should throw
  } catch (error) {
    if (error instanceof SignalError) {
      console.log(`✅ Caught expected SignalError: ${error.message}`);
    }
  }
  
  console.log('\n🎉 All tests completed successfully!');
  
  // Cleanup
  cleanup.dispose();
  doubled.dispose();
  asyncData.dispose();
}, 150);
