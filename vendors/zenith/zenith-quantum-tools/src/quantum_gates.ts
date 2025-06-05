// QuantumGates.ts — Gate generators
import { complex, type Complex } from 'mathjs';

export function hadamard(): Complex[][] {
  const v = 1 / Math.sqrt(2);
  return [
    [complex(v, 0), complex(v, 0)],
    [complex(v, 0), complex(-v, 0)]
  ];
}

export function phase(theta: number): Complex[][] {
  return [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(Math.cos(theta), Math.sin(theta))]
  ];
}
