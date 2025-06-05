
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
