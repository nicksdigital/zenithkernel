
# 🧱 SystemComponent.ts – ZenithCore ECS Decorator Utility Manual

## 🔍 Overview

`SystemComponent.ts` is a utility decorator used to bind ECS component types to specific systems in the ZenithCore runtime. It allows for automatic type registration, introspection, and runtime schema validation between components and the systems that consume them.

---

## 🎯 Responsibilities

- Declare system-specific component contracts
- Annotate data types used in ECS world per system
- Register schemas for developer tools and runtime engines
- Optionally validate ECS data before mutation

---

## 🧠 Example Usage

```ts
@SystemComponent('TrustScore')
export interface TrustScore {
  value: number;
  decay: number;
}
```

This registers the `TrustScore` component globally and makes it discoverable by ECS and dev tooling.

---

## 🔧 Decorator Signature

```ts
SystemComponent(name: string): ClassDecorator
```

- `name`: The component name used internally by the ECS

---

## 🔗 Used By

- `ECSManager` for schema initialization
- Dev tools like `ECSViewer.tsx`
- `BaseSystem` implementations using `getComponent()` calls

---

## 📁 File Path

```
src/decorators/SystemComponent.ts
```

---

Shall I continue with `ValidateBody.ts` next?
