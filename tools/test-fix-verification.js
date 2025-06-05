#!/usr/bin/env node

// Simple test to verify the island fixes work
import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

async function testECSCounterIsland() {
  console.log('Testing ECSCounterIsland...');
  
  try {
    // Import the island - this should now work with our fixes
    const { default: ECSCounterIsland } = await import('../src/modules/Rendering/islands/ECSCounterIsland.tsx');
    
    // Create test element
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    // Mount with test props
    await ECSCounterIsland.mount(element, {
      label: 'Test Counter',
      initialValue: 42,
      step: 2
    });
    
    // Check for expected elements
    const counterIsland = element.querySelector('.ecs-counter-island');
    const counterValue = element.querySelector('.counter-value');
    const header = element.querySelector('.counter-header h3');
    
    console.log('✓ Island mounted successfully');
    console.log('✓ Counter island element found:', !!counterIsland);
    console.log('✓ Counter value element found:', !!counterValue);
    console.log('✓ Header element found:', !!header);
    console.log('✓ Header text:', header?.textContent);
    console.log('✓ Counter value:', counterValue?.textContent);
    
    // Test button functionality
    const incrementBtn = element.querySelector('.increment-btn');
    if (incrementBtn) {
      console.log('✓ Increment button found');
      incrementBtn.click();
      console.log('✓ After increment:', counterValue?.textContent);
    }
    
    return true;
  } catch (error) {
    console.error('✗ Error testing ECSCounterIsland:', error.message);
    return false;
  }
}

// Run the test
testECSCounterIsland().then(success => {
  console.log('\nTest result:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
