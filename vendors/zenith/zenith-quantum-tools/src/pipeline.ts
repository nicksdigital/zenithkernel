import { quantumLeaderElection, quantumDistributedKeyGeneration, quantumByzantineAgreement, verifyConsensus } from './quantum_consensus';
import { entangleBytes } from './QuantumZkp';
import { verifyProof } from './verify';
import { QuantumState } from './quantum_state';
import { BigNumber } from 'bignumber.js';

/**
 * Calculates the normalized sum of squared amplitudes
 * scaled by 1e18 (to match Circom fixed-point expectations)
 */
export function computeScaledNorm(real: number[], imag: number[]): string {
  const scaleFactor = new BigNumber(1e9);
  let total = new BigNumber(0);

  for (let i = 0; i < real.length; i++) {
    const r = new BigNumber(real[i]).div(scaleFactor);
    const im = new BigNumber(imag[i]).div(scaleFactor);
    total = total.plus(r.pow(2)).plus(im.pow(2));
  }

  return total.times(scaleFactor.pow(2)).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}

/**
 * Prepares public signals array for verification
 */
export function preparePublicSignals(real: number[], imag: number[]): string[] {
  const norm = computeScaledNorm(real, imag);
  return [norm];
}


export async function runQuantumPipeline(input: Uint8Array, qubits = 3) {
  const config = {
    num_parties: 3,
    num_qubits_per_party: 3,
    max_rounds: 5,
    error_threshold: 0.6,
    use_entanglement: true
  };

  const leader = quantumLeaderElection(config);
  const keygen = quantumDistributedKeyGeneration(config);
  // Initialize each party's quantum state with the correct number of qubits
  const initialStates = Array.from({ length: config.num_parties }, () => {
    const state = new QuantumState();
    state.initializeWithQubits(config.num_qubits_per_party);
    return state;
  });
  const consensus = quantumByzantineAgreement(config, initialStates);
  const consensusValid = verifyConsensus(consensus, config);

 
  const zkp = await entangleBytes(input, qubits);
  const zkpValid = await verifyProof(zkp.proof, zkp.publicSignals);
  console.log(zkp);
  console.log(zkpValid);
  return {
    leader,
    keygen,
    consensus,
    consensusValid,
    zk: {
      proof: zkp.proof,
      signals: zkp.publicSignals,
      valid: zkpValid
    }
  };
}