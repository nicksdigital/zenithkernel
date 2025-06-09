/**
 * Test script to inspect the quantum module
 * 
 * This script logs the available functions and properties in the quantum module.
 */

import * as quantum from 'quantum-zkp-sdk';

function testQuantumModule() {
  console.log('=== Quantum Module Inspection ===\n');
  
  // Log the available functions and properties
  console.log('Available functions and properties:');
  for (const key in quantum) {
    // @ts-ignore
    const type = typeof quantum[key];
    console.log(`- ${key}: ${type}`);
    
    // If it's an object, log its properties
    // @ts-ignore
    if (type === 'object' && quantum[key] !== null) {
      console.log('  Properties:');
      // @ts-ignore
      for (const subKey in quantum[key]) {
        // @ts-ignore
        console.log(`  - ${subKey}: ${typeof quantum[key][subKey]}`);
      }
    }
    
    // If it's a function, log its parameters
    if (type === 'function') {
      // @ts-ignore
      console.log(`  Function: ${quantum[key].toString().split('\n')[0]}`);
    }
  }
  
  // Log the prototype of the QuantumZKP class if it exists
  if (quantum.QuantumCircuit) {
    console.log('\nQuantumZKP prototype methods:');
    const prototype = Object.getPrototypeOf(new quantum.QuantumCircuit(4));
    for (const key of Object.getOwnPropertyNames(prototype)) {
      if (key !== 'constructor') {
        console.log(`- ${key}: ${typeof prototype[key]}`);
      }
    }
  }
  
  console.log('\n=== Inspection completed ===');
}

// Run the test
testQuantumModule();
