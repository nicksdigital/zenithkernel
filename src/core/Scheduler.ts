export class Scheduler {
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
