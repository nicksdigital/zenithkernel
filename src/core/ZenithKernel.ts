import { IZenithModule } from "../types";
import { Message } from "../types";
import { Messenger } from "./Messenger";
import { Scheduler } from "./Scheduler";
import { ECSManager } from "./ECSManager";
import {SystemManager} from "./SystemManager";
import {BaseSystem} from "./BaseSystem";
import {KernelRouter} from "../adapters/KernelRouter";
import type { IslandRegistration, HydrationStrategy } from "../modules/Rendering/types";
import type { HydraContext } from "../lib/hydra-runtime";

export class ZenithKernel {
  enableDiagnostics() {
    throw new Error('Method not implemented.');
  }
  enableHotReload() {
    throw new Error('Method not implemented.');
  }
  setLogLevel(logLevel: string) {
    throw new Error('Method not implemented.');
  }
  initialize() {
    throw new Error('Method not implemented.');
  }
  getSystem(arg0: string) {
    throw new Error('Method not implemented.');
  }
  startLoop() {
    throw new Error('Method not implemented.');
  }
  setOnlineStatus(arg0: boolean) {
    throw new Error('Method not implemented.');
  }
  stop() {
    throw new Error('Method not implemented.');
  }
    private modules = new Map<string, IZenithModule>();
    private messenger:Messenger = new Messenger();
    private scheduler: Scheduler | undefined;
    private ecs = new ECSManager();
    private systemManager = new SystemManager(this.ecs);
    private dynamicSystems = new Map<string, BaseSystem>();
    private router: KernelRouter | undefined;
    private islands = new Map<string, IslandRegistration>();
    private hydratedIslands = new WeakMap<HTMLElement, { name: string; cleanup?: () => void }>();
     public debug = process.env.NODE_ENV !== "production";


unregisterSystem(systemId: string) {
    const system:BaseSystem | undefined = this.dynamicSystems.get(systemId);
    if (!system) {
        console.warn(`⚠️ System "${systemId}" not found.`);
        return;
    }
    this.dynamicSystems.delete(systemId);
    this.ecs.removeSystem(system);
    this.registerSystem(system);
}

    hotSwapSystem(systemId: string, NewCtor: new (...args: any[]) => BaseSystem) {
        this.unregisterSystem(systemId);
        const instance = new NewCtor(this.getECS());
        this.registerSystem(instance);
    }

      /**
     * Register an island component for hydration/runtime.
     */
    registerIsland(registration: IslandRegistration): void {
        if (this.islands.has(registration.name)) {
            if (this.debug) {
                console.warn(`🔁 Hot-swapping island: ${registration.name}`);
                this.unregisterIsland(registration.name);
            } else {
                throw new Error(`Island "${registration.name}" already registered.`);
            }
        }
        this.islands.set(registration.name, registration);
        if (this.debug) {
            console.info(`[ZenithKernel] Registered island: ${registration.name}`);
        }
    }

      /**
     * Unregister an island component.
     */
    unregisterIsland(name: string) {
        if (this.islands.has(name)) {
            this.islands.delete(name);
            if (this.debug) {
                console.info(`[ZenithKernel] Unregistered island: ${name}`);
            }
        }
    }

    /**
     * Get a registered island by name.
     */
    getIsland(name: string): IslandRegistration | undefined {
        return this.islands.get(name);
    }

    /**
     * Hydrate an island by name and element with enhanced context support.
     */
    async hydrateIsland(name: string, element: HTMLElement, props: any = {}, context?: HydraContext): Promise<void> {
        const registration = this.getIsland(name);
        if (!registration || !registration.component.mount) {
            throw new Error(`Island "${name}" not registered or missing mount()`);
        }
        
        // Enhanced context with ECS integration
        const enhancedContext: HydraContext = {
            peerId: context?.peerId || `kernel-${Date.now()}`,
            trustLevel: context?.trustLevel || registration.trustLevel,
            ecsEntity: context?.ecsEntity,
            ...context
        };
        
        try {
            // Call the island's mount function
            const cleanup = await registration.component.mount(element, props, enhancedContext);
            
            // Store cleanup function for later
            if (typeof cleanup === 'function') {
                this.hydratedIslands.set(element, { name, cleanup });
            } else {
                this.hydratedIslands.set(element, { name });
            }
            
            // Mark element as hydrated
            element.setAttribute('data-hydra-state', 'hydrated');
            element.setAttribute('data-hydra-name', name);
            
            if (this.debug) {
                console.info(`[ZenithKernel] Hydrated island: ${name}`);
            }
        } catch (error) {
            element.setAttribute('data-hydra-state', 'error');
            if (this.debug) {
                console.error(`[ZenithKernel] Failed to hydrate island ${name}:`, error);
            }
            throw error;
        }
    }

