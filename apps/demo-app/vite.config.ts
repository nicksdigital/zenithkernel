import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@islands': resolve(__dirname, './src/islands'),
      '@stores': resolve(__dirname, './src/stores'),
      '@utils': resolve(__dirname, './src/utils'),
      '@zenithcore': resolve(__dirname, '../../packages/zenith-core/src'),
      '@zenithkernel': resolve(__dirname, '../../packages/zenith-runtime/src'),
      '@core': resolve(__dirname, '../../packages/zenith-core/src/core'),
      '@modules': resolve(__dirname, '../../packages/zenith-core/src/modules'),
      '@runtime': resolve(__dirname, '../../packages/zenith-runtime/src'),
      '@sdk': resolve(__dirname, '../../packages/zenith-sdk/src')
    }
  },

  esbuild: {
    target: 'es2022',
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    jsxImportSource: '@modules/Rendering'
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },

  server: {
    port: 3000,
    host: true,
    open: true
  },

  optimizeDeps: {
    include: ['@zenithcore/core', '@zenithcore/sdk', '@zenithcore/runtime']
  }
});
