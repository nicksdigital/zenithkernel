import { ZenithKernel } from "@core/ZenithKernel";
import { computeBLAKE3Keyed } from "@utils/Blake3Hash";
import { BLAKE3_CONTEXTS, MASTER_KEY } from "@utils/constants";
import { DynamicManifestResolver } from "@core/DynamicManifestResolver";
import { WasmModuleProxy } from "@core/WasmModuleProxy";
// @ts-ignore
import {ModuleManifest} from "@types";


export class DistributedModuleLoader {
    constructor(private kernel: ZenithKernel) {}

    async load<T extends Record<string, any>>(manifest: ModuleManifest): Promise<WasmModuleProxy<T>> {
        const entryData = await fetch(manifest.entry).then(res => res.arrayBuffer());
        const wasmData = new Uint8Array(entryData);

        const actualHash = computeBLAKE3Keyed(wasmData, MASTER_KEY, manifest.context);
        if (actualHash !== manifest.blake3) {
            throw new Error(`BLAKE3 hash mismatch for module "${manifest.id}"`);
        }

        const { instance } = await WebAssembly.instantiate(wasmData, {});
        const proxy = new WasmModuleProxy<T>(instance.exports);

        // Run lifecycle hook if available
        proxy.invokeOnLoad(this.kernel);

        return proxy;
    }
}
