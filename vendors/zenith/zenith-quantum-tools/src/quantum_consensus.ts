import { QuantumState } from './quantum_state';
import { hadamard } from './quantum_gates';
import { calculateFidelity } from './quantum_utils';
import { complex, Complex, multiply } from 'mathjs';

export interface ConsensusConfig {
  num_parties: number;
  num_qubits_per_party: number;
  max_rounds: number; // Maximum number of rounds to wait for consensus
  error_threshold: number;
  use_entanglement: boolean;
}

export interface ConsensusResult {
  success: boolean;
  rounds_taken: number;
  measurements: number[];
  final_states: QuantumState[];
  fidelity: number;
}

function createMultiPartyEntanglement(numParties: number, qubitsPerParty: number): QuantumState {
  // Create a new quantum state with the total number of qubits
  const totalQubits = numParties * qubitsPerParty;
  const state = new QuantumState();
  state.initializeWithQubits(totalQubits);
  
  // Apply Hadamard to create superposition on the first qubit of each party
  for (let i = 0; i < numParties; i++) {
    state.applyHadamard(i * qubitsPerParty);
  }
  
  // Apply controlled-phase gates between adjacent qubits
  for (let i = 0; i < numParties - 1; i++) {
    const control = i * qubitsPerParty;
    const target = (i + 1) * qubitsPerParty;
    
    // Create a temporary state with the controlled-phase applied
    const tempState = new QuantumState();
    tempState.initializeWithQubits(2); // Control and target qubits
    const size = 1 << (numParties * qubitsPerParty);
    const controlMask = 1 << control;
    const targetMask = 1 << target;
    
    // Initialize the state vector with zeros
    for (let j = 0; j < size; j++) {
      tempState.setAmplitude(j, complex(0, 0));
    }
    
    // Apply controlled-phase operation
    for (let basis = 0; basis < size; basis++) {
      let amplitude = state.getAmplitude(basis);
      
      // If both control and target qubits are |1⟩, apply phase shift
      if ((basis & controlMask) !== 0 && (basis & targetMask) !== 0) {
        const phase = complex(0, 1); // e^(iπ/2) = i
        amplitude = multiply(amplitude, phase) as Complex;
      }
      
      tempState.setAmplitude(basis, amplitude);
    }
    
    // Update the original state with the modified state
    for (let j = 0; j < size; j++) {
      state.setAmplitude(j, tempState.getAmplitude(j));
    }
  }
  
  return state;
}

function createEntangledStates(numParties: number, qubitsPerParty: number): QuantumState[] {
  if (numParties <= 0 || qubitsPerParty <= 0) {
    throw new Error('Number of parties and qubits per party must be positive');
  }

  const states: QuantumState[] = [];
  const entangled = createMultiPartyEntanglement(numParties, qubitsPerParty);
  
  for (let i = 0; i < numParties; i++) {
    const state = new QuantumState();
    state.initializeWithQubits(qubitsPerParty);
    for (let j = 0; j < qubitsPerParty; j++) {
      const idx = i * qubitsPerParty + j;
      const amplitude = entangled.getAmplitude(idx);
      // Ensure we're working with a proper Complex number
      const complexAmplitude = typeof amplitude === 'number' 
        ? complex(amplitude, 0) 
        : amplitude;
      state.setAmplitude(j, complexAmplitude);
    }
    states.push(state);
  }
  return states;
}

function performVotingRound(states: QuantumState[], round: number): number[] {
  if (!states.length) return [];
  return states.map(s => {
    const outcomes = s.getMeasurementOutcomes();
    return outcomes && outcomes.length > 0 ? (outcomes[0] ? 1 : 0) : 0;
  });
}

function checkConsensus(measurements: number[], threshold: number): boolean {
  if (measurements.length === 0) return false;
  if (threshold <= 0 || threshold > 1) {
    throw new Error('Threshold must be between 0 and 1');
  }
  
  let counts = [0, 0];
  let index = 0;
  for (const m of measurements) {
    if (m === undefined || (m !== 0 && m !== 1)) {
      throw new Error(`Invalid measurement value: ${m}. Expected 0 or 1.`);
    }
    // TypeScript now knows m is 0 or 1
    index = m as 0 | 1;
    // @ts-ignore;
    counts[index]++;
  }
  
  const ratio = Math.max(...counts) / measurements.length;
  return ratio >= threshold;
}

export function quantumByzantineAgreement(config: ConsensusConfig, initialStates: QuantumState[]): ConsensusResult {
  const result: ConsensusResult = { 
    success: false, 
    rounds_taken: 0, 
    measurements: [], 
    final_states: [], 
    fidelity: 0 
  };

  if (!initialStates || initialStates.length !== config.num_parties) {
    console.warn('Initial states array length does not match number of parties');
    return result;
  }

  let states: QuantumState[];
  try {
    const entangled = createMultiPartyEntanglement(config.num_parties, config.num_qubits_per_party);
    states = initialStates.map(s => s.tensorProduct(entangled));
  } catch (error) {
    console.error('Error creating entangled states:', error);
    return result;
  }

  while (result.rounds_taken < config.max_rounds) {
    const measurements = performVotingRound(states, result.rounds_taken);
    if (checkConsensus(measurements, config.error_threshold)) {
      result.success = true;
      result.measurements = measurements;
      break;
    }
    result.rounds_taken++;
  }

  result.final_states = states;
  
  // Calculate fidelity between first two states if we have at least two
  if (states.length >= 2 && states[0] && states[1]) {
    try {
      const stateVector1 = states[0]?.getStateVector?.() || [];
      const stateVector2 = states[1]?.getStateVector?.() || [];
      if (stateVector1.length > 0 && stateVector2.length > 0) {
        result.fidelity = calculateFidelity(stateVector1, stateVector2);
      } else {
        result.fidelity = 0;
      }
    } catch (error) {
      console.error('Error calculating fidelity:', error);
      result.fidelity = 0;
    }
  } else {
    result.fidelity = states.length === 1 ? 1 : 0;
  }
  
  return result;
}

export function quantumLeaderElection(config: ConsensusConfig): ConsensusResult {
  let states = Array.from({ length: config.num_parties }, () => {
    const s = new QuantumState();
    s.initializeWithQubits(config.num_qubits_per_party);
    s.applyHadamard(0);
    return s;
  });

  if (config.use_entanglement) {
    states = createEntangledStates(config.num_parties, config.num_qubits_per_party);
  }

  const measurements = performVotingRound(states, 0);
  const result: ConsensusResult = {
    success: true,
    rounds_taken: 1,
    measurements,
    final_states: states,
    fidelity: 1.0
  };

  return result;
}

export function quantumDistributedKeyGeneration(config: ConsensusConfig): ConsensusResult {
  let states = Array.from({ length: config.num_parties }, () => {
    const s = new QuantumState();
    s.initializeWithQubits(config.num_qubits_per_party);
    for (let j = 0; j < config.num_qubits_per_party; j++) {
      s.applyHadamard(j);
      s.applyPhase(j, Math.PI / 4);
    }
    return s;
  });

  if (config.use_entanglement) {
    states = createEntangledStates(config.num_parties, config.num_qubits_per_party);
  }

  const measurements = performVotingRound(states, 0);
  return {
    success: true,
    rounds_taken: 1,
    measurements,
    final_states: states,
    fidelity: 1.0
  };
}

export function verifyConsensus(result: ConsensusResult, config: ConsensusConfig): boolean {
  return result.success && result.rounds_taken <= config.max_rounds && checkConsensus(result.measurements, config.error_threshold);
}