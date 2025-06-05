// QuantumState.ts — simplified Complex-backed quantum state
import { complex, multiply, add, abs } from 'mathjs';
import type { Complex } from 'mathjs';
import { hadamard, phase } from './quantum_gates';

export class QuantumState {
  private stateVector: Complex[];

  constructor(vec?: Complex[]) {
    this.stateVector = vec ? [...vec] : [];
  }

  getStateVector(): Complex[] {
    return this.stateVector;
  }

  applyHadamard(qubit: number): void {
    this.applySingleQubitGate(qubit, hadamard());
  }
  
  applyPhase(qubit: number, angle: number): void {
    this.applySingleQubitGate(qubit, phase(angle));
  }

  getMeasurementOutcomes(): boolean[] {
    if (this.stateVector.length === 0) {
      throw new Error('Quantum state not initialized');
    }

    const outcomes: boolean[] = [];
    const numQubits = Math.log2(this.stateVector.length);
    
    if (!Number.isInteger(numQubits)) {
      throw new Error('Invalid state vector length. Must be a power of 2.');
    }
    
    for (let i = 0; i < numQubits; i++) {
      let probOne = 0;
      for (let idx = 0; idx < this.stateVector.length; idx++) {
        const amp = this.stateVector[idx];
        if (!amp) continue;
        
        if ((idx >> i) & 1) { // If the i-th qubit is |1⟩
          // Calculate |amplitude|² using mathjs's complex operations
          const re = typeof amp.re === 'number' ? amp.re : 0;
          const im = typeof amp.im === 'number' ? amp.im : 0;
          const magnitudeSquared = re * re + im * im;
          probOne += magnitudeSquared;
        }
      }
      
      // Ensure probability is between 0 and 1
      probOne = Math.max(0, Math.min(1, probOne));
      const result = Math.random() < probOne;
      outcomes.push(result);
    }
    return outcomes;
  }
  
  
  applySingleQubitGate(qubit: number, gate: Complex[][]): void {
    if (this.stateVector.length === 0) {
      throw new Error('Quantum state not initialized');
    }

    // Validate gate structure
    if (!Array.isArray(gate) || gate.length !== 2 || 
        !gate.every(row => Array.isArray(row) && row.length === 2)) {
      throw new Error('Invalid gate structure. Expected 2x2 matrix.');
    }

    const numQubits = Math.log2(this.stateVector.length);
    if (qubit < 0 || qubit >= numQubits) {
      throw new Error(`Qubit index ${qubit} is out of bounds`);
    }

    const size = this.stateVector.length;
    const mask = 1 << qubit;
    const newVec = [...this.stateVector];
  
    for (let i = 0; i < size; i++) {
      if ((i & mask) === 0) {
        const i1 = i;
        const i2 = i | mask;
        const a = this.stateVector[i1] ?? complex(0, 0);
        const b = this.stateVector[i2] ?? complex(0, 0);
        
        // Ensure all gate elements are valid Complex numbers
        const g00 = (gate[0] && gate[0][0]) ?? complex(0, 0);
        const g01 = (gate[0] && gate[0][1]) ?? complex(0, 0);
        const g10 = (gate[1] && gate[1][0]) ?? complex(0, 0);
        const g11 = (gate[1] && gate[1][1]) ?? complex(0, 0);
        
        newVec[i1] = add(multiply(g00, a), multiply(g01, b)) as Complex;
        newVec[i2] = add(multiply(g10, a), multiply(g11, b)) as Complex;
      }
    }
  
    this.stateVector = newVec;
  }

  tensorProduct(other: QuantumState): QuantumState {
    const a = this.getStateVector();
    const b = other.getStateVector();
    const result: Complex[] = [];
  
    for (const x of a) {
      for (const y of b) {
        result.push(multiply(x, y) as Complex);
      }
    }
  
    return new QuantumState(result);
  }
  

  getAmplitude(i: number): Complex {
    return this.stateVector[i] ?? complex(0, 0);
  }

  setAmplitude(i: number, value: Complex): void {
    this.stateVector[i] = value ?? complex(0, 0);
  }

  size(): number {
    return this.stateVector.length;
  }

  /**
   * Initializes the quantum state with a specific number of qubits, all in the |0⟩ state
   * @param numQubits Number of qubits to initialize
   */
  initializeWithQubits(numQubits: number): void {
    if (!Number.isInteger(numQubits) || numQubits <= 0) {
      throw new Error('Number of qubits must be a positive integer');
    }
    
    const numStates = Math.pow(2, numQubits);
    this.stateVector = [];
    
    // Initialize with explicit complex zeros
    for (let i = 0; i < numStates; i++) {
      this.stateVector[i] = complex(0, 0);
    }
    
    // Set the |0...0⟩ state
    this.stateVector[0] = complex(1, 0);
  }

  /**
   * Initializes a specific qubit to |0⟩ or |1⟩ state
   * @param qubitIndex Index of the qubit to initialize (0-based)
   * @param value Boolean where false = |0⟩ and true = |1⟩
   */
  initializeQubit(qubitIndex: number, value: boolean): void {
    if (this.stateVector.length === 0) {
      throw new Error('Quantum state not initialized. Call initializeWithQubits first.');
    }
    
    const numQubits = Math.log2(this.stateVector.length);
    if (qubitIndex >= numQubits) {
      throw new Error(`Qubit index ${qubitIndex} is out of bounds for ${numQubits} qubit system`);
    }
    
    // If initializing to |1⟩, apply X gate (bit flip)
    if (value) {
      this.applySingleQubitGate(qubitIndex, [
        [complex(0, 0), complex(1, 0)],
        [complex(1, 0), complex(0, 0)]
      ]);
    }
  }
}
