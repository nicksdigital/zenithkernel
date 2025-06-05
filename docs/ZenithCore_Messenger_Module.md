
# 📨 Messenger.ts – ZenithCore Comms Utility Manual

## 🔍 Overview

`Messenger.ts` provides the communication interface for all messaging interactions in the ZenithCore runtime. It acts as an abstraction over the transport layer, supporting both local (in-kernel) and distributed (networked) message flows.

This utility is used by `MessagingSystem`, hydras, and other runtime services that require entity-to-entity or peer-to-peer communication with optional zk integrity.

---

## 🎯 Responsibilities

- Normalize message format and transport
- Offer interfaces for enqueueing, sending, and receiving messages
- Support local kernel bus and remote transport integration
- Provide optional ZKP-wrapped delivery

---

## 🧠 Core Methods

### `send(to: EntityId, payload: any, opts?: MessageOptions)`
Sends a message to a target entity using the best-available route (loopback, WebSocket, qDHT).

### `broadcast(payload: any)`
Sends a message to all active peers or entity subscribers.

### `receive(handler: (msg) => void)`
Registers a callback handler for incoming messages.

---

## 🔒 Security Layer

- Optionally signs or encrypts payloads using ZK-friendly formats
- Supports verifiable sender identity with zkProof envelopes
- Integrates with TrustOracle for spam/fraud filtering based on trust score

---

## 🔗 Use Cases

- Hydras that subscribe to remote state
- MessagingSystem delivery layer
- Developer tools emitting introspection data
- zk-authenticated user interactions

---

## 📁 File Path

```
core/messaging/Messenger.ts
```

---

Shall I finish with `WasmModuleProxy.ts` next?
