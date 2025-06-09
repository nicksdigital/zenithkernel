import { getRegisteredSystems } from "../decorators/RegisterSystem";
import { ZenithKernel } from "../core/ZenithKernel";
import { globby } from "globby";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const modulesPath = path.resolve(rootDir, "../modules");

export async function loadAllSystems(kernel?: ZenithKernel): Promise<void> {
    const files = await globby(["**/*.ts"], {
        cwd: modulesPath,
        absolute: true,
    });
    console.log(files)

    for (const file of files) {
        /* @vite-ignore */
        await import( /* @vite-ignore */ pathToFileURL(file).href);
        console.log(`🧠 Imported: ${file}`);
    }

    const systemTypes = getRegisteredSystems();
    const seen = new Set<string>();

    if (kernel) {
        for (const entry of systemTypes) {
            const { id, cls } = entry;
            if (seen.has(id)) {
                console.warn(`⚠️ Skipping duplicate system: ${id}`);
                continue;
            }

            seen.add(id);
            const instance = new cls(kernel.getECS());
            kernel.registerSystem(instance);
        }
    }

    console.log(`✅ Loaded ${seen.size} unique system(s)`);
}
