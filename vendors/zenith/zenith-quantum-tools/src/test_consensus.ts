import { complex } from 'mathjs';
import { QuantumState } from './quantum_state';
import { quantumByzantineAgreement, quantumLeaderElection, quantumDistributedKeyGeneration, verifyConsensus } from './quantum_consensus';

const config = {
  num_parties: 3,
  num_qubits_per_party: 2,
  max_rounds: 5,
  error_threshold: 0.6,
  use_entanglement: true
};

console.log("🧪 Testing Quantum Leader Election...");
const election = quantumLeaderElection(config);
console.log("✅ Leader Election Result:", election.measurements);

console.log("🧪 Testing Quantum Distributed Key Generation...");
const keygen = quantumDistributedKeyGeneration(config);
console.log("✅ Shared Key Bits:", keygen.measurements);

console.log("🧪 Testing Quantum Byzantine Agreement...");
const initialStates = Array.from({ length: config.num_parties }, () => {
  const state = new QuantumState();
  // Initialize with |0> state for each qubit
  for (let i = 0; i < config.num_qubits_per_party; i++) {
    state.setAmplitude(i, complex(1, 0)); // |0> state
  }
  return state;
});
const consensus = quantumByzantineAgreement(config, initialStates);
console.log("✅ Consensus Measurements:", consensus.measurements);
console.log("   ✔️ Reached?", consensus.success, "| Fidelity:", consensus.fidelity);

console.log("🧪 Verifying Consensus...");
const isValid = verifyConsensus(consensus, config);
console.log("✅ Consensus Valid:", isValid);