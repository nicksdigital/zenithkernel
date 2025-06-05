
# 🧬 WasmLoader.ts – ZenithCore Runtime Utility Manual

## 🔍 Overview

`WasmLoader.ts` is responsible for loading, instantiating, and validating WASM modules in the ZenithCore kernel. It supports edge-executed components like Hydras, as well as secure system logic written in WASM.

It handles manifest resolution, host bindings, and optional zk validation before hydration.

---

## 🎯 Responsibilities

- Load WASM binary from a manifest-defined entry
- Bind runtime interfaces (ECS, logging, messaging)
- Instantiate in sandboxed environment
- Verify OST signature and zk hash if required
- Enable host-WASM interop with safe memory models

---

## 🧠 Core Methods

### `loadModuleFromManifest(manifest: Manifest): WasmInstance`
- Resolves manifest, fetches binary, verifies signature
- Binds host interfaces
- Instantiates WASM with memory and execution context

### `bindHostEnvironment(instance: WebAssembly.Instance)`
- Injects trusted functions into WASM:
  - `log()`, `sendMessage()`, `getComponent()`, etc.
- Ensures readonly access unless explicitly granted

---

## 🔐 Security

- Manifest signature required (`ManifestAuth`)
- Optional zkProof hash match check (via qzkp)
- Memory isolation: no access to global ECS directly
- Strict entry/export policy per manifest

---

## 🔗 Integration Targets

- Used by `hydrateRemoteHydra`
- Optionally extends `EntityBackedSystem` for WASM-wrapped logic
- Compatible with OST compression and bundle validation

---

## 📁 File Path

```
src/runtime/WasmLoader.ts
```

---

Would you like me to document `DistributedModuleLoader.ts` next?
