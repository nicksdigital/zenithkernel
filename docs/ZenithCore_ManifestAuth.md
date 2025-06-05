
# 🔏 ManifestAuth.ts – ZenithCore Security Utility Manual

## 🔍 Overview

`ManifestAuth.ts` manages the cryptographic validation and signing of OST manifests in the ZenithCore runtime. It ensures that all manifests loaded into the system are verifiably authentic and tamper-proof.

This module underpins trust for both UI (Hydras) and logic (WASM/System) components.

---

## 🎯 Responsibilities

- Digitally sign manifest objects
- Verify existing manifest signatures
- Encode signer metadata (fingerprint, version, timestamp)
- Optionally hash for zk validation in proofs

---

## 🧠 Key Methods

### `signManifest(manifest: Manifest, key: CryptoKeyPair): SignedManifest`
- Applies a signature and returns a new object with `_signature` and `_signedBy` fields.

### `verifyManifest(manifest: SignedManifest, publicKey: CryptoKey): boolean`
- Validates that the manifest’s `_signature` field is correct and unmodified.

---

## 🔐 Signature Format

```json
{
  "_signedBy": "0xABC123...",
  "_signature": "MEUCIG5...",
  "_ts": "2025-05-23T12:00:00Z"
}
```

- Uses post-quantum safe algorithms (e.g., Dilithium, Kyber)
- Timestamped and version-tracked

---

## 🔗 Integration

- Called by CLI tools: `sign-manifest.ts`, `quantum-sign.ts`
- Used in `bootstrapKernel.ts` for manifest validation
- Compatible with `WasmLoader`, `HydraLoader`, `SystemManager`

---

## 📁 File Path

```
src/security/ManifestAuth.ts
```

---

Shall I proceed with `WasmLoader.ts` next?
