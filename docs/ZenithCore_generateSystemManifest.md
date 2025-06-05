
# 🧾 generateSystemManifest.ts – ZenithCore Runtime Utility Manual

## 🔍 Overview

`generateSystemManifest.ts` programmatically generates OST-compatible manifests for ZenithCore systems and components. These manifests can be used for decentralized distribution, validation, and runtime loading of WASM modules or UI Hydras.

---

## 🎯 Responsibilities

- Accept system metadata (name, entry, version, deps)
- Construct a fully qualified manifest object
- Optionally attach a signature using `ManifestAuth`
- Return JSON structure for saving or publishing

---

## 🧠 Example Usage

```ts
const manifest = generateSystemManifest({
  id: 'TrustOracleSystem',
  entry: 'TrustOracleSystem.ts',
  execType: 'local',
  zkRequirement: false
});
```

Returns:
```json
{
  "id": "TrustOracleSystem",
  "entry": "TrustOracleSystem.ts",
  "version": "1.0.0",
  "execType": "local",
  "zkRequirement": false,
  "dependencies": []
}
```

---

## 🧩 Key Fields

- `id`: Unique system identifier
- `entry`: Source or bundle path
- `execType`: `"local"`, `"edge"`, or `"remote"`
- `zkRequirement`: Boolean ZKP enforcement
- `version`: Semantic version
- `dependencies`: Array of system/module deps

---

## 🔗 Integration

- Used by CLI tools like `create-module` or `sign-manifest`
- Optionally consumed by `WasmLoader` or `HydraRuntime`
- Essential for OST signing + trust pipeline

---

## 📁 File Path

```
src/utils/generateSystemManifest.ts
```

---

Would you like me to continue with `ManifestAuth.ts` next?
