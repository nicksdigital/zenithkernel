
# 🛠️ create-hydra.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`create-hydra.ts` is a CLI command that scaffolds a new Hydra component by generating its manifest and optionally signing it with an OST-compatible cryptographic identity. This utility bootstraps edge-executable UI modules within ZenithCore.

---

## 🎯 Responsibilities

- Accept input parameters: Hydra ID, entry file path
- Create a directory structure under `manifests/hydras/{id}`
- Generate a properly structured manifest.json
- Optionally sign the manifest using OST signature logic

---

## 🧠 Core Workflow

```bash
zenith create-hydra --id HydraTrustBar --entry src/components/HydraTrustBar.tsx
```

- Creates directory: `manifests/hydras/HydraTrustBar/`
- Writes a JSON manifest with:
  - `id`: "HydraTrustBar"
  - `entry`: path to source file
  - `execType`: "edge"
  - `zkRequirement`: true
- Uses OST utilities to cryptographically sign the manifest

---

## 🧩 Manifest Output Example

```json
{
  "id": "HydraTrustBar",
  "entry": "HydraTrustBar.tsx",
  "execType": "edge",
  "zkRequirement": true,
  "version": "1.0.0",
  "dependencies": ["react", "@zenithkernel/hydra-core"]
}
```

---

## 🧪 Use Cases

- Create new Hydra modules with signed integrity
- Prepare components for edge deployment via WASM/OST
- Enable ZK-authenticated hydration via manifest enforcement

---

## 📁 File Path

```
cli/commands/create-hydra.ts
```

---

Would you like me to continue with `sign-manifest.ts` next?
