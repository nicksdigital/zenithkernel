import { BaseSystem } from "./BaseSystem";
import { getRegisteredSystems } from "../decorators/RegisterSystem";
import { ECSManager } from "./ECSManager";
import { ZenithKernel } from "./ZenithKernel";

export class SystemManager {
    private systems: Map<string, BaseSystem> = new Map();
    private loadOrder: string[] = [];
    private kernel: ZenithKernel;

    constructor(kernel: ZenithKernel) {
        this.kernel = kernel;
    }

    init() {
        const registry = getRegisteredSystems();

        // Topo sort
        const visited = new Set<string>();
        const stack = new Set<string>();

        const resolve = (id: string) => {
            if (stack.has(id)) throw new Error(`Cyclic dependency: ${id}`);
            if (visited.has(id)) return;
            stack.add(id);

            const entry = registry.find(r => r.id === id);
            if (!entry) throw new Error(`Unknown system id: ${id}`);

            for (const dep of entry.dependsOn) resolve(dep);
            visited.add(id);
            stack.delete(id);
            this.loadOrder.push(id);
        };

        for (const { id } of registry) resolve(id);

        // Instantiate in order
        for (const id of this.loadOrder) {
            const entry = registry.find(r => r.id === id)!;
            const instance = new entry.cls(this.kernel);
            instance.init?.();
            this.systems.set(id, instance);
        }
    }

    update() {
        for (const id of this.loadOrder) {
            console.log("Updating", id);
            this.systems.get(id)!.update();
        }
    }

    dispose() {
        for (const id of [...this.loadOrder].reverse()) {
            this.systems.get(id)?.dispose?.();
        }
    }
}
