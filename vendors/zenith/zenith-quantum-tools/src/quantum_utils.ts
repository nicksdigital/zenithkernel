// QuantumUtils.ts — Quantum math helpers
import { abs, log2 } from 'mathjs';
import type { Complex } from 'mathjs';

// Helper function to safely access complex number properties
function getComplexValue(c: Complex | undefined): { re: number; im: number } {
  if (!c) return { re: 0, im: 0 };
  return {
    re: typeof c === 'number' ? c : (c as any).re ?? 0,
    im: typeof c === 'number' ? 0 : (c as any).im ?? 0
  };
}

export function normalize(vec: Complex[]): Complex[] {
  const norm = Math.sqrt(
    vec.reduce((acc, v) => {
      const { re, im } = getComplexValue(v);
      return acc + re ** 2 + im ** 2;
    }, 0)
  );
  
  return norm === 0 
    ? vec.map(() => ({ re: 0, im: 0 } as Complex))
    : vec.map(v => {
        const { re, im } = getComplexValue(v);
        return { re: re / norm, im: im / norm } as Complex;
      });
}

export function calculateFidelity(a: Complex[], b: Complex[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
  let real = 0, imag = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = getComplexValue(a[i]);
    const bVal = getComplexValue(b[i]);
    
    real += aVal.re * bVal.re + aVal.im * bVal.im;
    imag += aVal.im * bVal.re - aVal.re * bVal.im;
  }
  return real ** 2 + imag ** 2;
}
