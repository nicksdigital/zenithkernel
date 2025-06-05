
# 🧩 LoadAllSystems.ts – ZenithCore Bootstrap Module Manual

## 🔍 Overview

`LoadAllSystems.ts` contains the registry logic for all core and optional systems used within the ZenithCore runtime. It ensures that all subsystems (e.g., trust, messaging, proof, rendering) are registered to the ECS world with correct priority lanes.

This module acts as the orchestration point between modular system classes and the `SystemManager`.

---

## 🎯 Responsibilities

- Import and instantiate system classes
- Register systems using `SystemManager.register(...)`
- Assign execution lanes via `Scheduler.setLane(...)`
- Ensure deterministic order of bootstrapping

---

## 🧠 System Inclusion Example

```ts
systemManager.register(new TrustOracleSystem());
scheduler.setLane(TrustOracleSystem, 'realTime');
```

- Can include both native and WASM-wrapped systems
- Supports dynamic loading for dev tools or plugin layers

---

## 🧩 Systems Commonly Registered

- TrustOracleSystem
- MessagingSystem
- QuantumWitnessSystem
- ZKValidatorSystem
- AdminPolicySystem
- ECSObservableSystem
- DebugSystem (in dev mode)

---

## 🔗 Integration Targets

- Called from `bootstrapKernel.ts`
- May reflect conditional flags from config
- Influences kernel diagnostics and system composition

---

## 📁 File Path

```
src/bootstrap/LoadAllSystems.ts
```

---

Shall I begin documenting the runtime utility `generateSystemManifest.ts` next?
