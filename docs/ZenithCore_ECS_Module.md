
# 🧠 ECS.ts – ZenithCore System Module Manual

## 🔍 Overview

`ECS.ts` is the foundational module of the ZenithCore kernel. It implements a modular, performant **Entity Component System (ECS)** runtime that allows dynamic creation, tracking, and interaction of distributed systems in a highly composable and efficient manner.

ZenithCore’s ECS is tightly integrated with:
- ZK-trust scoring (`TrustOracle`)
- Quantum consensus vectors (`OptimizedPOBPC`)
- qDHT entity broadcasting
- Hydra component auto-refreshing

---

## 🎯 Responsibilities

- Create and destroy entities
- Attach and detach components to entities
- Trigger system-level updates across execution frames
- Provide observability hooks to external systems (Hydras, metrics, AIManager)

---

## 🏗️ Core Functions

### `createEntity()`
Creates a new entity ID and registers its entry in the internal state table.

### `addComponent(entityId, componentKey, componentData)`
Adds a structured component with indexed fields to an entity.

### `removeComponent(entityId, componentKey)`
Unbinds a component from an entity and updates change-tracking systems.

### `getComponent(entityId, componentKey)`
Reads current value of a component for reactive binding and rendering.

---

## 🔄 Integration Points

- **Hydras**: Components like `HydraTrustBar` use `useECSState()` to bind visual output to live ECS data.
- **AIManager**: Optimization signals are pulled directly from ECS entity telemetry.
- **qDHT**: Entities and component diffs can be broadcast to peers and relayed across mesh topologies.

---

## 🧪 Observability Hooks

- ECS emits lifecycle events that can be consumed by:
  - WebSocket transport (dev tools)
  - TrustOracle (for decay or fault detection)
  - NovaStream (for runtime analysis overlays)

---

## 📁 File Path

```
core/modules/ECS.ts
```

---

Shall I continue with `BaseSystem.ts` next?
