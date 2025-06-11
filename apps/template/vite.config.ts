import { defineConfig } from 'vite';
// import { zenithKernel } from '@zenithcore/vite-plugin';

export default defineConfig({
  root: '.',
  plugins: [
    // Temporarily disabled until TypeScript issue is resolved
    // zenithKernel plugin will be enabled once the build issue is fixed
  ],

  // Allow Vite to process TypeScript files from node_modules
  optimizeDeps: {
    exclude: ['@zenithcore/core', '@zenithcore/sdk', '@zenithcore/runtime'],
    esbuildOptions: {
      target: 'es2022'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@pages': './src/pages',
      '@stores': './src/stores',
      '@types': './src/types'
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
