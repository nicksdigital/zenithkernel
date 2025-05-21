import { ZenithKernel } from "./ZenithKernel";

export interface WasmModuleWithLifecycle {
    onLoad?: (kernel: ZenithKernel) => void;
    onUnload?: () => void;
}

export class WasmModuleProxy<T extends Record<string, (...args: any[]) => any>> {
    private exports: WebAssembly.Exports;

    constructor(exports: WebAssembly.Exports) {
        this.exports = exports;
    }

    /**
     * Call a strongly typed exported function.
     */
    call<K extends keyof T>(name: K, ...args: Parameters<T[K]>): ReturnType<T[K]> {
        const fn = this.getFunction(name);
        return fn(...args);
    }

    /**
     * Returns a typed function from exports.
     */
    getFunction<K extends keyof T>(name: K): T[K] {
        const fn = this.exports[name as string];
        if (typeof fn !== "function") {
            throw new Error(`Export "${String(name)}" is not a function`);
        }
        return fn as T[K];
    }

    /**
     * Access an exported WebAssembly.Memory by name
     */
    getMemory(name = "memory"): WebAssembly.Memory {
        const mem = this.exports[name];
        if (!(mem instanceof WebAssembly.Memory)) {
            throw new Error(`Export "${name}" is not a WebAssembly.Memory`);
        }
        return mem;
    }

    /**
     * Access an exported WebAssembly.Global by name
     */
    getGlobal(name: string): WebAssembly.Global {
        const global = this.exports[name];
        if (!(global instanceof WebAssembly.Global)) {
            throw new Error(`Export "${name}" is not a WebAssembly.Global`);
        }
        return global;
    }

    /**
     * Run lifecycle `onLoad(kernel)` if defined
     */
    invokeOnLoad(kernel: ZenithKernel) {
        const fn = this.exports["onLoad"];
        if (typeof fn === "function") {
            fn(kernel);
        }
    }

    /**
     * Run lifecycle `onUnload()` if defined
     */
    invokeOnUnload() {
        const fn = this.exports["onUnload"];
        if (typeof fn === "function") {
            fn();
        }
    }
}
