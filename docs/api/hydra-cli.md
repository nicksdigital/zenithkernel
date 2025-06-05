
# 🛠️ hydra-cli.ts – Component Implementation Manual

## 🔍 Overview

`hydra-cli.ts` is the command-line utility for generating and signing Hydra component manifests using the OST (Optimized Secure Transport) format. It bootstraps new Hydra modules by producing their manifest files and cryptographically signing them for authenticity and lifecycle management.

---

## 🎯 Purpose

- Scaffold a new Hydra manifest (`manifest.json`)
- Encode essential metadata like ID, entry point, version, and ZKP requirements
- Digitally sign the manifest for secure distribution and trust assurance
- Serve as a foundation for CLI-based Hydra publishing and discovery

---

## ⚙️ Core Commands

### `createHydra(id: string, entry: string)`

```ts
createHydra("HydraTrustBar", "HydraTrustBar.tsx");
```

1. Creates directory path `manifests/hydras/HydraTrustBar/`
2. Writes `manifest.json` with fields:
   - `id`, `entry`, `version`
   - `execType`: `"edge"` (or `"local"`)
   - `zkRequirement`: `true`
   - `dependencies`: React + `@zenithkernel/hydra-core`
3. Calls `signManifest(path)` to apply OST-compatible digital signature

---

## 🔐 Manifest Template Example

```json
{
  "id": "HydraTrustBar",
  "dependencies": ["react", "@zenithkernel/hydra-core"],
  "entry": "HydraTrustBar.tsx",
  "execType": "edge",
  "zkRequirement": true,
  "version": "1.0.0"
}
```

---

## 🔄 Integration with Runtime

- Manifest files are loaded dynamically by `hydrateRemoteHydra` or bundled by OST loader.
- Signature verification is performed before execution.
- ZKP requirement flag controls `HydraLoader`’s proof-checking behavior.

---

## 💡 Design Considerations

- Lightweight, file-based operation for GitOps compatibility
- Integrates cleanly into developer pipelines
- Can be extended for publishing, updating, or revoking manifests

---

## 🧪 Future Improvements

- `publishHydra()` – broadcast manifest to qDHT
- `verifyHydra()` – local signature & zk validation tool
- `updateHydra()` – bump version + re-sign manifest
- Bundle hydration preview tools (CLI rendering test)

---

## 📁 Save Location

```
src/cli/hydra-cli.ts
```

---

Would you like the same format for `HydraDashboard.tsx` next?
