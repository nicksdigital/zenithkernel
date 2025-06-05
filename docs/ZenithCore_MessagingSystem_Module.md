
# ✉️ MessagingSystem.ts – ZenithCore System Module Manual

## 🔍 Overview

`MessagingSystem.ts` handles decentralized, secure, and optionally ZK-authenticated message transmission between entities in the ZenithCore kernel. It is an entity-backed system that manages inboxes, outboxes, and delivery logic across real-time and asynchronous channels.

---

## 🎯 Responsibilities

- Manage encrypted message delivery between ECS entities
- Route via internal mesh, direct peer-to-peer, or external relays
- Track delivery receipts and temporal order
- Optionally verify sender identity via zkProof or qDHT bindings

---

## 🧠 Core Methods

### `updateEntity(entityId, delta)`
Processes messages for a given entity, including:
- Validating payloads
- Checking timestamps and sequence integrity
- Updating inbox/outbox ECS state

### `enqueueMessage(from, to, payload)`
Adds a message to the outgoing queue of `from` entity targeting `to`.

### `getInbox(entityId)`
Retrieves all incoming messages for a peer/entity.

---

## 🔐 Security and ZKP Integration

- Supports optional sender zkProof for sender validation
- Compatible with qDHT identity resolution and encryption layers
- Uses `KeyManagement` + `ZKPEnvelope` wrapper for zk-auditable payloads

---

## 🔗 ECS Component Requirements

| Component    | Purpose                         |
|--------------|----------------------------------|
| Inbox        | Holds received messages          |
| Outbox       | Tracks pending sends             |
| MessageMeta  | Contains delivery state and ZKP  |

---

## 🌐 Networking Flexibility

- Local loopback messaging (within kernel)
- DHT-announced inboxes (public identity sync)
- WebSocket/QUIC bridge for direct sessions
- Forwarding mode for post-quantum safe overlay

---

## 📁 File Path

```
core/messaging/MessagingSystem.ts
```

---

Shall I proceed with `Messenger.ts` next?
