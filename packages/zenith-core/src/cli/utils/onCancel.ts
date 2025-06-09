import * as p from "@clack/prompts";

export function onCancel() {
    p.cancel("❌ Setup cancelled.");
    process.exit(0);
} 