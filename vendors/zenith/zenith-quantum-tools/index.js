import { QuantumCircuit } from './src/quantum_circuit';

const circuit = new QuantumCircuit(4);
const hGate = circuit['gateCache'].get('H') ?? [];
circuit.applySingleQubitGate(0, hGate);

const inputJson = circuit.toCircomInput();
console.log('Generated Circom Input:', inputJson);
