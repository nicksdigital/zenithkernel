// QuantumOperations.ts — Multi-qubit ops
import { QuantumState } from './quantum_state';
import { add, multiply, complex } from 'mathjs';
import type { Complex } from 'mathjs';

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

export function applyControlledGate(state: QuantumState, control: number, target: number, gate: Complex[][]): void {
  const dim = state.size();
  const cmask = 1 << control;
  const tmask = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & cmask) !== 0) {
      const j = i ^ tmask;
      const a = state.getAmplitude(i);
      const b = state.getAmplitude(j);
      
      // Safely extract gate values with defaults
      const g00 = gate[0]?.[0] ? ensureComplex(gate[0][0]) : complex(0, 0);
      const g01 = gate[0]?.[1] ? ensureComplex(gate[0][1]) : complex(0, 0);
      const g10 = gate[1]?.[0] ? ensureComplex(gate[1][0]) : complex(0, 0);
      const g11 = gate[1]?.[1] ? ensureComplex(gate[1][1]) : complex(0, 0);
      
      // Perform matrix multiplication with type safety
      const term1 = multiply(g00, a);
      const term2 = multiply(g01, b);
      const term3 = multiply(g10, a);
      const term4 = multiply(g11, b);
      
      const newAmp1 = add(ensureComplex(term1), ensureComplex(term2));
      const newAmp2 = add(ensureComplex(term3), ensureComplex(term4));
      
      // Ensure we have proper Complex values before setting amplitudes
      const safeAmp1 = ensureComplex(newAmp1);
      const safeAmp2 = ensureComplex(newAmp2);
      
      state.setAmplitude(i, safeAmp1);
      state.setAmplitude(j, safeAmp2);
    }
  }
}
