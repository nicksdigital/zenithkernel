# 🧠 Quantum ZKP Pipeline

This project demonstrates a modular, zero-knowledge-compatible quantum protocol pipeline in TypeScript — including consensus, distributed key generation, entanglement, and Groth16 zk-SNARK proof verification.

---

## 📦 Modules

- `QuantumState`: Core quantum register simulation
- `QuantumConsensus`: Byzantine agreement, leader election, keygen
- `QuantumZkp`: Entanglement and ZKP input formatting
- `pipeline.ts`: End-to-end pipeline runner
- `verify.ts`: Groth16 proof verification

---

## 🚀 Pipeline Overview

```ts
import { runQuantumPipeline } from './pipeline';

const input = new TextEncoder().encode("hello quantum");
const result = await runQuantumPipeline(input);

console.log(JSON.stringify(result, null, 2));
```

---

## ✅ Features

- 🧬 Superposition + entanglement for leader election
- 🔐 Keygen using Hadamard + Phase gates
- 🗳 Byzantine Agreement via voting rounds
- 🔒 zk-SNARK proof from entangled state
- 🔍 ZKP verification using Groth16

---

## 🛠 Example Result

```json
{
  "leader": { "measurements": [0,1,0], ... },
  "keygen": { "measurements": [0,0,1], ... },
  "consensus": { "measurements": [1,1,1], "success": true, ... },
  "consensusValid": true,
  "zk": {
    "proof": {...},
    "signals": [...],
    "valid": true
  }
}
```

---

## 🧪 Testing

```bash
tsx test.ts
```

Or call `runQuantumPipeline(...)` programmatically with `Uint8Array` payloads.

---

## 🧵 Next Steps

- Webhook/Socket result delivery
- Real-time dashboard
- SNARK proof bundling into DID/SIOP

---

🛡 Quantum-secure consensus has never been simpler.