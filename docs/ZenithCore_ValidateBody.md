
# 🧼 ValidateBody.ts – ZenithCore Request Validation Decorator Manual

## 🔍 Overview

`ValidateBody.ts` is a decorator used to validate HTTP request bodies for REST endpoints in the ZenithCore runtime. It ensures that inputs conform to expected schemas before reaching handler logic, improving safety and developer ergonomics.

---

## 🎯 Responsibilities

- Attach a schema or validation function to an HTTP route
- Automatically reject malformed or missing input
- Improve DX and trustworthiness for system-level APIs

---

## 🧠 Example Usage

```ts
@HttpRoute('POST', '/register')
@ValidateBody({
  id: 'string',
  entry: 'string',
  execType: 'string'
})
public registerHydra(req) {
  return this.systemManager.registerManifest(req.body);
}
```

---

## 🔧 Supported Schema Types

- Object schemas (string, number, boolean)
- Required vs optional fields
- Custom validator functions

---

## ❌ Rejection Behavior

- Sends `400 Bad Request` if validation fails
- Logs reason and caller metadata (if debugging enabled)

---

## 🔗 Use Cases

- API surface for `HydraLoader`, `RegistryServer`, `ManifestAuth`
- Developer extensions and CLI WebSocket relays
- ECS mutation APIs

---

## 📁 File Path

```
src/decorators/ValidateBody.ts
```

---

All decorators are now fully documented. Would you like to continue with the OST compression or admin UI components?
