

# ZenithCore_RegistryServer


# 🗂️ RegistryServer.ts – ZenithCore Network Registry Manual

## 🔍 Overview

`RegistryServer.ts` manages the decentralized identity and module registry logic for the ZenithCore runtime. It serves as a cryptographic and data resolution layer, mapping entity IDs to their registered components, keys, challenges, and zkProof anchors.

---

## 🎯 Responsibilities

- Host a distributed registry of Hydra/System manifests
- Authenticate and index entities using ZK and OST-backed credentials
- Serve discovery, challenge issuance, and verification endpoints
- Optionally act as a public zk gateway for clients

---

## 🧠 Key Functions

### `getEntityRegistry(entityId)`
Returns the full registry object for an entity, including:
- Trusted Hydras
- Public keys
- Role/permission sets
- zk anchors

### `registerManifest(manifest, signature)`
Accepts a Hydra/System manifest and indexes it under the appropriate identity if valid.

### `routeChallengeRequest()`
Routes challenge creation and resolution requests to the appropriate handler (`ChallengeSystem`, `VerifySystem`).

---

## 🧾 Registry Record Schema

```ts
{
  entity: "peer:0xABCD...",
  hydras: ["HydraTrustBar", "HydraDashboard"],
  pubkey: "...",
  roles: ["viewer", "moderator"],
  zkAnchor: "zk-auth-v1"
}
```

---

## 🔗 Interacts With

- `ChallengeSystem.ts`
- `VerifySystem.ts`
- `HydraLoader.tsx`
- Admin UI for diagnostics

---

## 🔒 Security Features

- zkProof-bound record resolution
- Role-based access grants
- Challenge verification replay protection

---

## 📁 File Path

```
src/modules/RegistryServer/RegistryServer.ts
```

---

Shall I proceed with `VerifySystem.ts` next?


# ZenithCore_VerifySystem


# ✅ VerifySystem.ts – ZenithCore ZK Verifier Module Manual

## 🔍 Overview

`VerifySystem.ts` is responsible for verifying zero-knowledge proofs (zkProofs) associated with Hydra components, registry identities, and system authentication events. It performs both inline proof checks and triggers external verifier circuits if configured.

This module is key for enforcing trust boundaries across distributed runtime logic in ZenithCore.

---

## 🎯 Responsibilities

- Accept proof verification requests from kernel modules or Hydra lifecycles
- Check zkProofs against the QZKP verifier
- Emit verification status into ECS or trust registries
- Manage verifier configuration, versions, and cache

---

## 🧠 Core Methods

### `verifyProof(entityId, zkProof)`
Checks proof validity for the specified peer or component. Returns boolean result.

### `getVerifier(circuit: string)`
Returns the verifier implementation or endpoint for the specified zk circuit.

### `cacheResult(hash, outcome)`
Stores pass/fail results to avoid re-verification within short timeframes.

---

## 🔗 Use Cases

- `HydraLoader.tsx` → verifies `zkProof` before hydration
- `RegistryServer.ts` → validates identity claims
- `ChallengeSystem.ts` → binds response verification to on-chain/off-chain circuits
- ZK role-based access control and gating

---

## 🔒 Verifier Types

- Local WASM verifier (in-kernel)
- zkVM-based verifier (offloaded)
- Remote QZKP proof broker (e.g., zkRollup node)
- Precompiled Rust ZK validator

---

## 📁 File Path

```
src/modules/RegistryServer/VerifySystem.ts
```

---

That wraps the registry module batch. Would you like to proceed with the decorators or adapter layer next?


# ZenithCLI_list-systems


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


# ZenithCore_generateSystemManifest


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


# zenithcore_components


# 🧭 ZenithCore Component Documentation

## 🧩 Hydra Component Overview

A **Hydra** is a decentralized UI component that replaces traditional "islands".
Each Hydra is independently instantiable, optionally edge-executable, and tied to distributed ECS state and zk-verifiable context.
Hydras use OST manifests for lifecycle definition and are tracked through ECS/qDHT.

---

## 📁 File Locations

- `src/components/hydra/HydraLoader.tsx` – React bridge component
- `src/components/hydra/HydraTrustBar.tsx` – ECS-driven trust visualizer
- `src/components/hydra/HydraDashboard.tsx` – Registry viewer for active Hydras
- `src/cli/zenith-cli.ts` – Manifest generation/signing CLI
- `src/hooks/useHydraEvents.ts` – Auto-refresh hook for ECS state
- `src/hooks/useHydraRegistry.ts` – Active Hydras + zk status list
- `src/lib/hydra-runtime.ts` – Hydration logic for remote/local components
- `src/manifests/hydras/[id]/manifest.json` – OST manifest for each Hydra

---

## ⚙️ Component Implementation Guide

### 1. `HydraLoader.tsx`
- Renders a placeholder `<div>` by ID.
- Calls `hydrateRemoteHydra` or `hydrateLocalHydra` based on props.
- Uses `useHydraEvents()` for ECS signal binding.

### 2. `HydraTrustBar.tsx`
- Uses `useECSState()` to fetch peer trust score.
- Validates zkProof using `verifyQZKP()`.
- Displays trust score + validation status.

### 3. `zenith-cli.ts`
- CLI command: `createHydra(id, entry)`
- Writes OST manifest and signs it.
- Manifest saved at `manifests/hydras/[id]/manifest.json`.

### 4. `HydraDashboard.tsx`
- Uses `useHydraRegistry()` to display all active Hydras.
- Visualizes zk validity and execution type.

### 5. `useHydraEvents.ts`
- Subscribes to ECS/qDHT updates for a given Hydra context.

### 6. `useHydraRegistry.ts`
- Lists known Hydras from qDHT/OST and validates them.

### 7. `hydra-runtime.ts`
- Defines `hydrateRemoteHydra()` for WASM/edge modules.
- Defines `hydrateLocalHydra()` for JSX-based modules.

---

## 🔁 Hydra Component Lifecycle

1. Use `createHydra()` CLI to scaffold a manifest.
2. Build component with ECS + zk context support.
3. Publish manifest under `manifests/hydras/[id]`.
4. Instantiate component with `<Hydra ... />`.
5. Updates auto-refresh via ECS/qDHT.
6. Use `HydraDashboard` to track status.

---

## ✨ Hydra Usage

```tsx
<Hydra id="HydraTrustBar" context={{ peerId: 'peer1', zkProof: '...' }} />
```

Trust bar will auto-refresh on ECS signals and validate zkProof.

---

## 🌐 ZenithCore Network Dynamics

- Hydras broadcast metadata via qDHT.
- zkProofs verified locally or remotely.
- Trust scores feed UI gating + logic.
- OST ensures manifest security.
- Offline-first design with gossip registry.

---

## 🚀 Future Extensions

- HydraShards (sub-component hydration)
- zkRollback (auto-invalidate state)
- WASM rendering pipeline
- Devtools integration for zkProof tests
- Incentive-based trust gating

---

## ✅ TODO: ZenithCore Hydra System

- [x] HydraLoader component (remote/local)
- [x] zkProof validation via `qzkp`
- [x] ECS signal hook: `useHydraEvents`
- [x] Manifest CLI: `createHydra(...)`
- [x] Visual registry: `HydraDashboard`
- [ ] Remote hydration runtime
- [ ] Registry integration via qDHT
- [ ] Pubsub-based update sync
- [ ] zkProof generator tooling
- [ ] Hot-reload for dev workflows
- [ ] zkFailback mechanism


