// modules/ExampleModule.ts
import { ZenithKernel, IZenithModule, Message } from "../ZenithKernel";

export class ExampleModule implements IZenithModule {
    id = "example";

    onLoad(kernel: ZenithKernel): void {
        kernel.schedule(this.id, this.run.bind(this));
    }

    *run() {
        while (true) {
            // Your update logic
            yield;
        }
    }

    onUnload(): void {
        // Cleanup
    }
}
