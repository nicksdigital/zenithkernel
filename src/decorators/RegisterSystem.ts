import { BaseSystem } from "../core/BaseSystem";

type SystemClass = new (...args: any[]) => BaseSystem;

interface RegisteredSystem {
    cls: SystemClass;
    id: string;
    dependsOn: string[];
}

const systemRegistry = new Map<string, RegisteredSystem>();

export function RegisterSystem(config?: { id?: string; dependsOn?: string[] }) {
    return function <T extends SystemClass>(target: T) {
        const id = config?.id ?? target.name;
        const dependsOn = config?.dependsOn ?? [];
        systemRegistry.set(id, { cls: target, id, dependsOn });
    };
}

export function getRegisteredSystems(): RegisteredSystem[] {
    return Array.from(systemRegistry.values());
}