# ZenithCLI_sign-manifest


# 🔐 sign-manifest.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`sign-manifest.ts` is a CLI utility that digitally signs a Hydra manifest using an OST-compatible signature. This enforces trust and authenticity guarantees when Hydra components are hydrated across distributed runtimes.

---

## 🎯 Responsibilities

- Load an existing manifest JSON file
- Generate or retrieve a valid signing key
- Attach a digital signature and optional metadata
- Output a signed manifest for deployment or verification

---

## 🧠 Command Example

```bash
zenith sign-manifest --path ./manifests/hydras/HydraTrustBar/manifest.json
```

This command:
- Verifies manifest schema
- Applies OST-compatible digital signature
- Optionally logs signature fingerprint and timestamp

---

## 🔐 Signature Structure

- ECDSA or Kyber-compatible signature
- Timestamp or versioned hash
- Signer fingerprint or ID (optional)
- Optional zk metadata (QZKP circuit hash or verifier hint)

---

## 📦 Output

- Overwrites or writes alongside: `manifest.signed.json`
- Ensures that hydration runtimes can validate before instantiating the component

---

## 📁 File Path

```
cli/commands/sign-manifest.ts
```

---

Shall I continue with `publish-module.ts` next?


# ZenithCore_VerifySystem (1)


# ✅ VerifySystem.ts – ZenithCore ZK Verifier Module Manual

## 🔍 Overview

`VerifySystem.ts` is responsible for verifying zero-knowledge proofs (zkProofs) associated with Hydra components, registry identities, and system authentication events. It performs both inline proof checks and triggers external verifier circuits if configured.

This module is key for enforcing trust boundaries across distributed runtime logic in ZenithCore.

---

## 🎯 Responsibilities

- Accept proof verification requests from kernel modules or Hydra lifecycles
- Check zkProofs against the QZKP verifier
- Emit verification status into ECS or trust registries
- Manage verifier configuration, versions, and cache

---

## 🧠 Core Methods

### `verifyProof(entityId, zkProof)`
Checks proof validity for the specified peer or component. Returns boolean result.

### `getVerifier(circuit: string)`
Returns the verifier implementation or endpoint for the specified zk circuit.

### `cacheResult(hash, outcome)`
Stores pass/fail results to avoid re-verification within short timeframes.

---

## 🔗 Use Cases

- `HydraLoader.tsx` → verifies `zkProof` before hydration
- `RegistryServer.ts` → validates identity claims
- `ChallengeSystem.ts` → binds response verification to on-chain/off-chain circuits
- ZK role-based access control and gating

---

## 🔒 Verifier Types

- Local WASM verifier (in-kernel)
- zkVM-based verifier (offloaded)
- Remote QZKP proof broker (e.g., zkRollup node)
- Precompiled Rust ZK validator

---

## 📁 File Path

```
src/modules/RegistryServer/VerifySystem.ts
```

---

That wraps the registry module batch. Would you like to proceed with the decorators or adapter layer next?


# ZenithCore_WasmLoader


# 🧬 WasmLoader.ts – ZenithCore Runtime Utility Manual

## 🔍 Overview

`WasmLoader.ts` is responsible for loading, instantiating, and validating WASM modules in the ZenithCore kernel. It supports edge-executed components like Hydras, as well as secure system logic written in WASM.

It handles manifest resolution, host bindings, and optional zk validation before hydration.

---

## 🎯 Responsibilities

- Load WASM binary from a manifest-defined entry
- Bind runtime interfaces (ECS, logging, messaging)
- Instantiate in sandboxed environment
- Verify OST signature and zk hash if required
- Enable host-WASM interop with safe memory models

---

## 🧠 Core Methods

### `loadModuleFromManifest(manifest: Manifest): WasmInstance`
- Resolves manifest, fetches binary, verifies signature
- Binds host interfaces
- Instantiates WASM with memory and execution context

### `bindHostEnvironment(instance: WebAssembly.Instance)`
- Injects trusted functions into WASM:
  - `log()`, `sendMessage()`, `getComponent()`, etc.
- Ensures readonly access unless explicitly granted

---

## 🔐 Security

- Manifest signature required (`ManifestAuth`)
- Optional zkProof hash match check (via qzkp)
- Memory isolation: no access to global ECS directly
- Strict entry/export policy per manifest

---

## 🔗 Integration Targets

- Used by `hydrateRemoteHydra`
- Optionally extends `EntityBackedSystem` for WASM-wrapped logic
- Compatible with OST compression and bundle validation

---

## 📁 File Path

```
src/runtime/WasmLoader.ts
```

---

Would you like me to document `DistributedModuleLoader.ts` next?


# ZenithCore_OSTCompression


# 🗜️ OSTCompression.ts – ZenithCore Compression Layer Manual

## 🔍 Overview

`OSTCompression.ts` implements the core compression utilities used in the OST (Optimized System Transfer) protocol within ZenithCore. It handles stream optimization, segment merging, and fingerprint hashing for efficient component transport across distributed systems.

---

## 🎯 Responsibilities

- Compress raw Hydra or WASM bundles into OST format
- Encode segment headers and boundaries
- Apply fingerprinting for verification and fast cache lookups
- Optionally support parallel segment encoding

---

## 🧠 Key Methods

### `compress(data: Buffer, options: OSTOptions): Buffer`
Compresses data into OST format using default or custom compression levels.

### `decompress(buffer: Buffer): DecodedOST`
Parses an OST buffer and reconstructs its original structure (header + segments).

### `hashSegment(segment): string`
Generates a cryptographic hash (SHA256 or zk-hash) for bundle verification.

---

## 🔩 OST Structure

- `Header`: Metadata, version, compression type
- `Segments`: Manifest, entry file, dependency graph
- `Footer`: Hash map and signature

---

## 🔗 Used In

- `HydraOSTCodec.ts`
- `ParallelOSTCompressor.ts`
- CLI tooling: `create-hydra`, `sign-manifest`, `publish-module`

---

## 📁 File Path

```
src/codec/OSTCompression.ts
```

---

Shall I continue with `OSTpack.ts` next?


# ZenithCore_MessagingSystem_Module


# ✉️ MessagingSystem.ts – ZenithCore System Module Manual

## 🔍 Overview

`MessagingSystem.ts` handles decentralized, secure, and optionally ZK-authenticated message transmission between entities in the ZenithCore kernel. It is an entity-backed system that manages inboxes, outboxes, and delivery logic across real-time and asynchronous channels.

---

## 🎯 Responsibilities

- Manage encrypted message delivery between ECS entities
- Route via internal mesh, direct peer-to-peer, or external relays
- Track delivery receipts and temporal order
- Optionally verify sender identity via zkProof or qDHT bindings

---

## 🧠 Core Methods

### `updateEntity(entityId, delta)`
Processes messages for a given entity, including:
- Validating payloads
- Checking timestamps and sequence integrity
- Updating inbox/outbox ECS state

### `enqueueMessage(from, to, payload)`
Adds a message to the outgoing queue of `from` entity targeting `to`.

### `getInbox(entityId)`
Retrieves all incoming messages for a peer/entity.

---

## 🔐 Security and ZKP Integration

- Supports optional sender zkProof for sender validation
- Compatible with qDHT identity resolution and encryption layers
- Uses `KeyManagement` + `ZKPEnvelope` wrapper for zk-auditable payloads

