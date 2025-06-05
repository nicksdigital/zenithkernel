
# 🚀 init.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`init.ts` bootstraps a new ZenithCore project environment. It sets up the directory structure, configuration files, and optionally initializes a template app or module framework for developers starting a new system.

---

## 🎯 Responsibilities

- Scaffold the core folder structure for a ZenithCore-compatible project
- Initialize config files like `.zenith/config.json`
- Offer to generate example systems, hydras, or test WASM modules
- Register local trust keys or developer identity

---

## 🧠 Command Example

```bash
zenith init --template hydra-dashboard
```

Creates:
```
my-app/
├── .zenith/
│   └── config.json
├── src/
│   └── bootstrap/
│   └── components/
├── manifests/
│   └── hydras/
└── README.md
```

---

## 🧰 Supported Flags

| Flag             | Description                             |
|------------------|-----------------------------------------|
| `--template`     | Scaffold a pre-built app or example     |
| `--key`          | Link developer key or wallet            |
| `--force`        | Overwrite existing files                |

---

## 🔗 Use Cases

- Quickstart a new dApp, Hydra UI, or consensus system
- Configure CI/CD for OST and zkProofs
- Developer onboarding flow

---

## 📁 File Path

```
cli/commands/init.ts
```

---

That's the final CLI in this batch. Would you like to start on the **next 10 files**, such as bootstrap utilities or Hydra runtime libs?
