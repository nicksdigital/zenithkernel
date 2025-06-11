import { defineConfig } from 'vite';
import { zenithKernel } from '@zenithcore/vite-plugin';

export default defineConfig({
  plugins: [
    zenithKernel({
      // Bootstrap configuration
      bootstrap: {
        name: 'zenith-template',
        version: '1.0.0',
        features: ['signals', 'stores', 'islands', 'router']
      },
      
      // Auto-generation settings
      autoGenerate: {
        routes: true,
        hydras: true,
        manifests: true,
        types: true
      },
      
      // Optimization settings
      optimization: {
        quantumChunking: true,
        zkOptimization: false, // Disabled for template
        wasmInlining: true,
        hydraPreloading: true
      },
      
      // Development settings
      development: {
        hotReloadHydras: true,
        mockZkProofs: true,
        simulateQuantumConsensus: false,
        enableDebugOverlay: true
      },
      
      // Output settings
      output: {
        serviceWorker: true,
        manifestGeneration: true,
        typeDefinitions: true
      }
    })
  ],
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@stores': '/src/stores',
      '@types': '/src/types'
    }
  },
  
  // Server configuration
  server: {
    port: 3000,
    host: true,
    open: true
  },
  
  // Build configuration
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'zenith-core': ['@zenithcore/core'],
          'zenith-sdk': ['@zenithcore/sdk'],
          'zenith-runtime': ['@zenithcore/runtime']
        }
      }
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  },
  
  // Define global constants
  define: {
    __ZENITH_VERSION__: JSON.stringify('1.0.0'),
    __ZENITH_ENV__: JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
