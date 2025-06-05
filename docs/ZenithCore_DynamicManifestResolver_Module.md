
# 📦 DynamicManifestResolver.ts – ZenithCore Utility Module Manual

## 🔍 Overview

`DynamicManifestResolver.ts` provides the runtime logic for loading, validating, and resolving OST-based Hydra manifests within ZenithCore. It allows the system to dynamically instantiate component definitions at runtime, supporting distributed, upgradeable, and ZK-verified UI logic.

It is critical for systems that use edge execution or live module hot-swapping.

---

## 🎯 Responsibilities

- Load manifest files based on Hydra ID or path
- Verify manifest signatures (OST)
- Determine execution type (`local`, `edge`, `remote`)
- Resolve entry points to component modules

---

## 🧠 Key Methods

### `resolveManifest(hydraId: string): Manifest`
Fetches and parses the manifest for a given Hydra ID. Validates format and returns the data structure.

### `verifySignature(manifestPath: string): boolean`
Ensures the manifest was signed with an authorized OST key.

### `getExecutionMode(manifest: Manifest): 'local' | 'edge' | 'remote'`
Returns the execution type which controls how and where the Hydra will be hydrated.

### `resolveEntry(manifest: Manifest): ComponentReference`
Locates and returns the code module referenced by the manifest (e.g., `HydraTrustBar.tsx`, WASM blob, etc.)

---

## 🧩 Manifest Example

```json
{
  "id": "HydraTrustBar",
  "entry": "HydraTrustBar.tsx",
  "execType": "edge",
  "zkRequirement": true,
  "dependencies": ["react", "@zenithkernel/hydra-core"]
}
```

---

## 🔗 Integration Points

- `hydrateRemoteHydra()` uses this to resolve runtime bundles.
- `createHydra()` from CLI writes compatible manifests.
- SystemManager could use this to dynamically instantiate new systems.

---

## 📁 File Path

```
core/runtime/DynamicManifestResolver.ts
```

---

Shall I proceed with `ECSManager.ts` next?
