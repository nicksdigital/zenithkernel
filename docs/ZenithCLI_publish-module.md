
# 📡 publish-module.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`publish-module.ts` enables the decentralized publication of signed Hydra or WASM modules into the ZenithCore network via OST and optionally qDHT. This tool is a cornerstone for propagating trusted UI and logic components across peers.

---

## 🎯 Responsibilities

- Load a signed manifest (e.g., `manifest.json`)
- Optionally verify its structure and digital signature
- Publish it to a distributed registry via OST/qDHT
- Generate a confirmation receipt or anchor metadata

---

## 🧠 Command Example

```bash
zenith publish-module --path ./manifests/hydras/HydraTrustBar/manifest.json
```

This command:
- Parses the manifest
- Validates the OST signature
- Pushes it into the publish queue (e.g., OST store, qDHT peer ring)
- Returns publish status and sync receipt

---

## 🔗 Features

- Interoperable with `create-hydra` and `sign-manifest`
- Compatible with CLI profiles or signing identities
- Logs network propagation state for Hydra visibility

---

## 🌍 Registry Targeting

Supports publication to:
- OST Layered storage
- PeerMesh DHT overlay
- WebSocket-pinned registries (for dev/test)

---

## 📁 File Path

```
cli/commands/publish-module.ts
```

---

Shall I continue with `generateProof.ts` next?
