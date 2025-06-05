
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
