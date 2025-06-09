/**
 * Test script for quantum.runQuantumPipeline
 * 
 * This script tests the functionality of the quantum.runQuantumPipeline function
 * from the zenith-quantum-tools module.
 */

import * as quantum from 'quantum-zkp-sdk';

async function testQuantumPipeline() {
  try {
    console.log('=== Testing Quantum Pipeline ===\n');
    
    // Create a test data chunk
    const text = 'This is a test message for quantum pipeline';
    const chunk = new TextEncoder().encode(text);
    
    console.log(`Input data: "${text}"`);
    console.log(`Data size: ${chunk.length} bytes`);
    
    // Run the quantum pipeline
    console.log('\nRunning quantum pipeline...');
    const startTime = Date.now();
    const result = await quantum.runQuantumPipeline(chunk, 4);
    const endTime = Date.now();
    
    console.log(`Pipeline completed in ${endTime - startTime}ms`);
    console.log('\nPipeline result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n=== Test completed ===');
  } catch (error) {
    console.error('Error during quantum pipeline testing:', error);
  }
}

// Run the test
testQuantumPipeline();
