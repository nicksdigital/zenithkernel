/**
 * Vite Plugin for ZenithKernel Hydra Islands
 * 
 * This plugin provides:
 * - Automatic island discovery and registration
 * - Code splitting for individual islands
 * - Hot module replacement for islands
 * - Development server integration
 * - Build-time optimizations
 */

import { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import { createHash } from 'crypto';

export interface HydraViteOptions {
  /** Directory containing island components */
  islandsDir?: string;
  /** Pattern to match island files */
  islandPattern?: string;
  /** Enable hot module replacement for islands */
  hmr?: boolean;
  /** Generate island registry file */
  generateRegistry?: boolean;
  /** Output directory for generated files */
  outDir?: string;
  /** Enable development mode features */
  dev?: boolean;
}

export interface IslandManifest {
  name: string;
  path: string;
  hash: string;
  dependencies: string[];
  metadata: any;
}

const DEFAULT_OPTIONS: Required<HydraViteOptions> = {
  islandsDir: 'src/modules/Rendering/islands',
  islandPattern: '**/*Island.{ts,tsx}',
  hmr: true,
  generateRegistry: true,
  outDir: 'dist',
  dev: false
};

export function hydraPlugin(options: HydraViteOptions = {}): Plugin {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let config: ResolvedConfig;
  let server: ViteDevServer | undefined;
  let islandManifests: Map<string, IslandManifest> = new Map();

  const discoverIslands = async () => {
	const islandsPath = path.resolve(config.root, opts.islandsDir);
	const pattern = path.join(islandsPath, opts.islandPattern);
	
	try {
	  const files = await glob(pattern);
	  islandManifests.clear();
	  
	  for (const file of files) {
		const manifest = await createIslandManifest(file);
		if (manifest) {
		  islandManifests.set(manifest.name, manifest);
		}
	  }
	  
	  console.log(`🏝️ Discovered ${islandManifests.size} islands`);
	} catch (error) {
	  console.error('Failed to discover islands:', error);
	}
  };

  const createIslandManifest = async (filePath: string): Promise<IslandManifest | null> => {
	try {
	  const content = await fs.readFile(filePath, 'utf-8');
	  const relativePath = path.relative(config.root, filePath);
	  const name = path.basename(filePath, path.extname(filePath));
	  
	  // Generate hash for cache busting
	  const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
	  
	  // Extract metadata from file (look for export const metadata)
	const metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);
let metadata = {};

if (metadataMatch) {
  try {
    // Clean up the metadata string for better JSON parsing
    let metaStr = metadataMatch[1]
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .trim();
    
    // Additional cleanup for edge cases
    if (metaStr.endsWith(',}')) {
      metaStr = metaStr.slice(0, -2) + '}';
    }
    if (metaStr.endsWith(',]')) {
      metaStr = metaStr.slice(0, -2) + ']';
    }
    
    metadata = JSON.parse(metaStr);
  } catch (e) {
    console.warn(`Failed to parse metadata for ${name}. Skipping metadata.`, e);
    console.log('Raw metadata match:', metadataMatch[1]);
    metadata = {};
  }
} else {
  // No metadata export found
  metadata = {};
}
	console.log(metadataMatch?.[1]);
	  
	  // Extract dependencies (basic import analysis)
	  const importMatches = content.match(/import.*from\s+['"]([^'"]*)['"];?/g) || [];
	  const dependencies = importMatches
		.map(imp => {
		  const match = imp.match(/from\s+['"]([^'"]*)['"]/);
		  return match ? match[1] : null;
		})
		.filter(Boolean) as string[];
	  
	  return {
		name,
		path: relativePath,
		hash,
		dependencies,
		metadata
	  };
	} catch (error) {
	  console.error(`Failed to create manifest for ${filePath}:`, error);
	  return null;
	}
  };

  const generateIslandRegistry = async () => {
	const registryPath = path.resolve(config.root, opts.outDir, 'hydra');
	
	try {
	  await fs.mkdir(registryPath, { recursive: true });
	  
	  const registryContent = generateRegistryContent();
	  await fs.writeFile(
		path.join(registryPath, 'island-registry.js'),
		registryContent
	  );
	  
	  // Also generate TypeScript definitions
	  const typesContent = generateRegistryTypes();
	  await fs.writeFile(
		path.join(registryPath, 'island-registry.d.ts'),
		typesContent
	  );
	  
	  console.log(`📝 Generated island registry with ${islandManifests.size} islands`);
	} catch (error) {
	  console.error('Failed to generate island registry:', error);
	}
  };

  const generateRegistryContent = (): string => {
	const islands = Array.from(islandManifests.values());
	
	return `/**
 * Auto-generated Hydra Island Registry
 * Generated at: ${new Date().toISOString()}
 */

// Island imports
${islands.map(island => 
  `import ${island.name} from '${island.path.replace(/\.(ts|tsx)$/, '')}';
import { metadata as ${island.name}Metadata } from '${island.path.replace(/\.(ts|tsx)$/, '')}';
`).join('')}

// Registry data
export const ISLANDS = {
${islands.map(island => 
  `  '${island.name}': {
	component: ${island.name},
	metadata: ${island.name}Metadata,
	hash: '${island.hash}',
	dependencies: ${JSON.stringify(island.dependencies)}
  }`
).join(',\n')}
};

// Auto-registration function
export function registerAllIslands() {
  if (typeof window !== 'undefined' && window.__HYDRA_RUNTIME__) {
	Object.entries(ISLANDS).forEach(([name, island]) => {
	  window.__HYDRA_RUNTIME__.registerIsland({
		name,
		component: island.component,
		...island.metadata
	  });
	});
  }
}

// Development hot reload support
if (import.meta.hot) {
  import.meta.hot.on('hydra:island-updated', (data) => {
	console.log('🔄 Hot reloading island:', data.islandPath);
	// Re-register islands on hot reload
	registerAllIslands();
  });
}

// Auto-register in development
if (import.meta.env.DEV) {
  registerAllIslands();
}

export default ISLANDS;
`;
  };

  const generateRegistryTypes = (): string => {
	const islands = Array.from(islandManifests.values());
	
	return `/**
 * Auto-generated Hydra Island Registry Types
 * Generated at: ${new Date().toISOString()}
 */

import type { IslandComponent, IslandRegistration } from '../modules/Rendering/types';

// Island type definitions
${islands.map(island => 
  `export interface ${island.name}Island extends IslandComponent {}
`).join('')}

// Registry interface
export interface IslandRegistry {
${islands.map(island => 
  `  '${island.name}': {
	component: ${island.name}Island;
	metadata: any;
	hash: string;
	dependencies: string[];
  };`
).join('\n')}
}

export declare const ISLANDS: IslandRegistry;
export declare function registerAllIslands(): void;
export default ISLANDS;

// Global type augmentation
declare global {
  interface Window {
	__HYDRA_RUNTIME__?: {
	  registerIsland: (registration: IslandRegistration) => void;
	  [key: string]: any;
	};
  }
}
`;
  };

  return {
	name: 'vite-plugin-hydra-islands',
	
	configResolved(resolvedConfig) {
	  config = resolvedConfig;
	  opts.dev = resolvedConfig.command === 'serve';
	},

	configureServer(devServer) {
	  server = devServer;
	  
	  // Add middleware for island registry API
	  devServer.middlewares.use('/api/hydra/islands', async (req, res, next) => {
		if (req.method === 'GET') {
		  const islands = Array.from(islandManifests.values());
		  res.setHeader('Content-Type', 'application/json');
		  res.end(JSON.stringify({ islands }));
		} else {
		  next();
		}
	  });

	  // Add middleware for individual island info
	  devServer.middlewares.use('/api/hydra/islands/:name', async (req, res, next) => {
		const islandName = req.url?.split('/').pop();
		if (islandName && islandManifests.has(islandName)) {
		  const manifest = islandManifests.get(islandName);
		  res.setHeader('Content-Type', 'application/json');
		  res.end(JSON.stringify(manifest));
		} else {
		  res.statusCode = 404;
		  res.end(JSON.stringify({ error: 'Island not found' }));
		}
	  });
	},

	async buildStart() {
	  // Discover islands at build start
	  await discoverIslands();
	  
	  if (opts.generateRegistry) {
		await generateIslandRegistry();
	  }
	},

	async handleHotUpdate({ file, server }) {
	  if (!opts.hmr || !server) return;

	  // Check if the changed file is an island
	  const islandPath = path.relative(config.root, file);
	  const isIsland = islandPath.includes(opts.islandsDir) && 
					  (islandPath.endsWith('Island.ts') || islandPath.endsWith('Island.tsx'));
	  
	  if (isIsland) {
		console.log(`🌊 Hot reloading island: ${path.basename(file)}`);
		
		// Re-discover islands and update registry
		await discoverIslands();
		
		if (opts.generateRegistry) {
		  await generateIslandRegistry();
		}
		
		// Send custom HMR update for island registry
		server.ws.send({
		  type: 'custom',
		  event: 'hydra:island-updated',
		  data: {
			islandPath,
			timestamp: Date.now()
		  }
		});
	  }
	},

	generateBundle(options, bundle) {
	  // Add island manifests to bundle
	  if (opts.generateRegistry) {
		const registryContent = generateRegistryContent();
		
		this.emitFile({
		  type: 'asset',
		  fileName: 'hydra/island-registry.js',
		  source: registryContent
		});
	  }
	}
  };
}

export default hydraPlugin;