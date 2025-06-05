
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
