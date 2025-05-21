import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { computeBLAKE3Keyed } from "../src/utils/Blake3Hash";
import { BLAKE3_CONTEXTS, MASTER_KEY } from "../src/utils/constants";

const ENTRY_FILE = "dist/module.wasm"; // Adjust as needed
const MANIFEST_OUTPUT = "manifests/module.manifest.json";
const MODULE_ID = "example-module";
const VERSION = "1.0.0";

function generateManifest() {
    const wasmPath = resolve(ENTRY_FILE);
    const wasmData = new Uint8Array(readFileSync(wasmPath));

    const blake3Hash = computeBLAKE3Keyed(
        wasmData,
        MASTER_KEY,
        BLAKE3_CONTEXTS.MODULE_VERIFICATION
    );

    const manifest = {
        id: MODULE_ID,
        version: VERSION,
        entry: ENTRY_FILE,
        blake3: blake3Hash,
        context: BLAKE3_CONTEXTS.MODULE_VERIFICATION,
        permissions: ["read", "write", "scheduler"],
        dependencies: []
    };

    writeFileSync(MANIFEST_OUTPUT, JSON.stringify(manifest, null, 2));
    console.log(`✅ Manifest generated at ${MANIFEST_OUTPUT}`);
}

generateManifest();
