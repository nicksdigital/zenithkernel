
# 🗂️ RegistryServer.ts – ZenithCore Network Registry Manual

## 🔍 Overview

`RegistryServer.ts` manages the decentralized identity and module registry logic for the ZenithCore runtime. It serves as a cryptographic and data resolution layer, mapping entity IDs to their registered components, keys, challenges, and zkProof anchors.

---

## 🎯 Responsibilities

- Host a distributed registry of Hydra/System manifests
- Authenticate and index entities using ZK and OST-backed credentials
- Serve discovery, challenge issuance, and verification endpoints
- Optionally act as a public zk gateway for clients

---

## 🧠 Key Functions

### `getEntityRegistry(entityId)`
Returns the full registry object for an entity, including:
- Trusted Hydras
- Public keys
- Role/permission sets
- zk anchors

### `registerManifest(manifest, signature)`
Accepts a Hydra/System manifest and indexes it under the appropriate identity if valid.

### `routeChallengeRequest()`
Routes challenge creation and resolution requests to the appropriate handler (`ChallengeSystem`, `VerifySystem`).

---

## 🧾 Registry Record Schema

```ts
{
  entity: "peer:0xABCD...",
  hydras: ["HydraTrustBar", "HydraDashboard"],
  pubkey: "...",
  roles: ["viewer", "moderator"],
  zkAnchor: "zk-auth-v1"
}
```

---

## 🔗 Interacts With

- `ChallengeSystem.ts`
- `VerifySystem.ts`
- `HydraLoader.tsx`
- Admin UI for diagnostics

---

## 🔒 Security Features

- zkProof-bound record resolution
- Role-based access grants
- Challenge verification replay protection

---

## 📁 File Path

```
src/modules/RegistryServer/RegistryServer.ts
```

---

Shall I proceed with `VerifySystem.ts` next?
