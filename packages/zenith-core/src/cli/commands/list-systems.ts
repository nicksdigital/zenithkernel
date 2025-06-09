import { bootstrapKernel } from "@bootstrap/bootstrapKernel";

export async function listSystems() {
    const kernel = await bootstrapKernel();
    const systems = kernel.getRegisteredSystems();

    console.log("🧠 Registered Systems:");
    for (const id of systems) {
        console.log(" -", id);
    }
}
