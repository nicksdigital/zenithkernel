# Quantum-ZKP CLI Toolkit

A TypeScript-powered CLI and module for generating and verifying zk-SNARK proofs from quantum-inspired state vectors.

## ✨ Features

- Encode arbitrary `Uint8Array` as quantum state
- Apply entangling quantum gates (Hadamard + Phase)
- Export to Circom input
- Generate zk-SNARK proof via Groth16
- Optionally send proofs to webhook endpoints
- CLI and modular usage
- Verify proofs

---

## 🚀 Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Build & Run CLI

```bash
npm run build
tsx src/QuantumCircuit.ts prove
tsx src/QuantumCircuit.ts verify
```

### 3. Automate from Bytes ➜ Proof

```ts
import { entangleBytes } from './QuantumZkp';

const bytes = new TextEncoder().encode("hello zk");
const { proof, publicSignals } = await entangleBytes(bytes, 4);
```

Optional webhook:

```ts
await entangleBytes(bytes, 4, "https://your-server/api/proof");
```

---

## 📦 Structure

- `QuantumCircuit.ts`: Core CLI logic
- `QuantumState.ts`: Manages complex vector state
- `QuantumGates.ts`: Hadamard / Phase generators
- `QuantumZkp.ts`: Main bytes ➜ entangle ➜ proof logic
- `test.ts`: Demo usage
- `quantum_state_verifier.wasm`, `circuit_final.zkey`: Required compiled Circom files

---

## 🧠 Proof Circuit

Use `quantum_state_verifier.circom` to validate:
- State normalization (∑|amp|² = 1)
- Match expected gate length

---

## 📡 Output Format

```json
{
  "proof": { ... },
  "publicSignals": [ ... ]
}
```

This can be posted to a webhook or used for `snarkjs groth16 verify`.

---

## 🛠 Requirements

- `snarkjs`
- `quantum_state_verifier.wasm`, `circuit_final.zkey`
- Node.js + `tsx` (not Bun due to WASM threading)

---

## ✅ License
MIT — Built by Zenith Quantum Tools

---

## 🔍 Verifying a Proof

To verify externally:

```ts
import { verifyProof } from './verify';

const isValid = await verifyProof(proof, publicSignals);
console.log("✔️ Proof valid?", isValid);
```

The function uses `verification_key.json` by default. You can specify a different key file if needed.