---

## 🔗 ECS Component Requirements

| Component    | Purpose                         |
|--------------|----------------------------------|
| Inbox        | Holds received messages          |
| Outbox       | Tracks pending sends             |
| MessageMeta  | Contains delivery state and ZKP  |

---

## 🌐 Networking Flexibility

- Local loopback messaging (within kernel)
- DHT-announced inboxes (public identity sync)
- WebSocket/QUIC bridge for direct sessions
- Forwarding mode for post-quantum safe overlay

---

## 📁 File Path

```
core/messaging/MessagingSystem.ts
```

---

Shall I proceed with `Messenger.ts` next?


# ZenithCore_ExposeRest (1)


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


# ZenithCLI_quantum-sign


# 🔐 quantum-sign.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`quantum-sign.ts` is a post-quantum signing utility used to digitally sign manifests, proofs, or Hydra bundles using lattice-based or hybrid post-quantum cryptographic schemes. It ensures long-term integrity and resistance against quantum adversaries.

---

## 🎯 Responsibilities

- Generate quantum-secure signatures (Kyber, Dilithium, Falcon)
- Attach signatures to JSON or WASM module artifacts
- Optionally encode metadata such as signer ID and timestamp
- Support local key loading or remote signer delegation

---

## 🧠 Command Example

```bash
zenith quantum-sign --file ./manifest.json --alg dilithium3 --key ./myKey.pem
```

This command:
- Hashes the file
- Applies Dilithium3 digital signature
- Outputs a `.sig` file or embedded signature field

---

## 🔐 Supported Algorithms

| Algorithm     | Description                         |
|---------------|-------------------------------------|
| `kyber512`    | Hybrid encryption + signature       |
| `dilithium3`  | Fast lattice-based signature        |
| `falcon512`   | Efficient ZK-compatible signature   |

---

## 📂 Output Options

- In-place signing (`manifest.json` → `manifest.signed.json`)
- Detached `.sig` file (can be stored in OST metadata)
- Fingerprint hash and signer ID included in header

---

## 🔗 Use Cases

- Signing manifests or Hydra components for OST validation
- Verifying trusted bundle publication
- Interfacing with zkProof metadata pipelines

---

## 📁 File Path

```
cli/utils/quantum-sign.ts
```

---

Shall I continue with `create-module.ts` next?


# ZenithCLI_login-zk


# 🧬 login-zk.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`login-zk.ts` is an advanced CLI utility that enables zero-knowledge-based authentication into ZenithCore registries or runtimes. It generates zkProofs of identity based on cryptographic claims, proving access without revealing credentials.

---

## 🎯 Responsibilities

- Generate zkProof from user identity or wallet
- Present proof to a verifier endpoint
- Retrieve an access token if proof is valid
- Store session for future secure CLI usage

---

## 🧠 Command Example

```bash
zenith login-zk --host https://zk.zenithhub.net --wallet zkUser.json
```

