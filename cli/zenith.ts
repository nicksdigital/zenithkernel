#!/usr/bin/env bun

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// @ts-ignore
const args = Bun.argv.slice(2);
const [command, type, name] = args;

if (command !== "create" || type !== "module" || !name) {
    console.error("❌ Usage: zenith create module <Name>");
    process.exit(1);
}

const base = `src/modules/${name}`;
if (existsSync(base)) {
    console.error(`❌ Module "${name}" already exists.`);
    process.exit(1);
}

mkdirSync(base, { recursive: true });

const componentName = name.charAt(0).toUpperCase() + name.slice(1);
const systemName = `${componentName}System`;

// Health.ts
writeFileSync(join(base, `${componentName}.ts`), `export class ${componentName} {\n  constructor(public value = 100) {}\n}\n`);

// ${componentName}System.ts
writeFileSync(
    join(base, `${systemName}.ts`),
    `import { BaseSystem } from "@core/BaseSystem";\n` +
    `import { RegisterSystem } from "@decorators/RegisterSystem";\n` +
    `import { ${componentName} } from "./${componentName}";\n\n` +
    `@RegisterSystem()\n` +
    `export class ${systemName} extends BaseSystem {\n` +
    `  update() {\n` +
    `    for (const [entity, comp] of this.query(${componentName})) {\n` +
    `      // TODO: logic\n` +
    `    }\n` +
    `  }\n` +
    `}\n`
);

// index.ts
writeFileSync(join(base, "index.ts"), `export * from "./${componentName}";\nexport * from "./${systemName}";\n`);

console.log(`✅ Module "${name}" scaffolded in ${base}`);
