interface SystemRegistryEntry {
    id: string;
    dependsOn: string[];
    cls: new (...args: any[]) => any;
}

const systemRegistry: SystemRegistryEntry[] = [];
const registered = new Set<any>();

export function RegisterSystem(id: string, dependsOn: string[] = []): ClassDecorator {
    return function (target) {
        if (registered.has(target)) return;
        registered.add(target);
        systemRegistry.push({ id, dependsOn, cls: target as any });
    };
}

export function getRegisteredSystems(): SystemRegistryEntry[] {
    return systemRegistry;
}
