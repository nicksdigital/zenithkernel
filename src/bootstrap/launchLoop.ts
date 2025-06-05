import { ZenithKernel } from "@core/ZenithKernel";

/**
 * Starts the kernel update loop.
 * @param kernel The ZenithKernel instance to drive.
 * @param options Optional tick config.
 */
export function launchLoop(kernel: ZenithKernel, options?: { intervalMs?: number }) {
    const interval = options?.intervalMs ?? 16; // ~60 FPS default

    console.log(`🚀 Launching kernel loop at ${interval}ms interval...`);

    function tick() {
        kernel.update();
        setTimeout(tick, interval);
    }

    tick();
}
