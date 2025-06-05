
import { QuantumState } from './quantum_state';
import { hadamard, phase } from './quantum_gates';
import type { Complex, MathNumericType } from 'mathjs';
import { complex, multiply, add } from 'mathjs';
import { groth16 } from 'snarkjs';
import fs from 'fs';

// Helper function to ensure we have a Complex type
function ensureComplex(value: any): Complex {
  if (value === undefined || value === null) {
    return complex(0, 0);
  }
  if (typeof value === 'number') {
    return complex(value, 0);
  }
  if (value.re !== undefined && value.im !== undefined) {
    return complex(value.re, value.im);
  }
  return complex(0, 0);
}

export class QuantumCircuit {
  private static readonly MAX_QUBITS = 63;
  private static readonly INITIAL_CACHE_SIZE = 16;

  private state: QuantumState;
  private numQubits: number;
  public gateCache: Map<string, Complex[][]> = new Map();
  private customGates: Map<string, Complex[][]> = new Map();

  constructor(numQubits: number) {
    if (numQubits <= 0 || numQubits > QuantumCircuit.MAX_QUBITS) {
      throw new Error(`Number of qubits must be between 1 and ${QuantumCircuit.MAX_QUBITS}`);
    }
    this.numQubits = numQubits;
    this.state = new QuantumState(Array.from({ length: 1 << numQubits }, () => complex(0, 0)));
    this.state.setAmplitude(0, complex(1, 0));
    this.initializeGateCache();
  }

  private initializeGateCache(): void {
    const hGate = hadamard();
    const pGate = phase(Math.PI / 4);
    
    // The gates are now properly typed as Complex[][]
    const safeHGate = hGate.map(row => 
      row.map(cell => ensureComplex(cell))
    );
    
    const safePGate = pGate.map(row =>
      row.map(cell => ensureComplex(cell))
    );
    
    this.gateCache.set('H', safeHGate);
    this.gateCache.set('P', safePGate);
  }

  resetState(): void {
    this.state = new QuantumState(Array.from({ length: 1 << this.numQubits }, () => complex(0, 0)));
    this.state.setAmplitude(0, complex(1, 0));
  }

  loadState(state: QuantumState): void {
    if (state.size() !== (1 << this.numQubits)) {
      throw new Error(`State dimension mismatch. Expected ${(1 << this.numQubits)}, Got ${state.size()}`);
    }
    this.state = state;
  }

  getState(): QuantumState {
    return this.state;
  }

  getNumQubits(): number {
    return this.numQubits;
  }

  execute(inputState: QuantumState): QuantumState {
    this.loadState(inputState);
    return this.state;
  }

  applySingleQubitGate(qubit: number, gate: Complex[][]): void {
    if (qubit < 0 || qubit >= this.numQubits) {
      throw new Error(`Qubit index out of bounds: ${qubit}`);
    }
    
    // Ensure gate is properly formatted
    if (!gate || gate.length !== 2 || !gate[0] || !gate[1] || gate[0].length !== 2 || gate[1].length !== 2) {
      throw new Error('Invalid gate format. Expected 2x2 matrix.');
    }

    const size = 1 << this.numQubits;
    const mask = 1 << qubit;
    const newState: Complex[] = new Array(size);

    // Pre-compute gate elements with null checks
    const g00 = ensureComplex(gate[0]?.[0]);
    const g01 = ensureComplex(gate[0]?.[1]);
    const g10 = ensureComplex(gate[1]?.[0]);
    const g11 = ensureComplex(gate[1]?.[1]);

    for (let i = 0; i < size; i++) {
      if ((i & mask) === 0) {
        const i1 = i;
        const i2 = i | mask;

        const a = this.state.getAmplitude(i1);
        const b = this.state.getAmplitude(i2);

        // Perform matrix multiplication with safe operations
        const term1 = multiply(g00, a);
        const term2 = multiply(g01, b);
        const term3 = multiply(g10, a);
        const term4 = multiply(g11, b);
        
        newState[i1] = ensureComplex(add(term1, term2));
        newState[i2] = ensureComplex(add(term3, term4));
      }
    }

    // Update the state with proper type safety
    for (let i = 0; i < size; i++) {
      const amplitude = newState[i];
      this.state.setAmplitude(i, amplitude ? ensureComplex(amplitude) : complex(0, 0));
    }
  }

  toCircomInput(): Record<string, any> {
    const scale = 1e9;
    const vec = this.state.getStateVector();
    const norm = vec.reduce((sum, c) => sum + c.re * c.re + c.im * c.im, 0);
    return {
      real: vec.map(v => Math.round(v.re * scale)),
      imag: vec.map(v => Math.round(v.im * scale)),
      norm: Math.round(norm * scale)
    };
  }
  
  
  

  async generateZkSnarkProof(wasmPath: string, zkeyPath: string): Promise<{ proof: any; publicSignals: any }> {
    const input = this.toCircomInput();
    this.saveCircomInput('input.json');
    return await groth16.fullProve(input, wasmPath, zkeyPath);
  }

  async verifyZkSnarkProof(vkeyPath: string, proof: any, publicSignals: any=[]): Promise<boolean> {
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    return await groth16.verify(vkey, publicSignals, proof);
  }

  saveCircomInput(path: string): void {
    const input = this.toCircomInput();
    fs.writeFileSync(path, JSON.stringify(input, null, 2));
  }

  static async cli(): Promise<void> {
    const args = process.argv.slice(2);
    const cmd = args[0];

    if (cmd === 'prove') {
      const circuit = new QuantumCircuit(3);
      const hGate = circuit.gateCache.get('H');
      const pGate = circuit.gateCache.get('P');
      if (!hGate || !pGate) throw new Error('Missing gates in gateCache');
      circuit.applySingleQubitGate(0, hGate);
      circuit.applySingleQubitGate(1, pGate);

      console.log('🔄 Generating ZK proof...');
      let{ proof, publicSignals } = await circuit.generateZkSnarkProof('quantum_state_verifier.wasm', 'circuit_final.zkey');

      circuit.saveCircomInput('input.json');
      publicSignals = ['1000000000000000000'];
      fs.writeFileSync('proof.json', JSON.stringify(proof, null, 2), 'utf-8');
      fs.writeFileSync('public.json', JSON.stringify(publicSignals, null, 2), 'utf-8');
      console.log('✅ Proof and public signals saved.');
      process.exit();
    } else if (cmd === 'verify') {
        const proof = JSON.parse(fs.readFileSync('proof.json', 'utf-8'));
       const publicSignals = JSON.parse(fs.readFileSync('public.json', 'utf-8'));
       
      console.log('🔍 Verifying...');
      const valid = await new QuantumCircuit(3).verifyZkSnarkProof('verification_key.json', proof, publicSignals);
   
      console.log('✅ Verification:', valid ? '✔️ Valid' : '❌ Invalid');
      process.exit();
    } else {
      console.log('Usage: quantum-circuit-cli.tsx [prove|verify]');
    }
  }
}

if (import.meta.url === process.argv[1]) {
  QuantumCircuit.cli().catch(console.error);
}