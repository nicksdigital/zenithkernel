/**
 * Vite Plugin for Hydra Islands
 * 
 * Handles discovery, transformation, and registration of island components
 */

import { Plugin } from 'vite';
import { glob } from 'glob';
import * as fs from 'fs/promises';
import * as path from 'path';

interface HydraPluginOptions {
  islandsDir?: string;
  islandPattern?: string;
  enableZKFiles?: boolean;
  generateRegistry?: boolean;
  outDir?: string;
  hmr?: boolean;
}

export function hydraPlugin(options: HydraPluginOptions = {}): Plugin {
  const defaultOptions = {
    islandsDir: 'src/islands',
    islandPattern: '**/*Island.{ts,tsx,zk}',
    enableZKFiles: true,
    generateRegistry: true,
    outDir: 'dist',
    hmr: true
  };

  const resolvedOptions = { ...defaultOptions, ...options };
  let projectRoot: string;
  let islands: Map<string, any> = new Map();

  return {
    name: 'vite-plugin-hydra-islands',

    configResolved(config) {
      projectRoot = config.root;
    },

    async buildStart() {
      try {
        // Discover islands
        const pattern = path.join(resolvedOptions.islandsDir, resolvedOptions.islandPattern);
        const files = await glob(pattern);

        // Process each island file
        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          const isZKFile = file.endsWith('.zk');

          if (isZKFile && resolvedOptions.enableZKFiles) {
            const parsed = this.parseZKFile(content);
            islands.set(file, {
              type: 'zk',
              content: parsed,
              metadata: this.extractMetadata(parsed.script)
            });
          } else {
            islands.set(file, {
              type: 'ts',
              content,
              metadata: this.extractMetadata(content)
            });
          }
        }

        // Generate registry if enabled
        if (resolvedOptions.generateRegistry) {
          await this.generateRegistry();
        }
      } catch (error) {
        console.error('Failed to discover islands:', error);
      }
    },

    configureServer(server) {
      // Add API endpoints for island discovery
      server.middlewares.use('/api/hydra/islands', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ islands: Array.from(islands.keys()) }));
      });

      server.middlewares.use('/api/hydra/islands/:name', (req, res) => {
        const islandPath = req.url?.split('/').pop();
        const island = Array.from(islands.entries())
          .find(([path]) => path.includes(islandPath || ''));

        if (island) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(island[1]));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Island not found' }));
        }
      });
    },

    async handleHotUpdate({ file, server }) {
      if (!resolvedOptions.hmr) return;

      const isIsland = file.includes(resolvedOptions.islandsDir) &&
        (file.endsWith('.zk') || file.match(/Island\.(ts|tsx)$/));

      if (isIsland) {
        const content = await fs.readFile(file, 'utf-8');
        const isZKFile = file.endsWith('.zk');
        const relativePath = path.relative(projectRoot, file);

        server.ws.send({
          type: 'custom',
          event: 'hydra:island-updated',
          data: {
            islandPath: relativePath,
            type: isZKFile ? 'zk' : 'ts',
            content: isZKFile ? this.parseZKFile(content) : content
          }
        });
      }
    },

    generateBundle() {
      if (!resolvedOptions.generateRegistry) return;

      const registry = Array.from(islands.entries()).map(([file, data]) => ({
        path: file,
        ...data
      }));

      this.emitFile({
        type: 'asset',
        fileName: 'hydra/island-registry.js',
        source: `export const ISLANDS = ${JSON.stringify(registry, null, 2)};`
      });
    },

    parseZKFile(content: string | undefined | null) {
      if (!content) {
        return {
          template: '',
          script: '',
          style: '',
          error: 'Invalid or empty content'
        };
      }

      try {
        const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);

        return {
          template: templateMatch ? templateMatch[1].trim() : '',
          script: scriptMatch ? scriptMatch[1].trim() : '',
          style: styleMatch ? styleMatch[1].trim() : '',
          error: !templateMatch ? 'Missing template section' : undefined
        };
      } catch (error) {
        return {
          template: '',
          script: '',
          style: '',
          error: error instanceof Error ? error.message : 'Failed to parse ZK file'
        };
      }
    },

    extractMetadata(content: string) {
      try {
        const metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);
        if (metadataMatch) {
          return JSON.parse(metadataMatch[1]);
        }
      } catch (error) {
        console.warn('Failed to parse metadata:', error);
      }
      return {};
    },

    async generateRegistry() {
      try {
        const outDir = path.join(projectRoot, resolvedOptions.outDir, 'hydra');
        await fs.mkdir(outDir, { recursive: true });

        const registry = Array.from(islands.entries()).map(([file, data]) => ({
          path: file,
          ...data
        }));

        await fs.writeFile(
          path.join(outDir, 'island-registry.js'),
          `export const ISLANDS = ${JSON.stringify(registry, null, 2)};`
        );

        await fs.writeFile(
          path.join(outDir, 'island-registry.d.ts'),
          `export declare const ISLANDS: Array<{
  path: string;
  type: 'zk' | 'ts';
  content: any;
  metadata: any;
}>;`
        );
      } catch (error) {
        console.error('Failed to generate island registry:', error);
      }
    }
  };
}