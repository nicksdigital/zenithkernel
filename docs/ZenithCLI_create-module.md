
# 🏗 create-module.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`create-module.ts` is a CLI tool designed to scaffold new kernel systems, modules, or protocol extensions within the ZenithCore runtime. It offers templates for BaseSystem, Hydra, WASM modules, and CLI extensions.

---

## 🎯 Responsibilities

- Generate module boilerplate code
- Create file/folder structure with prefilled templates
- Register metadata and optional default ECS components
- Support interactive or flag-based mode

---

## 🧠 Command Example

```bash
zenith create-module --type system --name TrustOracle
```

Creates:

```
src/modules/TrustOracle/
├── TrustOracleSystem.ts
├── index.ts
└── manifest.json (optional)
```

---

## 🧰 Module Types

| Type     | Description                                |
|----------|--------------------------------------------|
| `system` | ECS BaseSystem template                    |
| `hydra`  | UI component manifest + loader             |
| `wasm`   | WASM-bound runtime module                  |
| `cli`    | CLI command skeleton                       |

---

## 🔧 Options

- `--type`: Module category (`system`, `hydra`, `wasm`, `cli`)
- `--name`: Module name (PascalCase)
- `--with-tests`: Include test scaffold
- `--register`: Auto-register in `ZenithKernel.ts` (system only)

---

## 🔗 Use Cases

- Bootstrap new ECS systems
- Create reusable CLI commands
- Kickstart WASM components with signing manifest

---

## 📁 File Path

```
cli/commands/create-module.ts
```

---

Shall I proceed with `list-systems.ts` next?
