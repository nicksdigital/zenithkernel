// utils/WasmLoader.ts

export class WasmLoader {
    private static cache = new Map<string, WebAssembly.Exports>();

    static async load(path: string, importObject: WebAssembly.Imports = {}): Promise<WebAssembly.Exports> {
        if (this.cache.has(path)) return this.cache.get(path)!;

        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch WASM module at ${path}`);

        const buffer = await response.arrayBuffer();
        const wasm = await WebAssembly.instantiate(buffer, importObject);
        const exports = wasm.instance.exports;

        this.cache.set(path, exports);
        return exports;
    }
}
