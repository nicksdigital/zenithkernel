import * as p from "@clack/prompts";
import color from "picocolors";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";
import { createHash } from "crypto";

/**
 * Creates a new Hydra component with a signed manifest
 * @param name Optional name for the Hydra component
 */
export async function createHydra(name?: string): Promise<void> {
  console.clear();
  p.intro(`${color.bgMagenta(color.white(" Hydra Component Creator "))} 🐉`);

  // If no name provided, prompt for it
  if (!name) {
    name = await p.text({
      message: "Name for your Hydra component:",
      placeholder: "MyHydraComponent",
      validate: (value) => {
        if (value.length < 2) return "Name too short.";
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)) return "Name must start with a letter and contain only alphanumeric characters.";
        return undefined;
      },
    }) as string;

    if (p.isCancel(name)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }
  }

  // Prompt for component options
  const options = await p.group(
    {
      zkProofEnabled: () => p.confirm({ 
        message: "Enable zero-knowledge proof verification?",
        initialValue: false
      }),
      createDirectory: () => p.confirm({
        message: "Create a new directory for this component?",
        initialValue: true
      }),
      useECSHook: () => p.confirm({
        message: "Use ECS integration hook?",
        initialValue: true
      })
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled");
        process.exit(0);
      }
    }
  );

  // Create directory structure
  const baseDir = options.createDirectory ? 
    resolve(process.cwd(), name) : 
    process.cwd();

  try {
    if (options.createDirectory) {
      mkdirSync(baseDir, { recursive: true });
    }

    // Generate manifest file
    const manifest = {
      name,
      version: "0.1.0",
      entryPoint: "index.tsx",
      zkProofEnabled: options.zkProofEnabled,
      dependencies: {},
      signature: createSignature(name),
      created: new Date().toISOString()
    };

    writeFileSync(
      join(baseDir, "hydra.manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    // Create component file
    const componentContent = generateComponentTemplate(name, options);
    writeFileSync(join(baseDir, "index.tsx"), componentContent);

    // If ECS hook is enabled, create a hook file
    if (options.useECSHook) {
      const hookContent = generateECSHookTemplate(name);
      writeFileSync(join(baseDir, "useHydraState.ts"), hookContent);
    }

    p.note(`${color.green("✓")} Hydra component created:
  ${color.cyan("Name:")} ${name}
  ${color.cyan("Directory:")} ${baseDir}
  ${color.cyan("ZK Proof:")} ${options.zkProofEnabled ? "Enabled" : "Disabled"}
  ${color.cyan("ECS Hook:")} ${options.useECSHook ? "Enabled" : "Disabled"}
    `, "Component Created");

    p.outro(`Run ${color.green(`zenith hydra local ${options.createDirectory ? name : "."}`)} to test your component.`);
  } catch (error) {
    p.log.error(`Failed to create Hydra component: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Generates a simple signature for the manifest (placeholder for actual OST signing)
 */
function createSignature(name: string): string {
  return createHash('sha256')
    .update(`${name}_${Date.now()}`)
    .digest('hex');
}

/**
 * Generates the template for the component file
 */
function generateComponentTemplate(name: string, options: { zkProofEnabled: boolean, useECSHook: boolean }): string {
  return `import React from 'react';
${options.useECSHook ? `import { useHydraState } from './useHydraState';` : ''}

export interface ${name}Props {
  id: string;
  context?: Record<string, any>;
${options.zkProofEnabled ? '  proofData?: Uint8Array;\n' : ''}
}

/**
 * ${name} - A Hydra component
 * 
 * This component is designed to work with the Hydra system,
 * allowing for decentralized, verifiable UI rendering.
 */
export function ${name}({ id, context${options.zkProofEnabled ? ', proofData' : ''} }: ${name}Props) {
  ${options.useECSHook ? 'const { data, loading, error } = useHydraState(id);' : ''}

  return (
    <div className="hydra-component ${name.toLowerCase()}">
      <h2>${name}</h2>
      ${options.useECSHook ? `
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error.message}</div>}
      {data && (
        <div className="content">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}` : `
      <div className="content">
        <p>Hydra Component Content</p>
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>`}
    </div>
  );
}

export default ${name};
`;
}

/**
 * Generates the template for the ECS hook file
 */
function generateECSHookTemplate(name: string): string {
  return `import { useState, useEffect } from 'react';

/**
 * Custom hook for connecting the ${name} component to the ECS system
 * 
 * @param id - The ID of the Hydra component instance
 * @returns Object containing data, loading state, and any error
 */
export function useHydraState(id: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      try {
        // TODO: Replace with actual ECS data fetching
        const mockData = {
          entityId: id,
          timestamp: Date.now(),
          status: "active",
          // This would be replaced with actual ECS component data
          components: {
            position: { x: 100, y: 100 },
            metadata: { name: "${name} Instance", tags: ["ui", "hydra"] }
          }
        };
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (mounted) {
          setData(mockData);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    fetchData();
    
    // Optional: Setup subscription for real-time updates
    // const unsubscribe = subscribeToEntityChanges(id, (newData) => {
    //   if (mounted) setData(newData);
    // });
    
    return () => {
      mounted = false;
      // if (unsubscribe) unsubscribe();
    };
  }, [id]);

  return { data, loading, error };
}
`;
}
