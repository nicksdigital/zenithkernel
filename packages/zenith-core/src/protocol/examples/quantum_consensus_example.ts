/**
 * Quantum Consensus Example
 * 
 * This example demonstrates how to use the quantum consensus functionality
 * in the Zenith framework.
 */

import { runQuantumConsensus, verifyQuantumConsensus, getConsensusMeasurements, measurementsToHex } from '../quantumConsensusClient';

/**
 * Main function to run the quantum consensus example
 */
async function main() {
  try {
    console.log('=== Quantum Consensus Example ===\n');
    
    // Create a sample data chunk
    const text = 'hello quantum consensus';
    const data = new TextEncoder().encode(text);
    
    console.log(`Running quantum consensus for "${text}"...`);
    
    // Run the quantum consensus pipeline
    const result = await runQuantumConsensus(data);
    
    console.log('\nQuantum consensus result:');
    console.log(`- Consensus Valid: ${result.consensusValid}`);
    console.log(`- Consensus Success: ${result.consensus.success}`);
    console.log(`- Leader Measurements: ${result.leader.measurements.join('')}`);
    console.log(`- Consensus Measurements: ${result.consensus.measurements.join('')}`);
    console.log(`- Keygen Measurements: ${result.keygen.measurements.join('')}`);
    console.log(`- ZK Proof Valid: ${result.zk.valid}`);
    
    // Verify the consensus
    const isValid = verifyQuantumConsensus(result);
    console.log(`- Overall Verification: ${isValid ? 'Valid' : 'Invalid'}`);
    
    // Convert measurements to hex
    const consensusMeasurements = getConsensusMeasurements(result);
    const consensusHex = measurementsToHex(consensusMeasurements);
    console.log(`- Consensus Hex: ${consensusHex}`);
    
    // Display ZK proof details
    console.log('\nZK Proof Details:');
    console.log(`- Commitment: ${result.zk.proof.commitment}`);
    console.log(`- Entropy: ${result.zk.proof.entropy.toFixed(4)}`);
    console.log(`- Coherence: ${result.zk.proof.proof.coherence.toFixed(4)}`);
    console.log(`- Entanglement: ${result.zk.proof.proof.entanglement.toFixed(4)}`);
    console.log(`- Signals: ${result.zk.signals.slice(0, 8).join(', ')}...`);
    
    console.log('\n=== Example completed successfully! ===');
  } catch (error) {
    console.error('Error running quantum consensus example:', error);
  }
}

// Run the example
main();
