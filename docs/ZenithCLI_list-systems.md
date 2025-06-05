
# 📋 list-systems.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`list-systems.ts` is a developer utility CLI command that enumerates all registered ECS systems within the ZenithCore runtime. It provides insights into system states, lanes, and initialization status to assist with debugging and introspection.

---

## 🎯 Responsibilities

- Query the `SystemManager` for all active and bootstrapped systems
- Print out system IDs, types, and priority lanes
- Support filtering or formatting for integration with dashboards

---

## 🧠 Command Example

```bash
zenith list-systems
```

Sample output:
```
- TrustOracleSystem       [lane: realTime]
- QuantumWitnessSystem    [lane: consensus]
- MessagingSystem         [lane: async]
```

---

## 🔧 Options

| Flag         | Description                          |
|--------------|--------------------------------------|
| `--json`     | Output as JSON                       |
| `--lane`     | Filter by lane (`realTime`, `async`) |
| `--status`   | Show init/teardown status            |

---

## 🔗 Use Cases

- Kernel diagnostics
- Debugging misbehaving systems
- Visual dashboard backends

---

## 📁 File Path

```
cli/commands/list-systems.ts
```

---

Shall I proceed with `login.ts` next?
