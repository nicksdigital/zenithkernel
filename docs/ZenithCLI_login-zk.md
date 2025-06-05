
# 🧬 login-zk.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`login-zk.ts` is an advanced CLI utility that enables zero-knowledge-based authentication into ZenithCore registries or runtimes. It generates zkProofs of identity based on cryptographic claims, proving access without revealing credentials.

---

## 🎯 Responsibilities

- Generate zkProof from user identity or wallet
- Present proof to a verifier endpoint
- Retrieve an access token if proof is valid
- Store session for future secure CLI usage

---

## 🧠 Command Example

```bash
zenith login-zk --host https://zk.zenithhub.net --wallet zkUser.json
```

This command:
- Loads ZK identity keys
- Constructs claim (e.g., “I am zkUser#123”)
- Generates zkProof using `qzkp`
- Sends to registry verifier
- Returns a signed access token

---

## 🔐 Supported ZK Modes

| Scheme       | Purpose                            |
|--------------|------------------------------------|
| zkID         | Identity challenge + verifier      |
| zkClaim      | Proof of membership or reputation  |
| zkRole       | Access role gating (e.g., admin)   |

---

## 🔗 Token Usage

- Stored securely under `.zenith/zk-token.json`
- Used automatically for `publish`, `create`, `sign`
- Includes claim hash and expiration metadata

---

## 📁 File Path

```
cli/commands/login-zk.ts
```

---

Would you like to continue with the final in this batch: `init.ts`?
