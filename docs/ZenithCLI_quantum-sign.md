
# 🔐 quantum-sign.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`quantum-sign.ts` is a post-quantum signing utility used to digitally sign manifests, proofs, or Hydra bundles using lattice-based or hybrid post-quantum cryptographic schemes. It ensures long-term integrity and resistance against quantum adversaries.

---

## 🎯 Responsibilities

- Generate quantum-secure signatures (Kyber, Dilithium, Falcon)
- Attach signatures to JSON or WASM module artifacts
- Optionally encode metadata such as signer ID and timestamp
- Support local key loading or remote signer delegation

---

## 🧠 Command Example

```bash
zenith quantum-sign --file ./manifest.json --alg dilithium3 --key ./myKey.pem
```

This command:
- Hashes the file
- Applies Dilithium3 digital signature
- Outputs a `.sig` file or embedded signature field

---

## 🔐 Supported Algorithms

| Algorithm     | Description                         |
|---------------|-------------------------------------|
| `kyber512`    | Hybrid encryption + signature       |
| `dilithium3`  | Fast lattice-based signature        |
| `falcon512`   | Efficient ZK-compatible signature   |

---

## 📂 Output Options

- In-place signing (`manifest.json` → `manifest.signed.json`)
- Detached `.sig` file (can be stored in OST metadata)
- Fingerprint hash and signer ID included in header

---

## 🔗 Use Cases

- Signing manifests or Hydra components for OST validation
- Verifying trusted bundle publication
- Interfacing with zkProof metadata pipelines

---

## 📁 File Path

```
cli/utils/quantum-sign.ts
```

---

Shall I continue with `create-module.ts` next?
