/**
 * ZenithKernel Bootstrap Integration Example
 * Shows how to use the bootstrap with the Vite plugin
 */

import { quickBootstrap, createDevBootstrap, createProdBootstrap } from './ZenithBootstrap';
import type { ZenithBootstrapConfig } from './ZenithBootstrap';

/**
 * Development bootstrap configuration
 */
export const devConfig: ZenithBootstrapConfig = {
  kernel: {
    enableDiagnostics: true,
    enableHotReload: true,
    logLevel: 'debug',
    maxSystems: 50
  },
  router: {
    enableZKVerification: true,
    enableQuantumConsensus: false,
    enablePrefetching: true,
    cacheStrategy: 'normal'
  },
  security: {
    zkTrustLevel: 'local',
    enableWasmSandbox: true,
    enableManifestVerification: true,
    enableRateLimiting: true
  },
  performance: {
    enableCompression: false,
    enableServiceWorker: false,
    enablePreloading: true,
    chunkStrategy: 'component'
  },
  network: {
    registryUrl: 'http://localhost:3001',
    p2pEnabled: false,
    offlineMode: false,
    syncStrategy: 'eager'
  },
  development: {
    enableDevtools: true,
    enableHMR: true,
    enableSourceMaps: true,
    mockServices: true
  }
};

/**
 * Production bootstrap configuration
 */
export const prodConfig: ZenithBootstrapConfig = {
  kernel: {
    enableDiagnostics: false,
    enableHotReload: false,
    logLevel: 'warn',
    maxSystems: 100
  },
  router: {
    enableZKVerification: true,
    enableQuantumConsensus: true,
    enablePrefetching: true,
    cacheStrategy: 'aggressive'
  },
  security: {
    zkTrustLevel: 'verified',
    enableWasmSandbox: true,
    enableManifestVerification: true,
    enableRateLimiting: true
  },
  performance: {
    enableCompression: true,
    enableServiceWorker: true,
    enablePreloading: true,
    chunkStrategy: 'route'
  },
  network: {
    registryUrl: 'https://registry.zenithkernel.dev',
    p2pEnabled: true,
    offlineMode: true,
    syncStrategy: 'lazy'
  },
  development: {
    enableDevtools: false,
    enableHMR: false,
    enableSourceMaps: false,
    mockServices: false
  }
};

/**
 * Auto-bootstrap based on environment
 */
export async function autoBootstrap() {
  const isDev = import.meta.env.DEV;
  const config = isDev ? devConfig : prodConfig;
  
  console.log(`🌊 ZenithKernel bootstrapping in ${isDev ? 'development' : 'production'} mode`);
  
  if (isDev) {
    return createDevBootstrap(config);
  } else {
    return createProdBootstrap(config);
  }
}

/**
 * Bootstrap with custom configuration
 */
export async function bootstrapWithConfig(config: ZenithBootstrapConfig) {
  return quickBootstrap(config);
}

/**
 * React integration helper
 */
export async function bootstrapReactApp(config?: ZenithBootstrapConfig) {
  const { bootstrapWithReact } = await import('./ZenithBootstrap');
  const finalConfig = config || (import.meta.env.DEV ? devConfig : prodConfig);
  
  return bootstrapWithReact(finalConfig);
}

export default autoBootstrap;
