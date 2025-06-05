
# 🧬 RegisterSystem.ts – ZenithCore Decorator Utility Manual

## 🔍 Overview

`RegisterSystem.ts` is a decorator used to automatically register ECS-based systems into the ZenithCore kernel. It simplifies the lifecycle management of modular systems by ensuring they are detected and wired during kernel bootstrapping or dynamic registration.

---

## 🎯 Responsibilities

- Tag system classes for runtime registration
- Hook into `LoadAllSystems.ts` or `bootstrapKernel.ts`
- Ensure systems are loaded in the correct priority lane
- Optionally associate metadata (e.g., execution tags)

---

## 🧠 Example Usage

```ts
@RegisterSystem({ lane: 'realTime', name: 'TrustOracleSystem' })
export class TrustOracleSystem extends BaseSystem {
  update(world, delta) {
    // ...
  }
}
```

This registers the system into the `realTime` lane and exposes it to `SystemManager`.

---

## 🔧 Decorator Options

| Field     | Description                                |
|-----------|--------------------------------------------|
| `lane`    | Scheduler lane (`realTime`, `async`, etc.) |
| `name`    | System identifier name                     |
| `tags`    | Optional system capabilities or roles      |

---

## 🔗 Used By

- `bootstrapKernel.ts`
- `LoadAllSystems.ts`
- `SystemManager.register(...)`

---

## 📁 File Path

```
src/decorators/RegisterSystem.ts
```

---

Shall I continue with `SystemComponent.ts` next?
