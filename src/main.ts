import { ZenithKernel } from "@core/ZenithKernel";
import { loadAllSystems } from "@bootstrap/loadAllSystems";

const kernel = new ZenithKernel();

async function main() {
    console.log("🧠 Loading all systems...");
    await loadAllSystems();

    console.log("🔧 Initializing kernel...");
    kernel.init();

    // Simulate a game loop or tick engine
    function tickLoop() {
        kernel.update();
        requestAnimationFrame(tickLoop);
    }

    tickLoop();
}

main().catch(err => {
    console.error("💥 Kernel bootstrap error:", err);
});
