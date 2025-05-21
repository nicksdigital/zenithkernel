import { IZenithModule } from "../types";
import { Message } from "../types";
import { Messenger } from "./Messenger";
import { Scheduler } from "./Scheduler";
import { ECSManager } from "./ECSManager";
import {SystemManager} from "./SystemManager";

export class ZenithKernel {
    private modules = new Map<string, IZenithModule>();
    private messenger = new Messenger();
    private scheduler = new Scheduler();
    private ecs = new ECSManager();
    private systemManager = new SystemManager(this.ecs);

    init() {
        this.systemManager.init();
    }

    update() {
        this.scheduler.tick();
        this.systemManager.update();
    }
    registerModule(module: IZenithModule) {
        if (this.modules.has(module.id)) {
            throw new Error(`Module ${module.id} already registered`);
        }
        this.modules.set(module.id, module);
        this.messenger.register(module.id);
        // @ts-ignore
        module.onLoad(this);
    }

    unregisterModule(id: string) {
        const module = this.modules.get(id);
        if (!module) return;

        module.onUnload?.();
        this.modules.delete(id);
        this.messenger.unregister(id);
        this.scheduler.unschedule(id);
    }

    hotSwapModule(module: IZenithModule) {
        this.unregisterModule(module.id);
        this.registerModule(module);
    }

    send(targetId: string, message: Message) {
        this.messenger.send(targetId, message);
    }

    receive(id: string): Message[] {
        return this.messenger.receive(id);
    }

    schedule(id: string, generatorFactory: () => Generator) {
        this.scheduler.schedule(id, generatorFactory);
    }



    getModule<T extends IZenithModule>(id: string): T | undefined {
        return this.modules.get(id) as T;
    }

    getECS(): ECSManager {
        return this.ecs;
    }

    async loadWasmModule(path: string): Promise<WebAssembly.Exports> {
        const wasmBuffer = await fetch(path).then(res => res.arrayBuffer());
        const wasmModule = await WebAssembly.instantiate(wasmBuffer, {});
        return wasmModule.instance.exports;
    }
}
