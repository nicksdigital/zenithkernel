/**
 * Quantum Wrapper
 * 
 * This module provides a simple wrapper around the zenith-quantum-tools module
 * to make it easier to use in the Zenith framework.
 */

import * as quantum from 'quantum-zkp-sdk';

/**
 * Create a quantum circuit with a specified number of qubits
 * @param qubitCount Number of qubits in the circuit
 * @returns The quantum circuit
 */
export function createQuantumCircuit(qubitCount: number = 4): any {
  return new quantum.QuantumCircuit(qubitCount);
}

/**
 * Apply a Hadamard gate to a specific qubit in a circuit
 * @param circuit The quantum circuit
 * @param qubitIndex The index of the qubit to apply the gate to
 * @returns The updated circuit
 */
export function applyHadamardGate(circuit: any, qubitIndex: number): any {
  const hGate = circuit['gateCache'].get('H') ?? [];
  circuit.applySingleQubitGate(qubitIndex, hGate);
  return circuit;
}

/**
 * Generate a Circom input from a quantum circuit
 * @param circuit The quantum circuit
 * @returns The Circom input
 */
export function generateCircomInput(circuit: any): any {
  return circuit.toCircomInput();
}

/**
 * Process a data chunk with a quantum circuit
 * @param chunk The data chunk as a Uint8Array
 * @param qubitCount Number of qubits in the circuit
 * @returns The processed circuit and Circom input
 */
export function processDataWithQuantumCircuit(chunk: Uint8Array, qubitCount: number = 4): {
  circuit: any;
  circomInput: any;
} {
  // Create a quantum circuit
  const circuit = createQuantumCircuit(qubitCount);
  
  // Apply Hadamard gate to the first qubit
  applyHadamardGate(circuit, 1);
  
  // Generate Circom input
  const circomInput = generateCircomInput(circuit);
  
  return {
    circuit,
    circomInput
  };
}

/**
 * Create a quantum state with a specified number of qubits
 * @param qubitCount Number of qubits in the state
 * @returns The quantum state
 */
export function createQuantumState(qubitCount: number = 4): any {
  return new quantum.QuantumState(qubitCount);
}

/**
 * Normalize a vector
 * @param vector The vector to normalize
 * @returns The normalized vector
 */
export function normalizeVector(vector: number[]): number[] {
  return quantum.normalize(vector);
}

/**
 * Calculate the fidelity between two quantum states
 * @param stateA The first quantum state
 * @param stateB The second quantum state
 * @returns The fidelity between the states
 */
export function calculateFidelity(stateA: any, stateB: any): number {
  return quantum.calculateFidelity(stateA, stateB);
}
