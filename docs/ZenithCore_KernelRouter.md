
# 🧭 KernelRouter.ts – ZenithCore Routing Adapter Manual

## 🔍 Overview

`KernelRouter.ts` defines the routing logic for incoming HTTP requests in the ZenithCore kernel. It maps RESTful or RPC calls to internal system operations, ECS mutations, manifest registrations, or zk validation flows.

It acts as the dynamic request dispatcher for the `HttpBridge` layer.

---

## 🎯 Responsibilities

- Match incoming HTTP routes to kernel handler functions
- Normalize request and response data
- Authenticate and authorize incoming requests
- Register handler groups for ECS, Hydra, and ZK services

---

## 🧠 Routing Patterns

### ECS Endpoints

```ts
router.post('/ecs/:entity/components/:key', handleSetComponent);
router.get('/ecs/:entity/components/:key', handleGetComponent);
```

### Hydra Management

```ts
router.post('/hydra/register', handleHydraManifest);
router.get('/hydra/list', handleListHydras);
```

### ZK and Trust

```ts
router.post('/verify', handleProofVerification);
router.post('/challenge', handleZKChallenge);
```

---

## 🔒 Middleware Hooks

- `authenticateZK()` – Validates zkProofs via `VerifySystem`
- `authorizeByRole()` – Checks peer or token roles
- `logRouteCall()` – Metrics + dev diagnostics

---

## 🔗 Use Cases

- Enables HTTP-admin panels
- Facilitates CLI access via REST API
- Allows devs to plug in dynamic test tools

---

## 📁 File Path

```
src/adapters/KernelRouter.ts
```

---

Ready for the decorator modules when you are.
