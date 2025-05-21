// Dynamically import all system files under modules/**
// This ensures that @RegisterSystem decorators are invoked

export async function loadAllSystems(): Promise<void> {
    const modules = import.meta.glob("../modules/**/*.ts", { eager: true });
    // Just importing is enough to trigger decorators
    for (const path in modules) {
        // Each module is already imported due to `eager: true`
        // This triggers side effects like decorators
        console.debug(`🧠 Loaded system module: ${path}`);
    }
}
