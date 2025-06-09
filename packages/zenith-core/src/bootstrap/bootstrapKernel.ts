import { ZenithKernel } from "../core/ZenithKernel";
import { loadAllSystems } from "../bootstrap/LoadAllSystems";
import { KernelRouter } from "../adapters/KernelRouter";
import { routeMap } from "../decorators/HttpRoute";

/**
 * Bootstraps the kernel and mounts all systems and routes.
 */
export async function bootstrapKernel(options?: { http?: boolean }): Promise<ZenithKernel> {
    console.log("🧠 Loading all systems...");
    console.log("🔧 Initializing kernel...");
    const kernel = new ZenithKernel();
    await loadAllSystems(kernel); // now actually registers instances




    if (options?.http !== false) {
        const router = new KernelRouter();
        kernel.setRouter(router);

        const systems = kernel.getECS().getSystems();
        console.log(`🧩 Mounting ${systems.length} systems...`);

        for (const system of systems) {
            const ctor = system.constructor;
            if (routeMap.has(ctor)) {
                console.log(`🔗 Auto-routing: ${ctor.name}`);
                router.mountSystemRoutes(system);
            }
        }

        router.listen();
    }

    return kernel;
}
