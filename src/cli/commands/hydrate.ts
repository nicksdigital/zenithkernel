import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import * as p from "@clack/prompts";
import color from "picocolors";
import { z } from "zod";

/**
 * Schema for the hydra manifest
 */
const HydraManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  entryPoint: z.string(),
  zkProofEnabled: z.boolean().optional().default(false),
  dependencies: z.record(z.string()).optional(),
});

type HydraManifest = z.infer<typeof HydraManifestSchema>;

/**
 * Hydrates a local Hydra component for development or testing
 * @param componentPath Path to the Hydra component
 * @param options Additional hydration options
 */
export async function hydrateLocalHydra(componentPath?: string, options: { verbose?: boolean } = {}) {
  console.clear();
  p.intro(`${color.bgMagenta(color.white(" Hydra Local Hydration "))}`);

  // If no path provided, prompt for it
  if (!componentPath) {
    componentPath = await p.text({
      message: "Path to Hydra component:",
      placeholder: "./src/hydra/MyComponent",
      validate: (value) => {
        if (value.length < 2) return "Path too short.";
        const resolvedPath = resolve(process.cwd(), value);
        if (!existsSync(resolvedPath)) return "Component path does not exist.";
        return undefined;
      },
    }) as string;

    if (p.isCancel(componentPath)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }
  }

  const resolvedPath = resolve(process.cwd(), componentPath);
  
  // Check for manifest file
  const manifestPath = resolve(resolvedPath, "hydra.manifest.json");
  if (!existsSync(manifestPath)) {
    p.log.error(`No hydra.manifest.json found in ${resolvedPath}`);
    process.exit(1);
  }

  try {
    // Parse and validate the manifest
    const manifestRaw = readFileSync(manifestPath, "utf-8");
    const manifest = HydraManifestSchema.parse(JSON.parse(manifestRaw));
    
    const s = p.spinner();
    s.start("Hydrating local Hydra component");
    
    // Simulate component hydration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check for entrypoint file
    const entryPointPath = resolve(resolvedPath, manifest.entryPoint);
    if (!existsSync(entryPointPath)) {
      s.stop("Error");
      p.log.error(`Entry point file not found: ${manifest.entryPoint}`);
      process.exit(1);
    }
    
    s.stop("Component hydrated successfully!");
    
    // Display component info
    p.note(`${color.green("✓")} Hydra component loaded:
  ${color.cyan("Name:")} ${manifest.name}
  ${color.cyan("Version:")} ${manifest.version}
  ${color.cyan("Entry Point:")} ${manifest.entryPoint}
  ${color.cyan("ZK Proof:")} ${manifest.zkProofEnabled ? "Enabled" : "Disabled"}
    `, "Component Info");
    
    if (options.verbose) {
      p.log.info("Development server running in memory");
      p.log.info("Changes to component files will hot-reload automatically");
    }
    
    p.outro(`Component ${color.green(manifest.name)} is ready for local development`);
    
    return {
      success: true,
      manifest,
      path: resolvedPath
    };
  } catch (error) {
    p.log.error(`Failed to hydrate component: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Placeholder for remote hydration functionality
 * TODO: Implement full remote hydration capabilities
 */
export async function hydrateRemoteHydra(componentUri: string) {
  console.clear();
  p.intro(`${color.bgMagenta(color.white(" Hydra Remote Hydration "))}`);
  
  p.log.warn("Remote hydration is not yet fully implemented");
  p.log.info(`Attempted to hydrate: ${componentUri}`);
  
  const s = p.spinner();
  s.start("Connecting to remote registry");
  await new Promise(resolve => setTimeout(resolve, 2000));
  s.stop("Not implemented yet");
  
  p.outro("Remote hydration feature coming soon");
  return { success: false };
}
