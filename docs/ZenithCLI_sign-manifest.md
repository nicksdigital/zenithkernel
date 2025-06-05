
# 🔐 sign-manifest.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`sign-manifest.ts` is a CLI utility that digitally signs a Hydra manifest using an OST-compatible signature. This enforces trust and authenticity guarantees when Hydra components are hydrated across distributed runtimes.

---

## 🎯 Responsibilities

- Load an existing manifest JSON file
- Generate or retrieve a valid signing key
- Attach a digital signature and optional metadata
- Output a signed manifest for deployment or verification

---

## 🧠 Command Example

```bash
zenith sign-manifest --path ./manifests/hydras/HydraTrustBar/manifest.json
```

This command:
- Verifies manifest schema
- Applies OST-compatible digital signature
- Optionally logs signature fingerprint and timestamp

---

## 🔐 Signature Structure

- ECDSA or Kyber-compatible signature
- Timestamp or versioned hash
- Signer fingerprint or ID (optional)
- Optional zk metadata (QZKP circuit hash or verifier hint)

---

## 📦 Output

- Overwrites or writes alongside: `manifest.signed.json`
- Ensures that hydration runtimes can validate before instantiating the component

---

## 📁 File Path

```
cli/commands/sign-manifest.ts
```

---

Shall I continue with `publish-module.ts` next?
