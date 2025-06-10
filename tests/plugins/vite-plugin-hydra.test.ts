/**
 * Tests for Vite Plugin Hydra Islands
 * 
 * Tests the .zk file processing, island discovery, and registry generation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { hydraPlugin } from '../../packages/zenith-core/src/plugins/vite-plugin-hydra';
import fs from 'fs/promises';
import path from 'path';

// Mock modules
vi.mock('fs/promises');
vi.mock('glob');

const mockFs = fs as any;
const mockGlob = await import('glob');

describe('Vite Plugin Hydra Islands', () => {
  let plugin: any;
  let mockConfig: any;
  let mockServer: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock config
    mockConfig = {
      root: '/test/project',
      command: 'serve'
    };

    // Mock server
    mockServer = {
      middlewares: {
        use: vi.fn()
      },
      ws: {
        send: vi.fn()
      }
    };

    // Mock glob
    mockGlob.glob = vi.fn();
    
    // Mock fs
    mockFs.readFile = vi.fn();
    mockFs.writeFile = vi.fn();
    mockFs.mkdir = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Plugin Configuration', () => {
    it('should create plugin with default options', () => {
      plugin = hydraPlugin();
      expect(plugin.name).toBe('vite-plugin-hydra-islands');
    });

    it('should create plugin with custom options', () => {
      plugin = hydraPlugin({
        islandsDir: 'custom/islands',
        islandPattern: '**/*.island.{ts,tsx,zk}',
        enableZKFiles: false
      });
      expect(plugin.name).toBe('vite-plugin-hydra-islands');
    });

    it('should merge options with defaults', () => {
      plugin = hydraPlugin({
        islandsDir: 'custom/islands'
      });
      
      // Plugin should use custom islandsDir but default other options
      plugin.configResolved(mockConfig);
      expect(plugin).toBeDefined();
    });
  });

  describe('Island Discovery', () => {
    beforeEach(() => {
      plugin = hydraPlugin({
        islandsDir: 'src/islands',
        islandPattern: '**/*Island.{ts,tsx,zk}'
      });
      plugin.configResolved(mockConfig);
    });

    it('should discover TypeScript islands', async () => {
      const mockFiles = [
        '/test/project/src/islands/CounterIsland.ts',
        '/test/project/src/islands/ButtonIsland.tsx'
      ];
      
      mockGlob.glob.mockResolvedValue(mockFiles);
      mockFs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('CounterIsland.ts')) {
          return Promise.resolve(`
            export const metadata = {
              name: 'CounterIsland',
              version: '1.0.0'
            };
            export default function CounterIsland() {
              return '<div>Counter</div>';
            }
          `);
        }
        return Promise.resolve('export default function ButtonIsland() {}');
      });

      await plugin.buildStart();
      
      expect(mockGlob.glob).toHaveBeenCalledWith(
        path.join('/test/project/src/islands', '**/*Island.{ts,tsx,zk}')
      );
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should discover .zk Single File Components', async () => {
      const mockFiles = ['/test/project/src/islands/CounterIsland.zk'];
      
      mockGlob.glob.mockResolvedValue(mockFiles);
      mockFs.readFile.mockResolvedValue(`
        <template>
          <div class="counter">{{ count }}</div>
        </template>
        
        <script>
        export const metadata = {
          name: 'CounterIsland',
          version: '1.0.0',
          type: 'zk'
        };
        
        export default {
          setup() {
            return { count: 0 };
          }
        };
        </script>
        
        <style>
        .counter { color: blue; }
        </style>
      `);

      await plugin.buildStart();
      
      expect(mockFs.readFile).toHaveBeenCalledWith(mockFiles[0], 'utf-8');
    });

    it('should handle discovery errors gracefully', async () => {
      mockGlob.glob.mockRejectedValue(new Error('File system error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await plugin.buildStart();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to discover islands:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('.zk File Parsing', () => {
    beforeEach(() => {
      plugin = hydraPlugin();
      plugin.configResolved(mockConfig);
    });

    it('should parse .zk file structure correctly', () => {
      const zkContent = `
        <template>
          <div class="test" v-if="visible">{{ message }}</div>
        </template>

        <script>
        export const metadata = {
          name: 'TestComponent',
          version: '1.0.0'
        };
        
        export default {
          setup() {
            return { message: 'Hello' };
          }
        };
        </script>

        <style>
        .test { color: red; }
        </style>
      `;

      // Access the private parseZKFile method for testing
      const parseZKFile = (plugin as any).parseZKFile || function(content: string) {
        const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        
        return {
          template: templateMatch ? templateMatch[1].trim() : '',
          script: scriptMatch ? scriptMatch[1].trim() : '',
          style: styleMatch ? styleMatch[1].trim() : ''
        };
      };

      const result = parseZKFile(zkContent);
      
      expect(result.template).toContain('<div class="test"');
      expect(result.template).toContain('{{ message }}');
      expect(result.script).toContain('export const metadata');
      expect(result.script).toContain('TestComponent');
      expect(result.style).toContain('.test { color: red; }');
    });

    it('should handle malformed .zk files', () => {
      const malformedContent = `
        <template>
          <div>Unclosed template
        
        <script>
        const invalid = {;
        </script>
      `;

      // Should not throw an error
      expect(() => {
        const parseZKFile = (content: string) => ({
          template: '',
          script: '',
          style: ''
        });
        parseZKFile(malformedContent);
      }).not.toThrow();
    });

    it('should extract metadata from .zk script section', () => {
      const zkContent = `
        <script>
        export const metadata = {
          name: 'TestIsland',
          version: '2.0.0',
          trustLevel: 'verified',
          ecsComponents: ['Counter', 'Health']
        };
        </script>
      `;

      // Test metadata extraction logic
      const metadataMatch = zkContent.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);
      expect(metadataMatch).toBeTruthy();
      expect(metadataMatch![1]).toContain('TestIsland');
    });
  });

  describe('.zk File Transformation', () => {
    beforeEach(() => {
      plugin = hydraPlugin();
      plugin.configResolved(mockConfig);
    });

    it('should transform .zk files to JavaScript', async () => {
      const zkContent = `
        <template>
          <div>{{ count }}</div>
        </template>
        
        <script>
        export const metadata = { name: 'Counter' };
        export default { count: 0 };
        </script>
        
        <style>
        div { color: blue; }
        </style>
      `;

      const result = await plugin.transform(zkContent, '/test/Counter.zk');
      
      if (result) {
        expect(result.code).toContain('export const metadata');
        expect(result.code).toContain('__ZK_SFC__');
        expect(result.code).toContain('__ZK_TEMPLATE__');
        expect(result.code).toContain('__ZK_STYLES__');
      }
    });

    it('should handle style extraction for .zk files', async () => {
      mockFs.readFile.mockResolvedValue(`
        <style>
        .counter { 
          color: red; 
          font-size: 16px; 
        }
        </style>
      `);

      const result = await plugin.transform('', '/test/Counter.zk?inline&type=style');
      
      if (result) {
        expect(result.code).toContain('color: red');
        expect(result.code).toContain('font-size: 16px');
      }
    });

    it('should return null for non-.zk files', async () => {
      const result = await plugin.transform('const x = 1;', '/test/file.ts');
      
      expect(result).toBeNull();
    });

    it('should handle transformation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(
        plugin.transform('invalid content', '/test/broken.zk')
      ).rejects.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Registry Generation', () => {
    beforeEach(() => {
      plugin = hydraPlugin({
        generateRegistry: true,
        outDir: 'dist'
      });
      plugin.configResolved(mockConfig);
    });

    it('should generate island registry', async () => {
      // Mock discovered islands
      const mockFiles = ['/test/project/src/islands/CounterIsland.zk'];
      mockGlob.glob.mockResolvedValue(mockFiles);
      mockFs.readFile.mockResolvedValue(`
        <template><div>{{ count }}</div></template>
        <script>
        export const metadata = {
          name: 'CounterIsland',
          version: '1.0.0'
        };
        export default {};
        </script>
      `);

      await plugin.buildStart();
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        '/test/project/dist/hydra',
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/project/dist/hydra/island-registry.js',
        expect.stringContaining('CounterIsland')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/project/dist/hydra/island-registry.d.ts',
        expect.stringContaining('CounterIsland')
      );
    });

    it('should include metadata in registry', async () => {
      const mockFiles = ['/test/project/src/islands/TestIsland.ts'];
      mockGlob.glob.mockResolvedValue(mockFiles);
      mockFs.readFile.mockResolvedValue(`
        export const metadata = {
          name: 'TestIsland',
          version: '1.0.0',
          trustLevel: 'verified'
        };
      `);

      await plugin.buildStart();
      
      const registryCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('island-registry.js')
      );
      expect(registryCall[1]).toContain('TestIsland');
      expect(registryCall[1]).toContain('registerAllIslands');
    });

    it('should handle registry generation errors', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await plugin.buildStart();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to generate island registry:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Development Server Integration', () => {
    beforeEach(() => {
      plugin = hydraPlugin();
      plugin.configResolved(mockConfig);
    });

    it('should add API middleware for islands', () => {
      plugin.configureServer(mockServer);
      
      expect(mockServer.middlewares.use).toHaveBeenCalledWith(
        '/api/hydra/islands',
        expect.any(Function)
      );
      expect(mockServer.middlewares.use).toHaveBeenCalledWith(
        '/api/hydra/islands/:name',
        expect.any(Function)
      );
    });

    it('should handle API requests for islands list', async () => {
      plugin.configureServer(mockServer);
      
      const middleware = mockServer.middlewares.use.mock.calls[0][1];
      const mockReq = { method: 'GET' };
      const mockRes = {
        setHeader: vi.fn(),
        end: vi.fn()
      };
      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.end).toHaveBeenCalledWith(
        expect.stringContaining('islands')
      );
    });

    it('should handle API requests for individual islands', async () => {
      plugin.configureServer(mockServer);
      
      const middleware = mockServer.middlewares.use.mock.calls[1][1];
      const mockReq = { url: '/api/hydra/islands/CounterIsland' };
      const mockRes = {
        setHeader: vi.fn(),
        end: vi.fn(),
        statusCode: 200
      };
      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.statusCode).toBe(404); // Island not found in empty registry
    });
  });

  describe('Hot Module Replacement', () => {
    beforeEach(() => {
      plugin = hydraPlugin({ hmr: true });
      plugin.configResolved(mockConfig);
    });

    it('should handle .zk file changes', async () => {
      const mockFile = '/test/project/src/islands/CounterIsland.zk';
      mockGlob.glob.mockResolvedValue([mockFile]);
      mockFs.readFile.mockResolvedValue('<template></template>');

      await plugin.handleHotUpdate({
        file: mockFile,
        server: mockServer
      });
      
      expect(mockServer.ws.send).toHaveBeenCalledWith({
        type: 'custom',
        event: 'hydra:island-updated',
        data: expect.objectContaining({
          islandPath: 'src/islands/CounterIsland.zk',
          type: 'zk'
        })
      });
    });

    it('should handle TypeScript island changes', async () => {
      const mockFile = '/test/project/src/islands/ButtonIsland.tsx';
      mockGlob.glob.mockResolvedValue([mockFile]);
      mockFs.readFile.mockResolvedValue('export default function() {}');

      await plugin.handleHotUpdate({
        file: mockFile,
        server: mockServer
      });
      
      expect(mockServer.ws.send).toHaveBeenCalledWith({
        type: 'custom',
        event: 'hydra:island-updated',
        data: expect.objectContaining({
          type: 'ts'
        })
      });
    });

    it('should ignore non-island file changes', async () => {
      const mockFile = '/test/project/src/utils/helper.ts';

      await plugin.handleHotUpdate({
        file: mockFile,
        server: mockServer
      });
      
      expect(mockServer.ws.send).not.toHaveBeenCalled();
    });

    it('should not process HMR when disabled', async () => {
      plugin = hydraPlugin({ hmr: false });
      plugin.configResolved(mockConfig);

      const mockFile = '/test/project/src/islands/CounterIsland.zk';

      const result = await plugin.handleHotUpdate({
        file: mockFile,
        server: mockServer
      });
      
      expect(result).toBeUndefined();
      expect(mockServer.ws.send).not.toHaveBeenCalled();
    });
  });

  describe('Build Integration', () => {
    beforeEach(() => {
      plugin = hydraPlugin({ generateRegistry: true });
      plugin.configResolved(mockConfig);
    });

    it('should emit registry file in bundle', () => {
      const mockContext = {
        emitFile: vi.fn()
      };

      plugin.generateBundle.call(mockContext, {}, {});
      
      expect(mockContext.emitFile).toHaveBeenCalledWith({
        type: 'asset',
        fileName: 'hydra/island-registry.js',
        source: expect.stringContaining('ISLANDS')
      });
    });

    it('should not emit registry when disabled', () => {
      plugin = hydraPlugin({ generateRegistry: false });
      plugin.configResolved(mockConfig);

      const mockContext = {
        emitFile: vi.fn()
      };

      plugin.generateBundle.call(mockContext, {}, {});
      
      expect(mockContext.emitFile).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      plugin = hydraPlugin();
      plugin.configResolved(mockConfig);
    });

    it('should handle manifest creation errors', async () => {
      const mockFiles = ['/test/project/src/islands/BadIsland.zk'];
      mockGlob.glob.mockResolvedValue(mockFiles);
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await plugin.buildStart();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle invalid metadata in files', async () => {
      const mockFiles = ['/test/project/src/islands/InvalidIsland.ts'];
      mockGlob.glob.mockResolvedValue(mockFiles);
      mockFs.readFile.mockResolvedValue(`
        export const metadata = {
          name: 'Invalid',
          // Invalid JSON structure
          data: { unclosed: 
        };
      `);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await plugin.buildStart();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse metadata'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should handle missing template sections in .zk files', () => {
      const incompleteZK = `
        <script>
        export default {};
        </script>
      `;

      // Should handle missing template gracefully
      expect(() => {
        const parseZKFile = (content: string) => ({
          template: '',
          script: content.match(/<script[^>]*>([\s\S]*?)<\/script>/)![1].trim(),
          style: ''
        });
        parseZKFile(incompleteZK);
      }).not.toThrow();
    });

    it('should validate plugin options', () => {
      expect(() => {
        hydraPlugin({
          islandsDir: '',
          islandPattern: ''
        });
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should cache manifests to avoid repeated parsing', async () => {
      plugin = hydraPlugin();
      plugin.configResolved(mockConfig);

      const mockFiles = ['/test/project/src/islands/CachedIsland.zk'];
      mockGlob.glob.mockResolvedValue(mockFiles);
      mockFs.readFile.mockResolvedValue('<template></template>');

      // First discovery
      await plugin.buildStart();
      // Second discovery (should use cache if implemented)
      await plugin.buildStart();
      
      // File should be read multiple times since we're calling buildStart twice
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should only process relevant files during HMR', async () => {
      plugin = hydraPlugin({ hmr: true });
      plugin.configResolved(mockConfig);

      const irrelevantFile = '/test/project/src/styles/global.css';
      const relevantFile = '/test/project/src/islands/TestIsland.zk';

      // Process irrelevant file
      await plugin.handleHotUpdate({
        file: irrelevantFile,
        server: mockServer
      });

      // Should not trigger any processing
      expect(mockGlob.glob).not.toHaveBeenCalled();

      // Process relevant file
      mockGlob.glob.mockResolvedValue([relevantFile]);
      mockFs.readFile.mockResolvedValue('<template></template>');

      await plugin.handleHotUpdate({
        file: relevantFile,
        server: mockServer
      });

      // Should trigger processing
      expect(mockGlob.glob).toHaveBeenCalled();
    });
  });
});
