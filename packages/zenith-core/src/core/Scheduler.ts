import { BaseSystem } from "./BaseSystem";
import { ZenithKernel } from "./ZenithKernel";

export class Scheduler extends BaseSystem {
    static readonly id = "Scheduler";
    private static instance: Scheduler | null = null;
    static getInstance(kernel: ZenithKernel): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new Scheduler(kernel);

        }
        return Scheduler.instance;
    }
    onLoad?(): void {
       
    }
    onUnload?(): void {
        
    }
    update(): void {
        this.tick();
    }
    private updateQueue: Map<string, () => Generator> = new Map();

    schedule(id: string, generatorFactory: () => Generator) {
        this.updateQueue.set(id, generatorFactory);
    }

    unschedule(id: string) {
        this.updateQueue.delete(id);
    }

    tick() {
        for (const [_, factory] of this.updateQueue) {
            const gen = factory();
            gen.next(); // advance one tick
        }
    }
}
