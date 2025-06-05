import { QuantumCircuit } from './quantum_circuit';
import fs from 'fs';

async function main() {
  const circuit = new QuantumCircuit(3);

  // Apply gates to create a known superposition
  const hGate = circuit.gateCache.get('H');
  if (!hGate) throw new Error('Hadamard gate missing');
  circuit.applySingleQubitGate(0, hGate);

  const input = circuit.toCircomInput();
  console.log('Generated Circom Input:', input);

  // Generate proof
  const { proof, publicSignals } = await circuit.generateZkSnarkProof(
    'quantum_state_verifier.wasm',
    'quantum_state_verifier.zkey'
  );

  console.log('Proof:', proof);
  console.log('Public Signals (Expected Norm):', publicSignals);

  // Optionally save for debugging
  fs.writeFileSync('proof.json', JSON.stringify(proof, null, 2));
  fs.writeFileSync('public.json', JSON.stringify(publicSignals, null, 2));

  // Verify the proof using the verification key
  const isValid = await circuit.verifyZkSnarkProof('verification_key.json', proof, publicSignals);
  console.log('ZK Valid:', isValid);
}

main().catch(console.error);
