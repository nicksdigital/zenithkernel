
# 🔄 useHydraEvents.ts – Component Implementation Manual

## 🔍 Overview

`useHydraEvents.ts` is a React hook responsible for binding Hydra components to real-time updates from the ECS runtime and optionally from the qDHT overlay. It enables seamless, reactive UI updates when any part of the Hydra’s bound state changes.

---

## 🎯 Purpose

- Monitor ECS entity state relevant to a given Hydra ID and context.
- Re-bind subscriptions when `id` or `context` changes.
- Optionally, listen to propagated state deltas via qDHT or WebSocket.
- Act as the livewire between kernel state and visual Hydra rendering.

---

## ⚙️ Core Hook Signature

```ts
useHydraEvents(hydraId: string, context: Record<string, any>): void
```

- `hydraId`: Identifier for the hydra component.
- `context`: Contextual data, often includes `peerId` or `zkProof`.

---

## 🔧 Typical Implementation

```ts
import { useEffect } from 'react';
import { subscribeToECS } from '@/lib/ecs';
import { listenToDHT } from '@/lib/qDHT';

export const useHydraEvents = (id, context) => {
  useEffect(() => {
    const ecsUnsub = subscribeToECS(id, context);
    const dhtUnsub = listenToDHT(id, context);
    return () => {
      ecsUnsub?.();
      dhtUnsub?.();
    };
  }, [id, JSON.stringify(context)]);
};
```

- Subscribes to ECS and/or DHT streams.
- Cleanup on unmount or ID/context change.
- Handles reactivity via dependency array in `useEffect`.

---

## 🧠 Design Philosophy

- Centralize all reactive binding logic in a single composable.
- Keep Hydra components declarative and stateless.
- Support layered broadcast hierarchies (ECS → DHT → Fallback RPC).

---

## 🧪 Future Extensions

- Add support for fine-grained ECS component listeners.
- Integrate proof consistency checks and trigger `zkFailback`.
- Enable dynamic QoS-based rebinding (Edge → Kernel fallback).
- Extend to listen to mixed transport streams (e.g., WebSocket, qDHT, mQUIC).

---

## 📁 Save Location

```
src/hooks/useHydraEvents.ts
```

---

Shall I generate the same detailed doc for `useHydraRegistry.ts` next?
