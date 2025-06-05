/**
 * Quantum ZKP Example
 * 
 * This example demonstrates how to use the quantum circuit and ZKP functionality
 * in the Zenith framework.
 */

import * as quantum from 'quantum-zkp-sdk';
import { generateZKProofFromChunk, verifyZKProofForChunk } from '../qzkpClient';
import { generateCircomInput, runZKPPipeline } from '../quantumCircuit';

/**
 * Run a simple quantum circuit example
 */
async function runQuantumCircuitExample() {
  console.log('=== Quantum Circuit Example ===');
  
  // Create a simple quantum circuit
  const circuit = new quantum.QuantumCircuit(4);
  
  // Get the Hadamard gate from the gate cache
  const hGate = circuit['gateCache'].get('H') ?? [];
  
  // Apply Hadamard gate to the first qubit
  circuit.applySingleQubitGate(1, hGate);
  
  // Generate Circom input
  const inputJson = circuit.toCircomInput();
  console.log('Generated Circom Input:', inputJson);
  
  console.log('\n');
}

/**
 * Run a ZKP example
 */
async function runZKPExample() {
  console.log('=== Quantum ZKP Example ===');
  
  // Create a sample data chunk
  const text = 'hello quantum';
  const chunk = new TextEncoder().encode(text);
  const chunkId = 'example-chunk-1';
  
  // Generate a ZK proof
  console.log(`Generating ZK proof for "${text}"...`);
  const proof = await generateZKProofFromChunk(chunk, chunkId);
  
  console.log('Proof generated:');
  console.log(`- Chunk ID: ${proof.chunk_id}`);
  console.log(`- Entropy: ${proof.entropy.toFixed(4)}`);
  console.log(`- Commitment: ${proof.commitment}`);
  console.log(`- Coherence: ${proof.proof.coherence.toFixed(4)}`);
  console.log(`- Entanglement: ${proof.proof.entanglement.toFixed(4)}`);
  
  // Verify the proof
  const isValid = await verifyZKProofForChunk(chunk, proof);
  console.log(`Proof verification: ${isValid ? 'Valid' : 'Invalid'}`);
  
  // Try with tampered data
  const tamperedChunk = new TextEncoder().encode('hello quantum!');
  const isTamperedValid = await verifyZKProofForChunk(tamperedChunk, proof);
  console.log(`Tampered data verification: ${isTamperedValid ? 'Valid' : 'Invalid'}`);
  
  console.log('\n');
}

/**
 * Run a quantum circuit ZKP pipeline example
 */
async function runQuantumZKPPipelineExample() {
  console.log('=== Quantum ZKP Pipeline Example ===');
  
  // Create a sample data chunk
  const text = 'hello quantum';
  const chunk = new TextEncoder().encode(text);
  const chunkId = 'example-chunk-2';
  
  // Run the ZKP pipeline
  console.log(`Running ZKP pipeline for "${text}"...`);
  const result = await runZKPPipeline(chunk, chunkId);
  
  console.log('Pipeline result:');
  console.log(`- Circom Input: ${JSON.stringify(result.circomInput).substring(0, 100)}...`);
  console.log(`- Proof Commitment: ${result.proof.commitment}`);
  console.log(`- Valid: ${result.valid}`);
  
  console.log('\n');
}

/**
 * Main function to run all examples
 */
async function main() {
  try {
    await runQuantumCircuitExample();
    await runZKPExample();
    await runQuantumZKPPipelineExample();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
main();
