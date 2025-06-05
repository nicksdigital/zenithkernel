
# 🌐 ExposeRest.ts – ZenithCore Decorator Utility Manual

## 🔍 Overview

`ExposeRest.ts` is a decorator that exposes class methods as RESTful endpoints in the ZenithCore runtime via the `HttpBridge` and `KernelRouter`. It enables zero-boilerplate REST interface declaration from within core systems or kernel modules.

---

## 🎯 Responsibilities

- Decorate system or module methods to register them as REST endpoints
- Define HTTP method (GET, POST, etc.), path, and auth metadata
- Automatically inject route into runtime router

---

## 🧠 Example Usage

```ts
@ExposeRest({ method: 'POST', path: '/ecs/:id' })
public updateECS(id: string, data: any) {
  return this.ecs.updateComponent(id, data);
}
```

This makes the method available at `POST /ecs/:id`.

---

## 🔧 Decorator Options

| Field     | Description                        |
|-----------|------------------------------------|
| `method`  | HTTP method (e.g., POST, GET)      |
| `path`    | REST path relative to base         |
| `auth`    | Auth requirement (role, zkProof)   |
| `tags`    | Optional grouping tags (docs/UI)   |

---

## 🔗 Used In

- Core system modules
- Admin endpoints
- KernelRouter route registration

---

## 📁 File Path

```
src/decorators/ExposeRest.ts
```

---

Shall I continue with `HttpRoute.ts` next?
