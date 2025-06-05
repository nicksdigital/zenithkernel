// QuantumCrypto.ts — ZKP-friendly quantum crypto
import { QuantumState } from './quantum_state';
import { QuantumCircuit } from './quantum_circuit';
import { complex } from 'mathjs';

export class QuantumCrypto {
  static deriveKey(length: number = 256): Uint8Array {
    const key = new Uint8Array(length / 8);
    for (let i = 0; i < key.length; i++) {
      key[i] = Math.floor(Math.random() * 256);
    }
    return key;
  }

  static encrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
    if (!key || !(key instanceof Uint8Array) || key.length === 0) {
      throw new Error('Invalid key: must be a non-empty Uint8Array');
    }
    return data.map((b, i) => b ^ (key[i % key.length] || 0));
  }

  static decrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
    return this.encrypt(data, key);
  }

  static createCircuit(n: number): QuantumCircuit {
    return new QuantumCircuit(n);
  }
}
