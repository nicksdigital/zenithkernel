
# 🛡 ChallengeSystem.ts – ZenithCore Registry Module Manual

## 🔍 Overview

`ChallengeSystem.ts` is part of the RegistryServer module suite in ZenithCore. It handles cryptographic challenges to prove identity, authorization, or capability in decentralized environments using zero-knowledge-friendly primitives.

This system enables ZK-authenticated Hydra activation, user access verification, and identity escrow resolution.

---

## 🎯 Responsibilities

- Generate or verify proof-of-access challenges
- Track active and expired challenge sessions
- Interface with qzkp verifier or registry zk circuits
- Serve as an authorization oracle for runtime components

---

## 🧠 Core Functions

### `issueChallenge(entityId: string): Challenge`
Creates a new challenge object for a given peer/entity, optionally embedding circuit context or nonce.

### `verifyChallenge(challengeId: string, proof: ZKProof): boolean`
Validates the proof response using the expected ZK circuit.

### `cleanupExpiredChallenges()`
Prunes expired or reused challenges to prevent replay.

---

## 🔐 Challenge Format

```ts
{
  id: "challenge123",
  entity: "peer0xabc",
  circuit: "zkAuthV1",
  expiresAt: 1682103495
}
```

---

## 🔗 Integration Points

- `HydraLoader` for proof-based activation
- `login-zk.ts` for user auth
- `RegistryServer` for peer identity validation
- `TrustOracleSystem` to bind challenge score gating

---

## 📁 File Path

```
src/modules/RegistryServer/ChallengeSystem.ts
```

---

Shall I document `RegistryServer.ts` next?
