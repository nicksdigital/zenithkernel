/**
 * Test script for quantum.entangleBytes
 * 
 * This script tests the functionality of the quantum.entangleBytes function
 * from the zenith-quantum-tools module.
 */

import {

  generateZKProofFromChunk
} from './qzkpClient';

async function testEntangleBytes() {
  try {
    console.log('=== Testing Quantum Entanglement ===\n');
    
    // Create a test data chunk
    const text = 'This is a test message for quantum entanglement';
    const chunk = new TextEncoder().encode(text);
    
    console.log(`Input data: "${text}"`);
    console.log(`Data size: ${chunk.length} bytes`);
    
    // Run the entanglement
    console.log('\nRunning entangleBytes...');
    const startTime = Date.now();
    const {leader,keygen,consensus,consensusValid,zk} = await generateZKProofFromChunk(chunk, 'test-chunk-' + Date.now());
    const endTime = Date.now();
    
    console.log(`Entanglement completed in ${endTime - startTime}ms`);
    console.log('\nEntanglement result:');
    console.log(JSON.stringify(zk, null, 2));
    
    console.log('\n=== Test completed ===');
  } catch (error) {
    console.error('Error during quantum entanglement testing:', error);
  }
}

// Run the test
testEntangleBytes();
