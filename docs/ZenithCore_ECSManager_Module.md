
# 🧠 ECSManager.ts – ZenithCore Runtime Module Manual

## 🔍 Overview

`ECSManager.ts` is the orchestrator and access gateway for all ECS data within ZenithCore. It provides runtime APIs for managing entities, components, and their relationships in memory, enabling deterministic, reactive, and high-performance system logic.

---

## 🎯 Responsibilities

- Manage global state of all ECS entities and components
- Offer APIs for adding, updating, querying, and deleting components
- Act as the data layer beneath systems, Hydras, and consensus processes
- Maintain change tracking and observability channels

---

## 🧠 Core Methods

### `createEntity(): EntityId`
Allocates a new entity ID and registers it into the global state.

### `addComponent(entityId, key, data)`
Attaches a structured component to a given entity with immutable type safety.

### `getComponent(entityId, key)`
Retrieves a component for rendering or mutation.

### `removeComponent(entityId, key)`
Removes a component from the given entity.

### `hasComponent(entityId, key): boolean`
Checks presence of a specific component on an entity.

---

## 🔧 Advanced Features

- Reactive ECS bindings (`useECSState`, `useHydraEvents`)
- Change event broadcasting for sync engines (e.g., WebSocket, qDHT)
- Scoped component sets for filtering (e.g., all `TrustScores`)

---

## 🔗 Integrations

- Systems (via `BaseSystem`) call into `ECSManager` for state access
- Hydras use it through `useECSState` for live rendering
- TrustOracle, Consensus layers, MessagingSystem all rely on it

---

## 📐 Example

```ts
const peerId = ecs.createEntity();
ecs.addComponent(peerId, "TrustScore", { value: 78 });
const trust = ecs.getComponent(peerId, "TrustScore");
```

---

## 📁 File Path

```
core/ecs/ECSManager.ts
```

---

Shall I continue with `MessagingSystem.ts` next?
