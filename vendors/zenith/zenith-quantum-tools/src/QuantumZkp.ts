import { QuantumState } from './quantum_state';
import { QuantumCircuit } from './quantum_circuit';
import { complex } from 'mathjs';
import { groth16 } from 'snarkjs';
import { applyControlledGate } from './quantum_operations';
import fetch from 'node-fetch';

export async function entangleBytes(bytes: Uint8Array, qubits: number, postTo?: string) {
  const size = 1 << qubits;
  const vec = Array.from({ length: size }, (_, i) => complex((bytes[i] ?? 0) / 255, 0));
  const state = new QuantumState(vec);

  const qc = new QuantumCircuit(qubits);
  qc.loadState(state);

  for (let i = 0; i < qubits; i++) {
    const h = qc['gateCache'].get('H');
    const p = qc['gateCache'].get('P');
    if (!h || !p) throw new Error("Missing gates");
    qc.applySingleQubitGate(i, h);
    if (i < qubits - 1) applyControlledGate(qc.getState(), i, i + 1, p);
  }

  const input = qc.toCircomInput();
  const { proof, publicSignals } = await groth16.fullProve(input, "./quantum_state_verifier.wasm", "./circuit.zkey");

  if (postTo) {
    await fetch(postTo, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof, publicSignals })
    });
  }

  return { proof, publicSignals };
}