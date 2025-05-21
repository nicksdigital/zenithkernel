#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function exec(cmd) {
    try {
        console.log(`▶️  ${cmd}`);
        execSync(cmd, { stdio: "inherit" });
    } catch {
        console.error(`❌ Command failed: ${cmd}`);
        process.exit(1);
    }
}

function installBun() {
    if (existsSync(`${os.homedir()}/.bun`)) {
        console.log("✅ Bun already installed");
        return;
    }

    console.log("📦 Installing Bun...");
    const script = os.platform() === "win32"
        ? "powershell -Command \"irm bun.sh/install.ps1 | iex\""
        : "curl -fsSL https://bun.sh/install | bash";

    exec(script);
}

function setupFramework() {
    exec("bun install");
    exec("bun link");
}

function safeMkdir(path) {
    const full = join(__dirname, path);
    if (!existsSync(full)) {
        mkdirSync(full, { recursive: true });
        console.log(`📁 Created ${path}`);
    }
}

function write(path, content) {
    const full = join(__dirname, path);
    if (!existsSync(full)) {
        writeFileSync(full, content);
        console.log(`📄 Created ${path}`);
    } else {
        console.log(`⚠️  Skipped ${path} (already exists)`);
    }
}

function scaffoldStarterCode() {
    const kernelExists = existsSync(join(__dirname, "src/core/ZenithKernel.ts"));
    if (kernelExists) {
        console.log("⚠️  Kernel already initialized — skipping core scaffolding.");
        return;
    }

    const dirs = [
        "src/core",
        "src/types",
        "src/modules/Health",
        "src/bootstrap",
        "src/decorators"
    ];
    dirs.forEach(safeMkdir);

    write("src/modules/Health/Health.ts", `export class Health { constructor(public hp = 100) {} }`);
    write("src/modules/Health/HealthSystem.ts", `
import { BaseSystem } from "@core/BaseSystem";
import { RegisterSystem } from "@decorators/RegisterSystem";
import { Health } from "./Health";

@RegisterSystem()
export class HealthSystem extends BaseSystem {
  update() {
    for (const [entity, h] of this.query(Health)) {
      if (h.hp <= 0) this.ecs.destroyEntity(entity);
    }
  }
}`.trim());

    write("src/modules/Health/index.ts", `export * from "./Health";\nexport * from "./HealthSystem";`);
    write("src/main.ts", `
import { ZenithKernel } from "@core/ZenithKernel";
import { loadAllSystems } from "@bootstrap/loadAllSystems";

const kernel = new ZenithKernel();

async function main() {
  await loadAllSystems();
  kernel.init();
  function tick() {
    kernel.update();
    requestAnimationFrame(tick);
  }
  tick();
}

main().catch(console.error);
`.trim());
}



function done() {
    console.log("\n✅ ZenithKernel installed.");
    console.log("🧪 Run: bun run src/main.ts");
    console.log("📦 Or try: zenith create module MyModule\n");
}

function gitInit() {
    if (existsSync(join(__dirname, ".git"))) {
        console.log("✅ Git already initialized.");
        return;
    }

    write(".gitignore", `
node_modules
dist
.cache
.env
*.log
bun.lockb
`);

    try {
        execSync("git init && git add . && git commit -m 'Initial ZenithKernel setup'", {
            cwd: __dirname,
            stdio: "inherit"
        });
        console.log("✅ Git initialized.");
    } catch {
        console.warn("⚠️  Failed to initialize Git.");
    }
}


installBun();
setupFramework();
scaffoldStarterCode();
done();
gitInit();
