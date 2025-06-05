/**
 * Quantum Consensus Client
 * 
 * This module provides a simple client for the Quantum Consensus system,
 * integrating with the zenith-quantum-tools package.
 */

import * as quantum from 'quantum-zkp-sdk';
import { QZKProofResult } from './qzkpClient';

/**
 * Result of the quantum pipeline
 */
export interface QuantumPipelineResult {
  leader: {
    measurements: number[];
    [key: string]: any;
  };
  keygen: {
    measurements: number[];
    [key: string]: any;
  };
  consensus: {
    measurements: number[];
    success: boolean;
    [key: string]: any;
  };
  consensusValid: boolean;
  zk: {
    proof: QZKProofResult;
    signals: number[];
    valid: boolean;
  };
}

/**
 * Run the quantum consensus pipeline on a data chunk
 * @param data The data to process
 * @param qubitCount Number of qubits to use (default: 4)
 * @returns The result of the quantum pipeline
 */
export async function runQuantumConsensus(data: Uint8Array, qubitCount: number = 4): Promise<QuantumPipelineResult> {
  try {
    // Call the quantum pipeline from the zenith-quantum-tools package
    const result = await quantum.runQuantumPipeline(data, qubitCount);
    return result;
  } catch (error) {
    console.error('Error running quantum consensus:', error);
    throw new Error(`Failed to run quantum consensus: ${error.message}`);
  }
}

/**
 * Verify the result of a quantum consensus pipeline
 * @param result The pipeline result to verify
 * @returns Whether the result is valid
 */
export function verifyQuantumConsensus(result: QuantumPipelineResult): boolean {
  // Check if consensus was reached
  if (!result.consensusValid || !result.consensus.success) {
    return false;
  }
  
  // Check if the ZK proof is valid
  if (!result.zk.valid) {
    return false;
  }
  
  return true;
}

/**
 * Extract the consensus measurements from a pipeline result
 * @param result The pipeline result
 * @returns The consensus measurements as a binary string
 */
export function getConsensusMeasurements(result: QuantumPipelineResult): string {
  return result.consensus.measurements.join('');
}

/**
 * Extract the leader measurements from a pipeline result
 * @param result The pipeline result
 * @returns The leader measurements as a binary string
 */
export function getLeaderMeasurements(result: QuantumPipelineResult): string {
  return result.leader.measurements.join('');
}

/**
 * Extract the key generation measurements from a pipeline result
 * @param result The pipeline result
 * @returns The key generation measurements as a binary string
 */
export function getKeygenMeasurements(result: QuantumPipelineResult): string {
  return result.keygen.measurements.join('');
}

/**
 * Convert binary measurements to a hexadecimal string
 * @param measurements The measurements as a binary string
 * @returns The measurements as a hexadecimal string
 */
export function measurementsToHex(measurements: string): string {
  // Pad the binary string to a multiple of 4
  const padded = measurements.padStart(Math.ceil(measurements.length / 4) * 4, '0');
  
  // Convert to hex
  let hex = '';
  for (let i = 0; i < padded.length; i += 4) {
    const chunk = padded.substring(i, i + 4);
    const decimal = parseInt(chunk, 2);
    hex += decimal.toString(16);
  }
  
  return hex;
}

/**
 * Example usage of the quantum consensus
 */
export async function runQuantumConsensusExample(): Promise<void> {
  // Create a sample data chunk
  const text = 'hello quantum consensus';
  const data = new TextEncoder().encode(text);
  
  console.log(`Running quantum consensus for "${text}"...`);
  
  // Run the quantum consensus pipeline
  const result = await runQuantumConsensus(data);
  
  console.log('Quantum consensus result:');
  console.log(`- Consensus Valid: ${result.consensusValid}`);
  console.log(`- Consensus Success: ${result.consensus.success}`);
  console.log(`- Leader Measurements: ${getLeaderMeasurements(result)}`);
  console.log(`- Consensus Measurements: ${getConsensusMeasurements(result)}`);
  console.log(`- Keygen Measurements: ${getKeygenMeasurements(result)}`);
  console.log(`- ZK Proof Valid: ${result.zk.valid}`);
  
  // Verify the consensus
  const isValid = verifyQuantumConsensus(result);
  console.log(`- Overall Verification: ${isValid ? 'Valid' : 'Invalid'}`);
  
  // Convert measurements to hex
  const consensusHex = measurementsToHex(getConsensusMeasurements(result));
  console.log(`- Consensus Hex: ${consensusHex}`);
}
