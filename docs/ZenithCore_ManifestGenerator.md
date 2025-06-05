
# 🧾 ManifestGenerator.ts – ZenithCore Build Utility Manual

## 🔍 Overview

`ManifestGenerator.ts` is responsible for assembling structured, OST-compatible manifest definitions from dynamic or static inputs. It can be used programmatically or by CLI tools to bootstrap component metadata for use in distributed execution environments.

This utility supports manifest types for Hydras, Systems, and WASM modules.

---

## 🎯 Responsibilities

- Assemble manifest structure from input options
- Apply standard fields (id, entry, execType, version)
- Embed signing requirements or zk metadata
- Return a JSON object ready for signing or distribution

---

## 🧠 Core Method

### `generate(opts: ManifestOptions): Manifest`
Constructs and returns a valid manifest JSON with defaulted or overridden fields.

Example:

```ts
generate({
  id: "HydraDashboard",
  entry: "HydraDashboard.tsx",
  execType: "edge",
  zkRequirement: true
});
```

---

## 🧩 Output Manifest Format

```json
{
  "id": "HydraDashboard",
  "entry": "HydraDashboard.tsx",
  "execType": "edge",
  "zkRequirement": true,
  "version": "1.0.0",
  "dependencies": []
}
```

---

## 🔗 Use Cases

- CLI: `create-hydra`, `create-module`, `init`
- Web IDEs or admin tools for Hydra generation
- Signing pipelines and dev tool integrations

---

## 📁 File Path

```
src/utils/ManifestGenerator.ts
```

---

Ready to proceed with `ChallengeSystem.ts`?
