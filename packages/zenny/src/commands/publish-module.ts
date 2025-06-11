import { readFileSync, existsSync } from "fs";
import { join } from "path";
import os from "os";

function findManifest(name: string): { manifestPath: string; dir: string } | null {
    const projectDir = join(process.cwd(), `src/modules/${name}`);
    const localDir = join(process.cwd(), name);

    const pathsToCheck = [
        { dir: projectDir, manifest: join(projectDir, "module.manifest.json") },
        { dir: localDir, manifest: join(localDir, "module.manifest.json") }
    ];

    for (const { dir, manifest } of pathsToCheck) {
        if (existsSync(manifest)) {
            return { manifestPath: manifest, dir };
        }
    }

    return null;
}

export async function publishModule(name?: string) {
    if (!name) {
        console.error("❌ Usage: zenith publish module <Name>");
        return;
    }

    const result = findManifest(name);
    if (!result) {
        console.error(`❌ No module.manifest.json found for "${name}" in src/modules or current dir.`);
        return;
    }

    const { manifestPath, dir } = result;
    const manifest = readFileSync(manifestPath, "utf8");

    const authPath = join(os.homedir(), ".zenith/config.json");
    if (!existsSync(authPath)) {
        console.error("🔐 Not logged in. Run: zenith login --token <TOKEN>");
        return;
    }

    const { token, registry } = JSON.parse(readFileSync(authPath, "utf8"));

    const res = await fetch(`${registry}/publish`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: manifest
    });

    if (res.ok) {
        console.log(`✅ Module "${name}" published from ${dir}`);
    } else {
        const msg = await res.text();
        console.error(`❌ Publish failed: ${res.status} ${msg}`);
    }
}