    /**
     * Hydrate an island by element ID with auto-discovery.
     */
    async hydrateIslandById(elementId: string): Promise<void> {
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with ID ${elementId} not found`);
        }
        
        // Auto-discover island configuration from element attributes
        const islandName = element.getAttribute('data-zk-island') || 
                          element.getAttribute('data-hydra-entry');
        
        if (!islandName) {
            throw new Error(`No island name found on element ${elementId}`);
        }
        
        // Parse props and context from attributes
        const propsAttr = element.getAttribute('data-zk-props') || 
                         element.getAttribute('data-hydra-props');
        const contextAttr = element.getAttribute('data-zk-context') || 
                           element.getAttribute('data-hydra-context');
        
        let props = {};
        let context: HydraContext = { peerId: `auto-${elementId}` };
        
        try {
            if (propsAttr) props = JSON.parse(propsAttr);
            if (contextAttr) context = { ...context, ...JSON.parse(contextAttr) };
        } catch (error) {
            console.warn('Failed to parse island props/context:', error);
        }
        
        return this.hydrateIsland(islandName, element, props, context);
    }

    /**
     * Unmount a hydrated island.
     */
    async unmountIsland(element: HTMLElement): Promise<void> {
        const islandData = this.hydratedIslands.get(element);
        if (!islandData) {
            return; // Not a hydrated island
        }
        
        // Call cleanup function if available
        if (islandData.cleanup) {
            try {
                await islandData.cleanup();
            } catch (error) {
                console.warn(`Cleanup failed for island ${islandData.name}:`, error);
            }
        }
        
        // Call unmount if available
        const registration = this.getIsland(islandData.name);
        if (registration?.component.unmount) {
            try {
                await registration.component.unmount(element);
            } catch (error) {
                console.warn(`Unmount failed for island ${islandData.name}:`, error);
            }
        }
        
        // Clean up element and tracking
        element.removeAttribute('data-hydra-state');
        element.removeAttribute('data-hydra-name');
        this.hydratedIslands.delete(element);
        
        if (this.debug) {
            console.info(`[ZenithKernel] Unmounted island: ${islandData.name}`);
        }
    }

    /**
     * List all registered islands.
     */
    getRegisteredIslands(): string[] {
        return Array.from(this.islands.keys());
    }

    /**
     * Get all registered island registrations.
     */
    getAllIslandRegistrations(): IslandRegistration[] {
        return Array.from(this.islands.values());
    }

    /**
     * Get all currently hydrated islands.
     */
    getHydratedIslands(): { element: HTMLElement; name: string }[] {
        const hydrated: { element: HTMLElement; name: string }[] = [];
        
        // Find all elements with hydra state
        document.querySelectorAll('[data-hydra-state="hydrated"]').forEach(element => {
            const name = element.getAttribute('data-hydra-name');
            if (name) {
                hydrated.push({ element: element as HTMLElement, name });
            }
        });
        
        return hydrated;
    }

    /**
     * Auto-discover and hydrate all islands in the DOM.
     */
    async discoverAndHydrateIslands(): Promise<void> {
        const islandElements = document.querySelectorAll('[data-zk-island], [data-hydra-entry]');
        
        for (const element of islandElements) {
            try {
                const strategy = element.getAttribute('data-zk-strategy') || 
                               element.getAttribute('data-hydra-strategy') || 'immediate';
                
                if (strategy === 'immediate' && !element.hasAttribute('data-hydra-state')) {
                    await this.hydrateIslandById(element.id || `auto-${Date.now()}`);
                }
            } catch (error) {
                console.warn('Failed to auto-hydrate island:', error);
            }
        }
    }

    // --- SSR/CLIENT MODE ---

    isSSR(): boolean {
        return typeof window === "undefined";
    }

    isClient(): boolean {
        return typeof window !== "undefined";
    }

    registerSystem(system: BaseSystem) {
        const id = system.constructor.name;
        if (this.dynamicSystems.has(id)) {
            if (process.env.NODE_ENV !== "production") {
                console.warn(`🔁 Hot-swapping system: ${id}`);
                this.unregisterSystem(id);
            } else {
                throw new Error(`System "${id}" already registered.`);
            }
        }

        this.dynamicSystems.set(id, system);
        this.ecs.addSystem(system);

        // 🧠 Notify router if present
        if (this.router) {
            this.router.broadcastSystemLoad(id);
        }
    }


    getRegisteredSystems(): string[] {
        return Array.from(this.dynamicSystems.keys());
    }


    init() {
        this.systemManager.init();
        this.ecs = new ECSManager();

        this.ecs.setKernel(this); // 🔁 connect kernel back into ECS
        this.scheduler = Scheduler.getInstance(this.ecs);
       


    }



    update() {
        this.scheduler?.tick();
        this.systemManager.update();
    }
    registerModule(module: IZenithModule) {
        if (this.modules.has(module.id)) {
            throw new Error(`Module ${module.id} already registered`);
        }
        this.modules.set(module.id, module);
        this.messenger?.register(module.id);
        // @ts-ignore
        module.onLoad(this);
    }

    unregisterModule(id: string) {
        const module = this.modules.get(id);
        if (!module) return;

        module.onUnload?.();
        this.modules.delete(id);
        this.messenger?.unregister(id);
        this.scheduler?.unschedule(id);
    }

    hotSwapModule(module: IZenithModule) {
        this.unregisterModule(module.id);
        this.registerModule(module);
    }

    send(targetId: string, message: Message) {
        console.log("Sending", message);
        this.messenger?.send(targetId, message);
    }

    receive(id: string): Message[] | undefined {
        return this.messenger?.receive(id);
    }

    schedule(id: string, generatorFactory: () => Generator) {
        this.scheduler?.schedule(id, generatorFactory);
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

    setRouter(router: KernelRouter) {
        this.router = router;
    }
}
