// TODO: import { bootstrapKernel } from "@bootstrap/bootstrapKernel";

// Stub for bootstrapKernel
const bootstrapKernel = async () => ({
  getSystemManager: () => ({
    getAllSystems: () => []
  }),
  getRegisteredSystems: () => []
});

export async function listSystems() {
    const kernel = await bootstrapKernel();
    const systems = kernel.getRegisteredSystems();

    console.log("🧠 Registered Systems:");
    for (const id of systems) {
        console.log(" -", id);
    }
}
