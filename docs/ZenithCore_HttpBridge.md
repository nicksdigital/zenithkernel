
# 🌉 HttpBridge.ts – ZenithCore Adapter Layer Manual

## 🔍 Overview

`HttpBridge.ts` provides a bridge between HTTP REST interfaces and internal ECS or system operations in ZenithCore. It enables external systems, clients, and developer tools to interact with the kernel using standard HTTP verbs.

---

## 🎯 Responsibilities

- Map HTTP routes to system methods or ECS mutations
- Serialize input and output between JSON and ECS
- Optionally support REST, RPC, or GraphQL extensions
- Authenticate requests via zkProof or OST-based tokens

---

## 🧠 Key Bindings

### `POST /ecs/:entity/components/:key`
- Adds or updates a component on an entity

### `GET /ecs/:entity/components/:key`
- Fetches current state of a component

### `POST /hydra/register`
- Registers a Hydra manifest or status with the kernel

### `POST /verify`
- Submits a zkProof to be validated by the system

---

## 🔐 Auth Modes

- OST tokens
- zkProof headers (`x-zkp-claim`)
- Basic developer mode (`?devMode=true`)

---

## 🔗 Integration Points

- Admin UI panels
- CLI tools using fetch/RPC
- `KernelRouter.ts` to define and route the handlers
- `VerifySystem.ts` and `SystemManager.ts`

---

## 📁 File Path

```
src/adapters/HttpBridge.ts
```

---

Shall I proceed with `KernelRouter.ts` next?
