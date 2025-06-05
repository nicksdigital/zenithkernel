
# 🧷 EntityBackedSystem.ts – ZenithCore System Module Manual

## 🔍 Overview

`EntityBackedSystem.ts` defines a specialized ECS system abstraction for modules that require one-to-one or one-to-many entity bindings. This is useful for runtime modules that track or manage per-entity behaviors, such as decentralized messaging, ZKP claim tracking, or vector consensus roles.

It extends the foundational `BaseSystem` class and adds entity-scoped logic.

---

## 🎯 Responsibilities

- Manage ECS-bound lifecycle tied to a specific entity or group of entities
- Streamline system logic into entity loop iteration
- Reduce boilerplate for common component read/write patterns

---

## 🧠 Core Methods

### `onAttach(entityId: string)`
Called when the system is linked to a new ECS entity. Typically used to initialize local state or listeners.

### `onDetach(entityId: string)`
Called when an entity is unlinked or deleted. Useful for cleanup or deregistration.

### `updateEntity(entityId: string, delta: number)`
Handles logic specific to each entity during update cycles.

### `update(world, delta)`
Iterates through all registered entities and calls `updateEntity`.

---

## 🔗 Use Case Examples

- `TrustOracleSystem`: score tracking per peer
- `QuantumWitnessSystem`: batch voting tied to entity state
- `MessageInboxSystem`: per-user encrypted inbox with consensus integrity

---

## 📐 Code Snippet

```ts
class MessageInboxSystem extends EntityBackedSystem {
  updateEntity(entityId, delta) {
    const inbox = this.world.getComponent(entityId, "Inbox");
    // process inbox messages
  }
}
```

---

## 📁 File Path

```
core/runtime/EntityBackedSystem.ts
```

---

Shall I continue with `DynamicManifestResolver.ts` next?
