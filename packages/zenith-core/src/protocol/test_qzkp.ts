/**
 * Test script for qzkpClient.ts
 * 
 * This script tests the functionality of the qzkpClient.ts implementation
 * with the zenith-quantum-tools module.
 */

import { generateZKProofFromChunk, verifyZKProofForChunk } from './qzkpClient';

async function testQZKP() {
  try {
    console.log('=== Testing QZKP Client ===\n');
    
    // Create a test data chunk
    const text = 'This is a test message for QZKP verification';
    const chunk = new TextEncoder().encode(text);
    const chunkId = 'test-chunk-' + Date.now();
    
    console.log(`Generating ZK proof for: "${text}"`);
    console.log(`Chunk ID: ${chunkId}`);
    console.log(`Chunk size: ${chunk.length} bytes`);
    
    // Generate a proof
    console.log('\nGenerating proof...');
    const startTime = Date.now();
    const {leader,keygen,consensus,consensusValid,zk} = await generateZKProofFromChunk(chunk, chunkId);
    const endTime = Date.now();
    
    console.log(`Proof generated in ${endTime - startTime}ms`);
    console.log('\nProof details:');
    console.log(`- Chunk ID: ${chunkId}`);

    // Verify the proof
    console.log('\nVerifying proof...');
    const verifyStartTime = Date.now();
    const isValid = await verifyZKProofForChunk(chunk, zk.proof, zk.signals);
    const verifyEndTime = Date.now();
    
    console.log(`Verification completed in ${verifyEndTime - verifyStartTime}ms`);
    console.log(`Verification result: ${isValid ? 'VALID' : 'INVALID'}`);
    
    // Test with tampered data
    console.log('\nTesting with tampered data...');
    const tamperedText = 'This is a tampered message for QZKP verification';
    const tamperedChunk = new TextEncoder().encode(tamperedText);
    
    const tamperedVerifyStartTime = Date.now();
    const isTamperedValid = await verifyZKProofForChunk(tamperedChunk, zk.proof, zk.publicSignals);
    const tamperedVerifyEndTime = Date.now();
    
    console.log(`Tampered verification completed in ${tamperedVerifyEndTime - tamperedVerifyStartTime}ms`);
    console.log(`Tampered verification result: ${isTamperedValid ? 'VALID' : 'INVALID'} (expected: INVALID)`);
    
    console.log('\n=== Test completed ===');
    
    if (isValid && !isTamperedValid) {
      console.log('✅ All tests passed successfully!');
    } else {
      console.log('❌ Tests failed!');
    }
  } catch (error) {
    console.error('Error during QZKP testing:', error);
  }
}

// Run the test
testQZKP();
