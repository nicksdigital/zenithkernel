#!/usr/bin/env bun
import * as p from "@clack/prompts";
import { bold, cyan } from "kleur/colors";

console.clear();
p.intro(bold(cyan("🧠 Zenith CLI")));

const command = await p.select({
    message: "What do you want to do?",
    options: [
        { value: "init", label: "🪄 Scaffold new project" },
        { value: "module", label: "📦 Scaffold new module" },
        { value: "bundle", label: "📦 Pack a Hydra bundle" },
        { value: "login", label: "🔐 Login" },
        { value: "exit", label: "❌ Exit" },
    ],
});

if (p.isCancel(command) || command === "exit") {
    p.cancel("Goodbye.");
    process.exit(0);
}

switch (command) {
    case "init":
        await import("./commands/init").then(m => m.runInit());
        break;
    case "module":
        await import("./commands/create-module").then(m => m.runCreateModule());
        break;
    case "bundle":
        await import("./commands/bundle/pack").then(m => m.bundlePack());
        break;
    case "login":
        await import("./commands/login").then(m => m.login({}, []));
        break;
}