This command:
- Loads ZK identity keys
- Constructs claim (e.g., “I am zkUser#123”)
- Generates zkProof using `qzkp`
- Sends to registry verifier
- Returns a signed access token

---

## 🔐 Supported ZK Modes

| Scheme       | Purpose                            |
|--------------|------------------------------------|
| zkID         | Identity challenge + verifier      |
| zkClaim      | Proof of membership or reputation  |
| zkRole       | Access role gating (e.g., admin)   |

---

## 🔗 Token Usage

- Stored securely under `.zenith/zk-token.json`
- Used automatically for `publish`, `create`, `sign`
- Includes claim hash and expiration metadata

---

## 📁 File Path

```
cli/commands/login-zk.ts
```

---

Would you like to continue with the final in this batch: `init.ts`?


# ZenithCLI_create-module


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


# ZenithCore_OSTPackReader


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


# ZenithCore_ManifestAuth


# 🔏 ManifestAuth.ts – ZenithCore Security Utility Manual

## 🔍 Overview

`ManifestAuth.ts` manages the cryptographic validation and signing of OST manifests in the ZenithCore runtime. It ensures that all manifests loaded into the system are verifiably authentic and tamper-proof.

This module underpins trust for both UI (Hydras) and logic (WASM/System) components.

---

## 🎯 Responsibilities

- Digitally sign manifest objects
- Verify existing manifest signatures
- Encode signer metadata (fingerprint, version, timestamp)
- Optionally hash for zk validation in proofs

---

## 🧠 Key Methods

### `signManifest(manifest: Manifest, key: CryptoKeyPair): SignedManifest`
- Applies a signature and returns a new object with `_signature` and `_signedBy` fields.

### `verifyManifest(manifest: SignedManifest, publicKey: CryptoKey): boolean`
- Validates that the manifest’s `_signature` field is correct and unmodified.

---

## 🔐 Signature Format

```json
{
  "_signedBy": "0xABC123...",
  "_signature": "MEUCIG5...",
  "_ts": "2025-05-23T12:00:00Z"
}
```

- Uses post-quantum safe algorithms (e.g., Dilithium, Kyber)
- Timestamped and version-tracked

---

## 🔗 Integration

- Called by CLI tools: `sign-manifest.ts`, `quantum-sign.ts`
- Used in `bootstrapKernel.ts` for manifest validation
- Compatible with `WasmLoader`, `HydraLoader`, `SystemManager`

---

## 📁 File Path

```
src/security/ManifestAuth.ts
```

---

Shall I proceed with `WasmLoader.ts` next?


# ZenithCore_HttpRoute


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


# ZenithCLI_generateProof


# 🧪 generateProof.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`generateProof.ts` is a CLI utility that generates a zero-knowledge proof (zkProof) for use in Hydra or system authentication contexts. It integrates with the QZKP (Quantum Zero-Knowledge Proof) module and optionally supports local or remote proof services.

---

## 🎯 Responsibilities

- Accept identity or claim input
- Trigger zk circuit execution using qzkp
- Serialize proof for Hydra manifest or runtime usage
- Optionally verify the proof locally after generation

---

## 🧠 Command Example

```bash
zenith generate-proof --peer 0xDEADBEEF --claim "trustScore > 75"
```

This command:
- Constructs the zk input circuit
- Runs a prover (local or delegated)
- Outputs a serialized zkProof string
- Can optionally write to disk or inject into manifest context

---

## 🔐 Supported Options

| Flag         | Description                          |
|--------------|--------------------------------------|
| `--peer`     | Peer or entity ID to prove for       |
| `--claim`    | Logical claim to encode into ZKP     |
| `--output`   | Path to write proof to (optional)    |
| `--verify`   | Also verify the result locally       |

---

## 🔗 Integration Targets

- Used to populate `zkProof` context prop for Hydras
- Helpful during development to test trust-based UIs
- Verifier module: `qzkp.verifyZKProof(proof, claim)`

---

## 📁 File Path

```
cli/utils/generateProof.ts
```

---

Shall I continue with `quantum-sign.ts` next?


# ZenithCore_Scheduler_Module


# ⏱ Scheduler.ts – ZenithCore System Module Manual

## 🔍 Overview

`Scheduler.ts` coordinates the execution of all registered systems within the ZenithCore runtime environment. It determines the order, priority, and timing of updates across ECS-driven logic such as consensus engines, trust evaluation, AI optimization, and component rendering.

This modular scheduler supports:
- Multi-priority execution lanes
- Frame-by-frame updates
- Conditional execution (on-demand, tick-bound, event-driven)

---

## 🎯 Responsibilities

- Queue and dispatch updates for all active systems
- Enforce micro-priority execution (real-time, async, low-latency)
- Provide hookable lifecycle events (`onFrameStart`, `onFrameEnd`)
- Emit performance metrics for profiling and adaptation

---

## 🧠 Execution Lanes

| Lane        | Description                             |
|-------------|-----------------------------------------|
| realTime    | Critical systems (ZKP, consensus, AI)   |
| async       | Background tasks (telemetry, logging)   |
| edgeCompute | Offload-bound or delay-tolerant logic   |

---

## 🔧 Core Methods

### `register(system: BaseSystem)`
Adds the system to the scheduler and assigns it a default or custom lane.

### `run(deltaTime: number)`
Main execution loop called by the kernel or frame timer. Dispatches systems in order of priority.

### `setLane(system: BaseSystem, lane: string)`
Assigns a system to a specific priority group.

---

## 🔗 Integration Points

- **BaseSystem**: All registered systems must implement `update(world, delta)`.
- **Kernel**: Calls `scheduler.run()` on each tick or block.
- **Metrics Engine**: Collects timing + error data during execution.

---

## 📁 File Path

```
core/runtime/Scheduler.ts
```

---

Shall I continue with `SystemManager.ts` next?


# ZenithCore_DistributedModuleLoader


# 🌐 DistributedModuleLoader.ts – ZenithCore Network Utility Manual

## 🔍 Overview

`DistributedModuleLoader.ts` enables decentralized discovery and retrieval of system or component manifests and bundles over the ZenithCore network. It acts as a bridge between qDHT, OST registries, and local caches to hydrate and validate runtime modules dynamically.

---

## 🎯 Responsibilities

- Discover manifest or module metadata via qDHT
- Fetch and validate bundles from distributed stores
- Support fallback to signed OST or cache layers
- Enable offline-first rehydration for trusted components

---

## 🧠 Core Methods

### `fetchFromRegistry(id: string): Manifest | null`
Looks up a manifest by ID using gossip/qDHT + OST.

### `resolveAndLoad(id: string): Module | null`
Loads the full module (e.g., WASM or Hydra component) from resolved manifest.

### `isValid(manifest: Manifest): boolean`
Checks signature, format, and optionally zk claims before execution.

---

## 🔧 Capabilities

- Live rehydration of UI or logic bundles
- Registry fallback hierarchy: cache → OST → qDHT
- Auto-verification using `ManifestAuth` and zk snapshot metadata

---

## 🔐 Security

- Verifies manifest OST signatures
- May hash match against zk snapshot
- Local cache keyed by signed hash fingerprint

---

## 🔗 Used By

- `HydraLoader.tsx`
- `WasmLoader.ts`
- Admin dashboards (optional real-time trace)

---

## 📁 File Path

```
src/runtime/DistributedModuleLoader.ts
```

---

Shall I continue with `ManifestGenerator.ts` next?


# ZenithCLI_login


# 🔑 login.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`login.ts` is a CLI utility for authenticating into a ZenithCore-compatible remote registry or runtime. It supports both traditional login flows (username/password) and ZK-authenticated identity assertions.

---

## 🎯 Responsibilities

- Authenticate the developer against a remote or local ZenithCore hub
- Store signed login token (OST, ZK, or JWT-based)
- Enable publishing, fetching, or administrating manifests with access control

---

## 🧠 Command Example

```bash
zenith login --host https://registry.zenithhub.net
```

Prompts for credentials or identity:
- Username/password
- ZK Wallet key
- BioID (optional via zk-circuit)

---

## 🔐 Authentication Modes

| Mode     | Description                        |
|----------|------------------------------------|
| `basic`  | Username and password              |
| `zk`     | zkProof identity challenge         |
| `jwt`    | Token-based with optional refresh  |

---

## 📂 Output

- Stores credentials/token in `.zenith/credentials.json`
- Token used automatically by `publish`, `create`, `sign`

---

## 🔗 Use Cases

- Secure interaction with private OST registries
- Admin control for hydra verification layers
- ZK-driven access control for runtime clusters

---

## 📁 File Path

```
cli/commands/login.ts
```

---

Shall I continue with `login-zk.ts` next?


# ZenithCore_RegisterSystem


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


# ZenithCore_ECS_Module


# 🧠 ECS.ts – ZenithCore System Module Manual

## 🔍 Overview

`ECS.ts` is the foundational module of the ZenithCore kernel. It implements a modular, performant **Entity Component System (ECS)** runtime that allows dynamic creation, tracking, and interaction of distributed systems in a highly composable and efficient manner.

ZenithCore’s ECS is tightly integrated with:
- ZK-trust scoring (`TrustOracle`)
- Quantum consensus vectors (`OptimizedPOBPC`)
- qDHT entity broadcasting
- Hydra component auto-refreshing

---

## 🎯 Responsibilities

- Create and destroy entities
- Attach and detach components to entities
- Trigger system-level updates across execution frames
- Provide observability hooks to external systems (Hydras, metrics, AIManager)

---

## 🏗️ Core Functions

### `createEntity()`
Creates a new entity ID and registers its entry in the internal state table.

### `addComponent(entityId, componentKey, componentData)`
Adds a structured component with indexed fields to an entity.

### `removeComponent(entityId, componentKey)`
Unbinds a component from an entity and updates change-tracking systems.

### `getComponent(entityId, componentKey)`
Reads current value of a component for reactive binding and rendering.

---

## 🔄 Integration Points

- **Hydras**: Components like `HydraTrustBar` use `useECSState()` to bind visual output to live ECS data.
- **AIManager**: Optimization signals are pulled directly from ECS entity telemetry.
- **qDHT**: Entities and component diffs can be broadcast to peers and relayed across mesh topologies.

---

## 🧪 Observability Hooks

- ECS emits lifecycle events that can be consumed by:
  - WebSocket transport (dev tools)
  - TrustOracle (for decay or fault detection)
  - NovaStream (for runtime analysis overlays)

---

## 📁 File Path

```
core/modules/ECS.ts
```

---

Shall I continue with `BaseSystem.ts` next?


# ZenithCore_ParallelOSTCompressor


# 🧪 ParallelOSTCompressor.ts – ZenithCore High-Performance OST Utility Manual

## 🔍 Overview

`ParallelOSTCompressor.ts` is a high-throughput encoder that compresses OST segments in parallel threads or worker pools to optimize bundle creation performance. It's especially useful for large WASM modules, Hydra trees, or layered dependency graphs.

---

## 🎯 Responsibilities

- Compress OST segments in parallel
- Maintain deterministic segment boundaries
- Reorder and merge results post-processing
- Support progressive hash computation for long bundles

---

## 🧠 Core Functions

### `compressSegmentsConcurrently(files: Buffer[]): Promise<OSTSegment[]>`
Splits files across workers and returns compressed segments with hashes.

### `mergeSegments(segments: OSTSegment[]): Buffer`
Concatenates compressed segments into a valid OST payload with footer map.

### `profileCompression(stream: Buffer[])`
Returns performance metrics like:
- compression ratio
- duration per segment
- segment entropy

---

## ⚙️ Features

- Uses `WorkerPool` or thread streams
- Skips recompression for identical segments
- Pre-filters no-op deltas if hashes match (OST-level deduplication)

---

## 🔗 Use Cases

- OST pack creation during CI or CLI
- Dev mode with large assets (WASM, UI graphs)
- HydraShards or multi-layer zk bundles

---

## 📁 File Path

```
src/codec/ParallelOSTCompressor.ts
```

---

Shall we move on to admin UI or quantum ZK next?


# ZenithCLI_create-hydra


# 🛠️ create-hydra.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`create-hydra.ts` is a CLI command that scaffolds a new Hydra component by generating its manifest and optionally signing it with an OST-compatible cryptographic identity. This utility bootstraps edge-executable UI modules within ZenithCore.

---

## 🎯 Responsibilities

- Accept input parameters: Hydra ID, entry file path
- Create a directory structure under `manifests/hydras/{id}`
- Generate a properly structured manifest.json
- Optionally sign the manifest using OST signature logic

---

## 🧠 Core Workflow

```bash
zenith create-hydra --id HydraTrustBar --entry src/components/HydraTrustBar.tsx
```

- Creates directory: `manifests/hydras/HydraTrustBar/`
- Writes a JSON manifest with:
  - `id`: "HydraTrustBar"
  - `entry`: path to source file
  - `execType`: "edge"
  - `zkRequirement`: true
- Uses OST utilities to cryptographically sign the manifest

---

## 🧩 Manifest Output Example

```json
{
  "id": "HydraTrustBar",
  "entry": "HydraTrustBar.tsx",
  "execType": "edge",
  "zkRequirement": true,
  "version": "1.0.0",
  "dependencies": ["react", "@zenithkernel/hydra-core"]
}
```

---

## 🧪 Use Cases

- Create new Hydra modules with signed integrity
- Prepare components for edge deployment via WASM/OST
- Enable ZK-authenticated hydration via manifest enforcement

---

## 📁 File Path

```
cli/commands/create-hydra.ts
```

---

Would you like me to continue with `sign-manifest.ts` next?


# ZenithCore_ExposeRest


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


# ZenithCore_launchLoop


# 🔁 launchLoop.ts – ZenithCore Kernel Loop Manual

## 🔍 Overview

`launchLoop.ts` contains the execution cycle logic for the ZenithCore microkernel. It defines the runtime loop that triggers system updates, handles real-time signals, and maintains deterministic state evolution.

This is the heartbeat of the ECS + Scheduler execution environment.

---

## 🎯 Responsibilities

- Hook into a browser or runtime interval/tick
- Dispatch system updates via the Scheduler
- Track delta time per frame
- Optionally expose profiling and tick analytics

---

## 🧠 Example Usage

```ts
launchLoop(kernel, { interval: 16 }); // ~60fps
```

- Starts an infinite frame/tick loop
- Emits lifecycle hooks (onFrameStart, onFrameEnd)
- Drives ECS updates forward in real-time

---

## 🔧 Tick Engine

- Uses `requestAnimationFrame` or `setInterval` depending on environment
- Normalizes `deltaTime` for each frame
- Pushes `deltaTime` to `Scheduler.run(deltaTime)`

---

## 🔗 Integration Targets

- `bootstrapKernel()` calls `launchLoop(...)`
- `Scheduler` executes ECS BaseSystem logic
- `TrustOracle`, `HydraRegistry`, `MessageSystem` run on their lanes

---

## 📁 File Path

```
src/bootstrap/launchLoop.ts
```

---

Shall I continue with `LoadAllSystems.ts` next?


# ZenithCore_OSTpack


# 📦 OSTpack.ts – ZenithCore OST Packaging Utility Manual

## 🔍 Overview

`OSTpack.ts` defines the logic for constructing and managing OST bundles for trusted component delivery in ZenithCore. It assembles and serializes manifest data, dependencies, WASM or Hydra assets into signed OST streams ready for transport or cache.

---

## 🎯 Responsibilities

- Package Hydra or WASM modules into OST bundles
- Define segment ordering and headers
- Apply optional compression or deduplication
- Return binary buffers or deployable artifacts

---

## 🧠 Key Methods

### `createOSTPack(manifest, files): Buffer`
Builds an OST-compatible binary buffer containing:
- Manifest JSON
- Entry module (JSX/WASM)
- Optional metadata or signature segment

### `readOSTPack(buffer): { manifest, files }`
Decodes and extracts original input from the OST binary, used for validation or hydration.

---

## 🧩 OSTpack Segment Order

1. Header (version, offsets)
2. Manifest (JSON blob)
3. Entry code (minified or WASM)
4. Signature block (optional)
5. Segment map (hash and meta)

---

## 🔗 Used In

- `ManifestAuth.ts` (for attaching signature)
- `WasmLoader.ts`, `HydraLoader.tsx` (hydration)
- OST devtools for traceable manifests

---

## 📁 File Path

```
src/codec/OSTpack.ts
```

---

Shall I continue with `OSTPackReader.ts` next?


# ZenithCore_ECSManager_Module


# 🧠 ECSManager.ts – ZenithCore Runtime Module Manual

## 🔍 Overview

`ECSManager.ts` is the orchestrator and access gateway for all ECS data within ZenithCore. It provides runtime APIs for managing entities, components, and their relationships in memory, enabling deterministic, reactive, and high-performance system logic.

---

## 🎯 Responsibilities

- Manage global state of all ECS entities and components
- Offer APIs for adding, updating, querying, and deleting components
- Act as the data layer beneath systems, Hydras, and consensus processes
- Maintain change tracking and observability channels

---

## 🧠 Core Methods

### `createEntity(): EntityId`
Allocates a new entity ID and registers it into the global state.

### `addComponent(entityId, key, data)`
Attaches a structured component to a given entity with immutable type safety.

### `getComponent(entityId, key)`
Retrieves a component for rendering or mutation.

### `removeComponent(entityId, key)`
Removes a component from the given entity.

### `hasComponent(entityId, key): boolean`
Checks presence of a specific component on an entity.

---

## 🔧 Advanced Features

- Reactive ECS bindings (`useECSState`, `useHydraEvents`)
- Change event broadcasting for sync engines (e.g., WebSocket, qDHT)
- Scoped component sets for filtering (e.g., all `TrustScores`)

---

## 🔗 Integrations

- Systems (via `BaseSystem`) call into `ECSManager` for state access
- Hydras use it through `useECSState` for live rendering
- TrustOracle, Consensus layers, MessagingSystem all rely on it

---

## 📐 Example

```ts
const peerId = ecs.createEntity();
ecs.addComponent(peerId, "TrustScore", { value: 78 });
const trust = ecs.getComponent(peerId, "TrustScore");
```

---

## 📁 File Path

```
core/ecs/ECSManager.ts
```

---

Shall I continue with `MessagingSystem.ts` next?


# ZenithCore_Kernel_Module


# 🧠 ZenithKernel.ts – Core Runtime Entrypoint Manual

## 🔍 Overview

`ZenithKernel.ts` is the primary bootstrapping and lifecycle management engine of the ZenithCore framework. It initializes all runtime subsystems including the ECS, Scheduler, SystemManager, Messaging, and WASM loaders.

This file acts as the canonical root of the kernel and governs runtime composition, context propagation, hot-reloading, and quantum-safe system binding.

---

## 🎯 Responsibilities

- Boot and configure ECS state
- Register all system modules
- Initialize Hydra components, ZK stack, networking layer
- Hook kernel update loop (tick/frame/interval mode)
- Provide introspection and diagnostic surface

---

## 🧠 Key Methods

### `bootstrapKernel()`
Main initializer. Loads config, sets up systems, hydrates WASM if enabled.

### `startKernelLoop()`
Hooks into browser or service tick loop. Dispatches to `scheduler.run()` every frame.

### `resetKernel()`
Tears down systems, clears state, resets ECS.

---

## 🧩 Boot Process

```ts
await bootstrapKernel();
startKernelLoop();
```

1. Loads ECS + Scheduler
2. Registers core systems (TrustOracle, MessagingSystem, etc.)
3. Binds Hydras to DOM/render pipelines
4. Optionally validates WASM module manifests
5. Begins tick loop with deterministic delta

---

## 🔗 Kernel Integration

- Scheduler: tick loop dispatcher
- ECSManager: global data store
- SystemManager: runtime system registry
- WASMProxy: execution enclave for edge modules

---

## 📐 Design Philosophy

- Modular microkernel design
- Hot-swappable systems
- ZKP-first security model
- Declarative ECS lifecycle

---

## 📁 File Path

```
core/ZenithKernel.ts
```

---

ZenithKernel is the orchestrator. Everything flows through it.


# ZenithCLI_publish-module


# 📡 publish-module.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`publish-module.ts` enables the decentralized publication of signed Hydra or WASM modules into the ZenithCore network via OST and optionally qDHT. This tool is a cornerstone for propagating trusted UI and logic components across peers.

---

## 🎯 Responsibilities

- Load a signed manifest (e.g., `manifest.json`)
- Optionally verify its structure and digital signature
- Publish it to a distributed registry via OST/qDHT
- Generate a confirmation receipt or anchor metadata

---

## 🧠 Command Example

```bash
zenith publish-module --path ./manifests/hydras/HydraTrustBar/manifest.json
```

This command:
- Parses the manifest
- Validates the OST signature
- Pushes it into the publish queue (e.g., OST store, qDHT peer ring)
- Returns publish status and sync receipt

---

## 🔗 Features

- Interoperable with `create-hydra` and `sign-manifest`
- Compatible with CLI profiles or signing identities
- Logs network propagation state for Hydra visibility

---

## 🌍 Registry Targeting

Supports publication to:
- OST Layered storage
- PeerMesh DHT overlay
- WebSocket-pinned registries (for dev/test)

---

## 📁 File Path

```
cli/commands/publish-module.ts
```

---

Shall I continue with `generateProof.ts` next?


# ZenithCore_SystemComponent


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


# ZenithCore_ManifestGenerator


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


# ZenithCore_Messenger_Module


# 📨 Messenger.ts – ZenithCore Comms Utility Manual

## 🔍 Overview

`Messenger.ts` provides the communication interface for all messaging interactions in the ZenithCore runtime. It acts as an abstraction over the transport layer, supporting both local (in-kernel) and distributed (networked) message flows.

This utility is used by `MessagingSystem`, hydras, and other runtime services that require entity-to-entity or peer-to-peer communication with optional zk integrity.

---

## 🎯 Responsibilities

- Normalize message format and transport
- Offer interfaces for enqueueing, sending, and receiving messages
- Support local kernel bus and remote transport integration
- Provide optional ZKP-wrapped delivery

---

## 🧠 Core Methods

### `send(to: EntityId, payload: any, opts?: MessageOptions)`
Sends a message to a target entity using the best-available route (loopback, WebSocket, qDHT).

### `broadcast(payload: any)`
Sends a message to all active peers or entity subscribers.

### `receive(handler: (msg) => void)`
Registers a callback handler for incoming messages.

---

## 🔒 Security Layer

- Optionally signs or encrypts payloads using ZK-friendly formats
- Supports verifiable sender identity with zkProof envelopes
- Integrates with TrustOracle for spam/fraud filtering based on trust score

---

## 🔗 Use Cases

- Hydras that subscribe to remote state
- MessagingSystem delivery layer
- Developer tools emitting introspection data
- zk-authenticated user interactions

---

## 📁 File Path

```
core/messaging/Messenger.ts
```

---

Shall I finish with `WasmModuleProxy.ts` next?


# ZenithCore_HttpBridge


# 🌉 HttpBridge.ts – ZenithCore Adapter Layer Manual

## 🔍 Overview

`HttpBridge.ts` provides a bridge between HTTP REST interfaces and internal ECS or system operations in ZenithCore. It enables external systems, clients, and developer tools to interact with the kernel using standard HTTP verbs.

---

## 🎯 Responsibilities

- Map HTTP routes to system methods or ECS mutations
- Serialize input and output between JSON and ECS
- Optionally support REST, RPC, or GraphQL extensions
- Authenticate requests via zkProof or OST-based tokens

---

## 🧠 Key Bindings

### `POST /ecs/:entity/components/:key`
- Adds or updates a component on an entity

### `GET /ecs/:entity/components/:key`
- Fetches current state of a component

### `POST /hydra/register`
- Registers a Hydra manifest or status with the kernel

### `POST /verify`
- Submits a zkProof to be validated by the system

---

## 🔐 Auth Modes

- OST tokens
- zkProof headers (`x-zkp-claim`)
- Basic developer mode (`?devMode=true`)

---

## 🔗 Integration Points

- Admin UI panels
- CLI tools using fetch/RPC
- `KernelRouter.ts` to define and route the handlers
- `VerifySystem.ts` and `SystemManager.ts`

---

## 📁 File Path

```
src/adapters/HttpBridge.ts
```

---

Shall I proceed with `KernelRouter.ts` next?


# ZenithCore_DynamicManifestResolver_Module


# 📦 DynamicManifestResolver.ts – ZenithCore Utility Module Manual

## 🔍 Overview

`DynamicManifestResolver.ts` provides the runtime logic for loading, validating, and resolving OST-based Hydra manifests within ZenithCore. It allows the system to dynamically instantiate component definitions at runtime, supporting distributed, upgradeable, and ZK-verified UI logic.

It is critical for systems that use edge execution or live module hot-swapping.

---

## 🎯 Responsibilities

- Load manifest files based on Hydra ID or path
- Verify manifest signatures (OST)
- Determine execution type (`local`, `edge`, `remote`)
- Resolve entry points to component modules

---

## 🧠 Key Methods

### `resolveManifest(hydraId: string): Manifest`
Fetches and parses the manifest for a given Hydra ID. Validates format and returns the data structure.

### `verifySignature(manifestPath: string): boolean`
Ensures the manifest was signed with an authorized OST key.

### `getExecutionMode(manifest: Manifest): 'local' | 'edge' | 'remote'`
Returns the execution type which controls how and where the Hydra will be hydrated.

### `resolveEntry(manifest: Manifest): ComponentReference`
Locates and returns the code module referenced by the manifest (e.g., `HydraTrustBar.tsx`, WASM blob, etc.)

---

## 🧩 Manifest Example

```json
{
  "id": "HydraTrustBar",
  "entry": "HydraTrustBar.tsx",
  "execType": "edge",
  "zkRequirement": true,
  "dependencies": ["react", "@zenithkernel/hydra-core"]
}
```

---

## 🔗 Integration Points

- `hydrateRemoteHydra()` uses this to resolve runtime bundles.
- `createHydra()` from CLI writes compatible manifests.
- SystemManager could use this to dynamically instantiate new systems.

---

## 📁 File Path

```
core/runtime/DynamicManifestResolver.ts
```

---

Shall I proceed with `ECSManager.ts` next?


# ZenithCore_LoadAllSystems


# 🧩 LoadAllSystems.ts – ZenithCore Bootstrap Module Manual

## 🔍 Overview

`LoadAllSystems.ts` contains the registry logic for all core and optional systems used within the ZenithCore runtime. It ensures that all subsystems (e.g., trust, messaging, proof, rendering) are registered to the ECS world with correct priority lanes.

This module acts as the orchestration point between modular system classes and the `SystemManager`.

---

## 🎯 Responsibilities

- Import and instantiate system classes
- Register systems using `SystemManager.register(...)`
- Assign execution lanes via `Scheduler.setLane(...)`
- Ensure deterministic order of bootstrapping

---

## 🧠 System Inclusion Example

```ts
systemManager.register(new TrustOracleSystem());
scheduler.setLane(TrustOracleSystem, 'realTime');
```

- Can include both native and WASM-wrapped systems
- Supports dynamic loading for dev tools or plugin layers

---

## 🧩 Systems Commonly Registered

- TrustOracleSystem
- MessagingSystem
- QuantumWitnessSystem
- ZKValidatorSystem
- AdminPolicySystem
- ECSObservableSystem
- DebugSystem (in dev mode)

---

## 🔗 Integration Targets

- Called from `bootstrapKernel.ts`
- May reflect conditional flags from config
- Influences kernel diagnostics and system composition

---

## 📁 File Path

```
src/bootstrap/LoadAllSystems.ts
```

---

Shall I begin documenting the runtime utility `generateSystemManifest.ts` next?


# ZenithCLI_init


# 🚀 init.ts – ZenithCore CLI Tool Manual

## 🔍 Overview

`init.ts` bootstraps a new ZenithCore project environment. It sets up the directory structure, configuration files, and optionally initializes a template app or module framework for developers starting a new system.

---

## 🎯 Responsibilities

- Scaffold the core folder structure for a ZenithCore-compatible project
- Initialize config files like `.zenith/config.json`
- Offer to generate example systems, hydras, or test WASM modules
- Register local trust keys or developer identity

---

## 🧠 Command Example

```bash
zenith init --template hydra-dashboard
```

Creates:
```
my-app/
├── .zenith/
│   └── config.json
├── src/
│   └── bootstrap/
│   └── components/
├── manifests/
│   └── hydras/
└── README.md
```

---

## 🧰 Supported Flags

| Flag             | Description                             |
|------------------|-----------------------------------------|
| `--template`     | Scaffold a pre-built app or example     |
| `--key`          | Link developer key or wallet            |
| `--force`        | Overwrite existing files                |

---

## 🔗 Use Cases

- Quickstart a new dApp, Hydra UI, or consensus system
- Configure CI/CD for OST and zkProofs
- Developer onboarding flow

---

## 📁 File Path

```
cli/commands/init.ts
```

---

That's the final CLI in this batch. Would you like to start on the **next 10 files**, such as bootstrap utilities or Hydra runtime libs?


# ZenithCore_ValidateBody


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


# Zenith_QZKP_Consensus

# 🧠 Quantum ZKP Pipeline

This project demonstrates a modular, zero-knowledge-compatible quantum protocol pipeline in TypeScript — including consensus, distributed key generation, entanglement, and Groth16 zk-SNARK proof verification.

---

## 📦 Modules

- `QuantumState`: Core quantum register simulation
- `QuantumConsensus`: Byzantine agreement, leader election, keygen
- `QuantumZkp`: Entanglement and ZKP input formatting
- `pipeline.ts`: End-to-end pipeline runner
- `verify.ts`: Groth16 proof verification

---

## 🚀 Pipeline Overview

```ts
import { runQuantumPipeline } from './pipeline';

const input = new TextEncoder().encode("hello quantum");
const result = await runQuantumPipeline(input);

console.log(JSON.stringify(result, null, 2));
```

---

## ✅ Features

- 🧬 Superposition + entanglement for leader election
- 🔐 Keygen using Hadamard + Phase gates
- 🗳 Byzantine Agreement via voting rounds
- 🔒 zk-SNARK proof from entangled state
- 🔍 ZKP verification using Groth16

---

## 🛠 Example Result

```json
{
  "leader": { "measurements": [0,1,0], ... },
  "keygen": { "measurements": [0,0,1], ... },
  "consensus": { "measurements": [1,1,1], "success": true, ... },
  "consensusValid": true,
  "zk": {
    "proof": {...},
    "signals": [...],
    "valid": true
  }
}
```

---

## 🧪 Testing

```bash
tsx test.ts
```

Or call `runQuantumPipeline(...)` programmatically with `Uint8Array` payloads.

---

## 🧵 Next Steps

- Webhook/Socket result delivery
- Real-time dashboard
- SNARK proof bundling into DID/SIOP

---

🛡 Quantum-secure consensus has never been simpler.

# ZenithCore_ChallengeSystem


# 🛡 ChallengeSystem.ts – ZenithCore Registry Module Manual

## 🔍 Overview

`ChallengeSystem.ts` is part of the RegistryServer module suite in ZenithCore. It handles cryptographic challenges to prove identity, authorization, or capability in decentralized environments using zero-knowledge-friendly primitives.

This system enables ZK-authenticated Hydra activation, user access verification, and identity escrow resolution.

---

## 🎯 Responsibilities

- Generate or verify proof-of-access challenges
- Track active and expired challenge sessions
- Interface with qzkp verifier or registry zk circuits
- Serve as an authorization oracle for runtime components

---

## 🧠 Core Functions

### `issueChallenge(entityId: string): Challenge`
Creates a new challenge object for a given peer/entity, optionally embedding circuit context or nonce.

### `verifyChallenge(challengeId: string, proof: ZKProof): boolean`
Validates the proof response using the expected ZK circuit.

### `cleanupExpiredChallenges()`
Prunes expired or reused challenges to prevent replay.

---

## 🔐 Challenge Format

```ts
{
  id: "challenge123",
  entity: "peer0xabc",
  circuit: "zkAuthV1",
  expiresAt: 1682103495
}
```

---

## 🔗 Integration Points

- `HydraLoader` for proof-based activation
- `login-zk.ts` for user auth
- `RegistryServer` for peer identity validation
- `TrustOracleSystem` to bind challenge score gating

---

## 📁 File Path

```
src/modules/RegistryServer/ChallengeSystem.ts
```

---

Shall I document `RegistryServer.ts` next?


# ZenithCore_KernelRouter


# 🧭 KernelRouter.ts – ZenithCore Routing Adapter Manual

## 🔍 Overview

`KernelRouter.ts` defines the routing logic for incoming HTTP requests in the ZenithCore kernel. It maps RESTful or RPC calls to internal system operations, ECS mutations, manifest registrations, or zk validation flows.

It acts as the dynamic request dispatcher for the `HttpBridge` layer.

---

## 🎯 Responsibilities

- Match incoming HTTP routes to kernel handler functions
- Normalize request and response data
- Authenticate and authorize incoming requests
- Register handler groups for ECS, Hydra, and ZK services

---

## 🧠 Routing Patterns

### ECS Endpoints

```ts
router.post('/ecs/:entity/components/:key', handleSetComponent);
router.get('/ecs/:entity/components/:key', handleGetComponent);
```

### Hydra Management

```ts
router.post('/hydra/register', handleHydraManifest);
router.get('/hydra/list', handleListHydras);
```

### ZK and Trust

```ts
router.post('/verify', handleProofVerification);
router.post('/challenge', handleZKChallenge);
```

---

## 🔒 Middleware Hooks

- `authenticateZK()` – Validates zkProofs via `VerifySystem`
- `authorizeByRole()` – Checks peer or token roles
- `logRouteCall()` – Metrics + dev diagnostics

---

## 🔗 Use Cases

- Enables HTTP-admin panels
- Facilitates CLI access via REST API
- Allows devs to plug in dynamic test tools

---

## 📁 File Path

```
src/adapters/KernelRouter.ts
```

---

Ready for the decorator modules when you are.


# ZenithCore_HydraOSTCodec


# 📦 HydraOSTCodec.ts – ZenithCore OST Compression Codec Manual

## 🔍 Overview

`HydraOSTCodec.ts` implements the custom encoding and decoding logic used to compress Hydra component bundles for decentralized distribution via the OST format. It applies stream-safe, WASM-ready compression techniques suitable for trusted runtime hydration.

---

## 🎯 Responsibilities

- Encode Hydra manifests and component payloads into OST-compatible bundles
- Decode and validate OST bundle input for hydration or verification
- Support fingerprinting, segment verification, and compression metrics

---

## 🧠 Key Methods

### `encodeHydraBundle(manifest, entryFile)`
Compresses manifest + entry file into an OST stream format with embedded hash metadata.

### `decodeHydraBundle(buffer)`
Reads and verifies the structure of a given buffer to extract manifest and component payload.

### `verifyHydraOST(buffer)`
Ensures bundle matches expected OST spec and optionally rehashes to verify integrity.

---

## 🔐 OST Format

Includes:
- Segment headers (manifest, entry, deps)
- Integrity hashes (SHA256 or ZK-hashed)
- Optional zk snapshot tag

---

## 🔗 Used In

- `WasmLoader.ts`
- `DistributedModuleLoader.ts`
- `ManifestAuth.ts` during zk and trust recovery

---

## 📁 File Path

```
src/codec/HydraOSTCodec.ts
```

---

Shall I proceed with `OSTCompression.ts` next?


# ZenithCore_EntityBackedSystem_Module


# 🧷 EntityBackedSystem.ts – ZenithCore System Module Manual

## 🔍 Overview

`EntityBackedSystem.ts` defines a specialized ECS system abstraction for modules that require one-to-one or one-to-many entity bindings. This is useful for runtime modules that track or manage per-entity behaviors, such as decentralized messaging, ZKP claim tracking, or vector consensus roles.

It extends the foundational `BaseSystem` class and adds entity-scoped logic.

---

## 🎯 Responsibilities

- Manage ECS-bound lifecycle tied to a specific entity or group of entities
- Streamline system logic into entity loop iteration
- Reduce boilerplate for common component read/write patterns

---

## 🧠 Core Methods

### `onAttach(entityId: string)`
Called when the system is linked to a new ECS entity. Typically used to initialize local state or listeners.

### `onDetach(entityId: string)`
Called when an entity is unlinked or deleted. Useful for cleanup or deregistration.

### `updateEntity(entityId: string, delta: number)`
Handles logic specific to each entity during update cycles.

### `update(world, delta)`
Iterates through all registered entities and calls `updateEntity`.

---

## 🔗 Use Case Examples

- `TrustOracleSystem`: score tracking per peer
- `QuantumWitnessSystem`: batch voting tied to entity state
- `MessageInboxSystem`: per-user encrypted inbox with consensus integrity

---

## 📐 Code Snippet

```ts
class MessageInboxSystem extends EntityBackedSystem {
  updateEntity(entityId, delta) {
    const inbox = this.world.getComponent(entityId, "Inbox");
    // process inbox messages
  }
}
```

---

## 📁 File Path

```
core/runtime/EntityBackedSystem.ts
```

---

Shall I continue with `DynamicManifestResolver.ts` next?


# ZenithCore_SystemManager_Module


# 🧮 SystemManager.ts – ZenithCore System Module Manual

## 🔍 Overview

`SystemManager.ts` is responsible for dynamically loading, instantiating, and coordinating all ECS-based systems in the ZenithCore runtime. It acts as the central orchestrator that maintains lifecycle, priority, and scheduling metadata for registered systems.

It plays a pivotal role in modular bootstrapping, system swapping, live diagnostics, and kernel hot-reloading.

---

## 🎯 Responsibilities

- Register/unregister ECS systems
- Delegate to the `Scheduler` for execution flow
- Track system lifecycle hooks
- Support dynamic and conditional loading (via WASM, OST, or manifest)

---

## 🧠 Core Interfaces

### `register(system: BaseSystem)`
- Initializes and wires a system into the ECS world context
- Automatically assigns it to the appropriate execution lane

### `unregister(system: BaseSystem)`
- Cleans up system bindings, removes from scheduler and world
- Invokes teardown if defined

### `getSystem(id: string): BaseSystem`
- Returns a system instance by its internal ID or type

---

## 🔧 Bootstrapping Flow

Used inside `ZenithKernel.ts` like:

```ts
systemManager.register(new TrustOracleSystem());
systemManager.register(new QuantumVectorSystem());
```

- Systems are often registered during the `bootstrapKernel` sequence
- Supports both core and plugin-based systems

---

## 🔍 Diagnostics & Extension

- Can be enhanced to support system hot-swapping
- Future support: WASM-backed systems with remote registration
- Potential to expose `/debug/systems` WebSocket view

---

## 📁 File Path

```
core/runtime/SystemManager.ts
```

---

Would you like me to proceed with `EntityBackedSystem.ts` next?


# ZenithCore_WasmModuleProxy_Module


# 🧬 WasmModuleProxy.ts – ZenithCore Runtime Module Manual

## 🔍 Overview

`WasmModuleProxy.ts` handles secure, isolated execution of WebAssembly modules within the ZenithCore microkernel environment. It acts as a runtime bridge between WASM bundles (typically Hydra components or systems) and the ECS/event loop.

It provides lifecycle management, state access, host bindings, and ZKP integration where applicable.

---

## 🎯 Responsibilities

- Instantiate and manage WASM modules safely
- Provide WASI-like interface for memory and I/O
- Bridge ECS data/state access to WASM-bound functions
- Enforce ZK attestation prior to module registration
- Enable hot-swapping and memory sandbox enforcement

---

## 🧠 Core Methods

### `loadWasmModule(manifest: Manifest)`
- Loads a WASM file referenced in the manifest
- Verifies OST signature and ZKP hash if required

### `invoke(fn: string, ...args)`
- Invokes a function exported by the WASM module with runtime context

### `bindHostInterface()`
- Maps ECS operations and trusted functions into the WASM runtime
- Allows WASM to call host functions (e.g., log, trustUpdate, broadcast)

---

## 🔒 Security

- ZKP hash check ensures tamper-proofed WASM
- Only OST-signed modules can be registered
- Memory access sandboxed per module
- Runtime invocation limited to predefined exports

---

## 🔗 Integration Targets

- Hydras rendered in WASM (via `execType: 'edge'`)
- Quantum computation modules
- Runtime simulation / dev harness
- Trusted execution of plug-and-play consensus or game logic

---

## 📁 File Path

```
core/runtime/WasmModuleProxy.ts
```

---
