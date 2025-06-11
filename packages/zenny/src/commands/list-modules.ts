import { readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

function findModules(base: string): string[] {
    const results: string[] = [];
    const entries = readdirSync(base);

    for (const entry of entries) {
        const full = join(base, entry);
        if (statSync(full).isDirectory() && existsSync(join(full, "zkp.ts"))) {
            results.push(entry);
        }
    }

    return results;
}

export async function listModules() {
    const base = join(process.cwd(), "src/modules");
    if (!existsSync(base)) {
        console.log("⚠️  No modules directory found.");
        return;
    }

    const modules = findModules(base);
    if (modules.length === 0) {
        console.log("📭 No modules registered.");
        return;
    }

    console.log("📦 Local Zenith modules:");
    for (const mod of modules) {
        console.log(` - ${mod}`);
    }
}
