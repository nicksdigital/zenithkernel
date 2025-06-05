
# 🛣 HttpRoute.ts – ZenithCore Decorator Utility Manual

## 🔍 Overview

`HttpRoute.ts` is a decorator that marks a function as a handler for a specific HTTP route within the ZenithCore routing system. It is a lower-level alternative to `@ExposeRest`, offering fine-grained control over how requests are handled and dispatched.

---

## 🎯 Responsibilities

- Attach metadata to functions for HTTP exposure
- Register route handlers with exact method/path signatures
- Allow ECS or kernel operations to become accessible externally

---

## 🧠 Example Usage

```ts
@HttpRoute('GET', '/trust/:peerId')
public getTrustScore(req) {
  return this.ecs.getComponent(req.params.peerId, 'TrustScore');
}
```

This binds the method to `GET /trust/:peerId`.

---

## 🔧 Decorator Signature

```ts
HttpRoute(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string): MethodDecorator
```

---

## 🔗 Integration Points

- Used by `KernelRouter.ts` to bind handlers
- May be layered with `@ValidateBody()` or `@Authorize()`
- Forms the backbone of dev/admin APIs

---

## 📁 File Path

```
src/decorators/HttpRoute.ts
```

---

Shall I continue with `RegisterSystem.ts` next?
