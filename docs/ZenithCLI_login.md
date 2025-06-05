
# 🔑 login.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`login.ts` is a CLI utility for authenticating into a ZenithCore-compatible remote registry or runtime. It supports both traditional login flows (username/password) and ZK-authenticated identity assertions.

---

## 🎯 Responsibilities

- Authenticate the developer against a remote or local ZenithCore hub
- Store signed login token (OST, ZK, or JWT-based)
- Enable publishing, fetching, or administrating manifests with access control

---

## 🧠 Command Example

```bash
zenith login --host https://registry.zenithhub.net
```

Prompts for credentials or identity:
- Username/password
- ZK Wallet key
- BioID (optional via zk-circuit)

---

## 🔐 Authentication Modes

| Mode     | Description                        |
|----------|------------------------------------|
| `basic`  | Username and password              |
| `zk`     | zkProof identity challenge         |
| `jwt`    | Token-based with optional refresh  |

---

## 📂 Output

- Stores credentials/token in `.zenith/credentials.json`
- Token used automatically by `publish`, `create`, `sign`

---

## 🔗 Use Cases

- Secure interaction with private OST registries
- Admin control for hydra verification layers
- ZK-driven access control for runtime clusters

---

## 📁 File Path

```
cli/commands/login.ts
```

---

Shall I continue with `login-zk.ts` next?
