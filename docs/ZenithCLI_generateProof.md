
# 🧪 generateProof.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`generateProof.ts` is a CLI utility that generates a zero-knowledge proof (zkProof) for use in Hydra or system authentication contexts. It integrates with the QZKP (Quantum Zero-Knowledge Proof) module and optionally supports local or remote proof services.

---

## 🎯 Responsibilities

- Accept identity or claim input
- Trigger zk circuit execution using qzkp
- Serialize proof for Hydra manifest or runtime usage
- Optionally verify the proof locally after generation

---

## 🧠 Command Example

```bash
zenith generate-proof --peer 0xDEADBEEF --claim "trustScore > 75"
```

This command:
- Constructs the zk input circuit
- Runs a prover (local or delegated)
- Outputs a serialized zkProof string
- Can optionally write to disk or inject into manifest context

---

## 🔐 Supported Options

| Flag         | Description                          |
|--------------|--------------------------------------|
| `--peer`     | Peer or entity ID to prove for       |
| `--claim`    | Logical claim to encode into ZKP     |
| `--output`   | Path to write proof to (optional)    |
| `--verify`   | Also verify the result locally       |

---

## 🔗 Integration Targets

- Used to populate `zkProof` context prop for Hydras
- Helpful during development to test trust-based UIs
- Verifier module: `qzkp.verifyZKProof(proof, claim)`

---

## 📁 File Path

```
cli/utils/generateProof.ts
```

---

Shall I continue with `quantum-sign.ts` next?
