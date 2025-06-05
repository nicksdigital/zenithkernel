import * as p from "@clack/prompts";
import { bold, cyan } from "kleur/colors";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function runCreateModule() {
    p.intro(bold(cyan("📦 Create New Zenith Module")));

    const moduleName = await p.text({
        message: "Enter the name of your module:",
        placeholder: "example-module"
    });

    if (p.isCancel(moduleName)) return p.cancel("Module creation cancelled.");

    const ecsBased = await p.confirm({
        message: "Is this an ECS-based module?",
        initialValue: true
    });
    if (p.isCancel(ecsBased)) return p.cancel("Module creation cancelled.");

    const withSystem = await p.confirm({
        message: "Generate default system scaffold?",
        initialValue: true
    });
    if (p.isCancel(withSystem)) return p.cancel("Module creation cancelled.");

    const modulePath = path.join(process.cwd(), "src/modules", moduleName);
    await mkdir(modulePath, { recursive: true });

    const indexPath = path.join(modulePath, "index.ts");
    const indexContent = `// ${moduleName} module entry

export const id = '${moduleName}';

export function setup() {
  console.log('Initializing module: ${moduleName}');
}`;
    await writeFile(indexPath, indexContent);

    if (withSystem) {
        const systemPath = path.join(modulePath, `${moduleName}.system.ts`);
        const systemContent = `// Default system scaffold for ${moduleName}
import { BaseSystem } from '../../core/BaseSystem';

export class ${toPascalCase(moduleName)}System extends BaseSystem {
  update(): void {
    console.log('Running ${moduleName} system');
  }
}`;
        await writeFile(systemPath, systemContent);
    }

    p.outro(`Module "${moduleName}" created successfully.`);
}

function toPascalCase(name: string): string {
    return name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}
