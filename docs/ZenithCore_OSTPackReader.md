
# 📖 OSTPackReader.ts – ZenithCore OST Bundle Reader Manual

## 🔍 Overview

`OSTPackReader.ts` implements the deserialization and verification logic for OST bundles in ZenithCore. It parses binary OST streams, validates their structure, extracts embedded metadata, and returns loadable manifests and entry files for runtime use.

---

## 🎯 Responsibilities

- Decode binary OST pack format
- Verify signature and segment integrity
- Extract manifest and entry code from segments
- Expose usable runtime artifacts (manifest, wasm/js, signature)

---

## 🧠 Key Methods

### `parseOSTPack(buffer: Buffer): OSTContents`
Reads an OST binary and returns:

```ts
{
  manifest: Manifest,
  entryCode: string | Uint8Array,
  signature: string,
  metadata: Record<string, any>
}
```

### `verifyPackIntegrity(contents: OSTContents): boolean`
Checks segment hashes and validates trust signature (if present).

---

## 📦 OST Reader Fields

- `segments`: Ordered list of decoded payloads
- `header`: Offsets and format version
- `footer`: Hashes and optional zk snapshot
- `meta`: Parsed manifest and hash of entry block

---

## 🔗 Used By

- `WasmLoader.ts`
- `DistributedModuleLoader.ts`
- `ManifestAuth.ts` (for trust & signature checks)

---

## 📁 File Path

```
src/codec/OSTPackReader.ts
```

---

Shall I continue with `ParallelOSTCompressor.ts` next?
