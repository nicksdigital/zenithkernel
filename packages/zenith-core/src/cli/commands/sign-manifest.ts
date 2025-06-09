import { readFileSync, writeFileSync } from "fs";
import { signMessage } from "../utils/quantum-sign";

export async function signManifest(path: string) {
    if (!path.endsWith(".json")) {
        console.error("❌ Expected JSON manifest file");
        return;
    }

    const content = readFileSync(path, "utf8");
    const sig = await signMessage(content);

    const manifest = JSON.parse(content);
    manifest.signature = sig;

    writeFileSync(path, JSON.stringify(manifest, null, 2));
    console.log(`✅ Signed manifest: ${path}`);
}
