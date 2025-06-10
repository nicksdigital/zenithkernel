/**
 * Vitest Configuration for ZenithKernel SFC System
 * 
 * Configures the test environment for comprehensive testing of the SFC system
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Test configuration
  test: {
    // Environment setup
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    
    // File patterns
    include: [
      'tests/**/*.{test,spec}.{js,ts,tsx}',
      'packages/**/*.{test,spec}.{js,ts,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**'
    ],

    // Test execution
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'packages/zenith-core/src/**/*.{js,ts,tsx}',
        'test-app/src/**/*.{js,ts,tsx}'
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
        '**/index.ts' // Often just re-exports
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Specific thresholds for critical components
        'packages/zenith-core/src/modules/Rendering/template-parser.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'packages/zenith-core/src/modules/Rendering/zenith-html-transformer.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },

    // Test timeouts
    testTimeout: 10000, // 10 seconds for regular tests
    hookTimeout: 10000, // 10 seconds for hooks
    
    // Reporter configuration
    reporter: process.env.CI ? ['junit', 'json'] : ['verbose'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },

    // Benchmark configuration
    benchmark: {
      include: ['tests/benchmarks/**/*.benchmark.{test,spec}.{js,ts,tsx}'],
      exclude: ['node_modules/**'],
      outputFile: './test-results/benchmark.json'
    },

    // Pool and concurrency
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },

    // File watching
    watch: !process.env.CI,
    watchExclude: ['node_modules/**', 'dist/**'],

    // Retry configuration
    retry: process.env.CI ? 2 : 0,

    // Mock configuration
    mockReset: true,
    unstubEnvs: true,
    unstubGlobals: true
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@zenith-core': path.resolve(__dirname, 'packages/zenith-core/src'),
      '@test-app': path.resolve(__dirname, 'test-app/src'),
      '@tests': path.resolve(__dirname, 'tests'),
      '@utils': path.resolve(__dirname, 'tests/utils')
    }
  },

  // Define configuration
  define: {
    __TEST__: true,
    __DEV__: true,
    'process.env.NODE_ENV': '"test"'
  },

  // Plugin configuration for testing .zk files
  plugins: [
    // Custom plugin to handle .zk files in tests
    {
      name: 'test-zk-loader',
      load(id) {
        if (id.endsWith('.zk')) {
          // For tests, just return the raw content
          return `export default ${JSON.stringify(id)};`;
        }
      }
    }
  ],

  // esbuild configuration
  esbuild: {
    target: 'node18',
    sourcemap: true
  }
});
