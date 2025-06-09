/**
 * ZenithKernel Bootstrap System
 * Complete initialization and setup for quantum-decentralized applications
 */

import { ZenithKernel } from '@core/ZenithKernel';
import { createZenithRouter, ZenithRouterIntegration } from '@core/router';
import { RegistryServer } from '@modules/RegistryServer/RegistryServer';
import {createVerifySystem, handleVerifyRequest} from '@modules/RegistryServer/VerifySystem';
import { handleChallengeRequest } from '@modules/RegistryServer/ChallengeSystem';
import { ECSManager } from '@core/ECSManager';
import { SystemManager } from '@core/SystemManager';
import { Scheduler } from '@core/Scheduler';
import { MessagingSystem } from '@core/MessagingSystem';
import { WasmModuleProxy } from '@core/WasmModuleProxy';
import { signal, Signal } from '@core/signals';

// Bootstrap configuration interface
export interface ZenithBootstrapConfig {
  // Core kernel settings
  kernel?: {
    enableDiagnostics?: boolean;
    enableHotReload?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    maxSystems?: number;
  };

  // Router configuration
  router?: {
    enableZKVerification?: boolean;
    enableQuantumConsensus?: boolean;
    enablePrefetching?: boolean;
    cacheStrategy?: 'aggressive' | 'normal' | 'minimal';
  };

  // Security settings
  security?: {
    zkTrustLevel?: 'unverified' | 'local' | 'community' | 'verified';
    enableWasmSandbox?: boolean;
    enableManifestVerification?: boolean;
    enableRateLimiting?: boolean;
  };

  // Performance settings
  performance?: {
    enableCompression?: boolean;
    enableServiceWorker?: boolean;
    enablePreloading?: boolean;
    chunkStrategy?: 'route' | 'component' | 'manual';
  };

  // Network settings
  network?: {
    registryUrl?: string;
    p2pEnabled?: boolean;
    offlineMode?: boolean;
    syncStrategy?: 'eager' | 'lazy' | 'manual';
  };

  // Development settings
  development?: {
    enableDevtools?: boolean;
    enableHMR?: boolean;
    enableSourceMaps?: boolean;
    mockServices?: boolean;
  };

  // Plugin system
  plugins?: ZenithPlugin[];
}

// Plugin interface
export interface ZenithPlugin {
  name: string;
  version?: string;
  install: (kernel: ZenithKernel, config: ZenithBootstrapConfig) => Promise<void> | void;
  uninstall?: (kernel: ZenithKernel) => Promise<void> | void;
}

// Bootstrap result
export interface ZenithBootstrapResult {
  kernel: ZenithKernel;
  router: ZenithRouterIntegration;
  config: ZenithBootstrapConfig;
  cleanup: () => Promise<void>;
  restart: () => Promise<ZenithBootstrapResult>;
}

// Bootstrap state
export interface BootstrapState {
  phase: 'initializing' | 'loading' | 'ready' | 'error';
  progress: number;
  currentStep: string;
  error?: Error;
  startTime: number;
  systems: string[];
  plugins: string[];
}

/**
 * Main Bootstrap Class
 */
export class ZenithBootstrap {
  private config: ZenithBootstrapConfig = {};
  private kernel?: ZenithKernel;
  private router?: ZenithRouterIntegration;
  private plugins: Map<string, ZenithPlugin> = new Map();
  
  // Reactive bootstrap state
  public readonly state = signal<BootstrapState>({
    phase: 'initializing',
    progress: 0,
    currentStep: 'Starting bootstrap',
    startTime: Date.now(),
    systems: [],
    plugins: []
  });

  constructor(config: ZenithBootstrapConfig = {}) {
    this.config = this.mergeConfig(config);
  }

  /**
   * Main bootstrap method
   */
  async bootstrap(): Promise<ZenithBootstrapResult> {
    try {
      this.updateState({
        phase: 'loading',
        progress: 0,
        currentStep: 'Initializing ZenithKernel',
        startTime: Date.now()
      });

      // Step 1: Initialize kernel
      const kernel = await this.initializeKernel();
      this.updateState({ progress: 20, currentStep: 'Kernel initialized' });

      // Step 2: Setup core systems
      await this.setupCoreSystems(kernel);
      this.updateState({ progress: 40, currentStep: 'Core systems loaded' });

      // Step 3: Initialize router
      const router = await this.initializeRouter(kernel);
      this.updateState({ progress: 60, currentStep: 'Router initialized' });

      // Step 4: Install plugins
      await this.installPlugins(kernel);
      this.updateState({ progress: 80, currentStep: 'Plugins installed' });

      // Step 5: Final setup
      await this.finalizeBootstrap(kernel, router);
      this.updateState({
        phase: 'ready',
        progress: 100,
        currentStep: 'Bootstrap complete'
      });

      const result: ZenithBootstrapResult = {
        kernel,
        router,
        config: this.config,
        cleanup: () => this.cleanup(kernel, router),
        restart: () => this.restart()
      };

      this.kernel = kernel;
      this.router = router;

      return result;

    } catch (error) {
      this.updateState({
        phase: 'error',
        error: error as Error,
        currentStep: `Bootstrap failed: ${(error as Error).message}`
      });
      throw error;
    }
  }

  /**
   * Initialize ZenithKernel with configuration
   */
  private async initializeKernel(): Promise<ZenithKernel> {
    const kernel = new ZenithKernel();
    
    // Configure kernel based on settings
    if (this.config.kernel?.enableDiagnostics) {
      kernel.enableDiagnostics();
    }

    if (this.config.kernel?.enableHotReload) {
      kernel.enableHotReload();
    }

    if (this.config.kernel?.logLevel) {
      kernel.setLogLevel(this.config.kernel.logLevel);
    }

    // Initialize kernel
    await kernel.initialize();

    return kernel;
  }

  /**
   * Setup core systems
   */
  private async setupCoreSystems(kernel: ZenithKernel): Promise<void> {
    const systems = [];

    // ECS Manager
    const ecsManager = new ECSManager();
  

    // System Manager
    const systemManager = new SystemManager(ecsManager);
    kernel.registerSystem(systemManager);
    systems.push('SystemManager');

    // Scheduler
    const scheduler = new Scheduler(ecsManager);
    kernel.registerSystem(scheduler);
    systems.push('Scheduler');

    // Messaging System
   /* if (this.config.network?.p2pEnabled !== false) {
      const messagingSystem = new MessagingSystem(ecsManager);
      kernel.registerSystem(messagingSystem);
      systems.push('MessagingSystem');
    }
*/
    // Registry Server
    const registryServer = new RegistryServer(ecsManager);
  
    kernel.registerSystem(registryServer);
    systems.push('RegistryServer');

    // Verify System
    const verifySystem = createVerifySystem(ecsManager);
    kernel.registerSystem(verifySystem);
    systems.push('VerifySystem');

    // WASM Module Proxy (if enabled)
    if (this.config.security?.enableWasmSandbox !== false) {
      // You must load a WASM module and pass its exports to WasmModuleProxy
      const wasmExports = await kernel.loadWasmModule?.('/path/to/your/module.wasm');
      if (wasmExports) {
        const wasmProxy = new WasmModuleProxy(wasmExports);
        // @ts-ignore
        kernel.registerSystem(wasmProxy);
        systems.push('WasmModuleProxy');
      }
    }

    this.updateState({ systems });
  }

  /**
   * Initialize router with ZenithKernel integration
   */
  private async initializeRouter(kernel: ZenithKernel): Promise<ZenithRouterIntegration> {
    const router = createZenithRouter(kernel);

    // Configure router based on settings
    if (this.config.router?.enablePrefetching) {
      router.getRouter().enablePrefetching();
    }

    if (this.config.router?.cacheStrategy) {
      router.getRouter().setCacheStrategy(this.config.router.cacheStrategy);
    }

    return router;
  }

  /**
   * Install all configured plugins
   */
  private async installPlugins(kernel: ZenithKernel): Promise<void> {
    const pluginNames = [];

    if (this.config.plugins) {
      for (const plugin of this.config.plugins) {
        try {
          await plugin.install(kernel, this.config);
          this.plugins.set(plugin.name, plugin);
          pluginNames.push(plugin.name);
          
          this.updateState({ 
            currentStep: `Plugin installed: ${plugin.name}`,
            plugins: pluginNames
          });
        } catch (error) {
          console.error(`Failed to install plugin ${plugin.name}:`, error);
        }
      }
    }

    // Install built-in development plugins
    if (this.config.development?.enableDevtools && import.meta.env.DEV) {
      await this.installDevtools(kernel);
      pluginNames.push('ZenithDevtools');
    }

    this.updateState({ plugins: pluginNames });
  }

  /**
   * Install development tools
   */
  private async installDevtools(kernel: ZenithKernel): Promise<void> {
    if (typeof window !== 'undefined') {
      // Create devtools interface
      (window as any).__ZENITH_DEVTOOLS__ = {
        kernel,
        router: this.router,
        config: this.config,
        state: this.state,
        inspectECS: () => kernel.getSystem('ECSManager'),
        inspectSystems: () => kernel.getSystem('SystemManager'),
        inspectRouter: () => this.router,
        reboot: () => this.restart()
      };

      console.log('🌊 ZenithKernel DevTools installed');
      console.log('Access via: window.__ZENITH_DEVTOOLS__');
    }
  }

  /**
   * Finalize bootstrap process
   */
  private async finalizeBootstrap(
    kernel: ZenithKernel, 
    router: ZenithRouterIntegration
  ): Promise<void> {
    // Start the kernel loop
    kernel.startLoop();

    // Setup performance monitoring
    if (this.config.performance?.enablePreloading) {
      await this.setupPreloading(router);
    }

    // Setup service worker
    if (this.config.performance?.enableServiceWorker && 'serviceWorker' in navigator) {
      await this.setupServiceWorker();
    }

    // Setup offline capabilities
    if (this.config.network?.offlineMode) {
      await this.setupOfflineMode(kernel);
    }

    // Emit bootstrap complete event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zenith:bootstrap:complete', {
        detail: { kernel, router, config: this.config }
      }));
    }
  }

  /**
   * Setup route preloading
   */
  private async setupPreloading(router: ZenithRouterIntegration): Promise<void> {
    // Preload critical routes
    const criticalRoutes = ['/dashboard', '/profile'];
    
    for (const route of criticalRoutes) {
      try {
        await router.getRouter().prefetch(route);
      } catch (error) {
        console.warn(`Failed to preload route ${route}:`, error);
      }
    }
  }

  /**
   * Setup service worker
   */
  private async setupServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/zenith-sw.js');
      console.log('🌊 ZenithKernel Service Worker registered');
      
      registration.addEventListener('updatefound', () => {
        console.log('🌊 ZenithKernel update available');
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup offline mode
   */
  private async setupOfflineMode(kernel: ZenithKernel): Promise<void> {
    // Setup offline event listeners
    window.addEventListener('online', () => {
      kernel.setOnlineStatus(true);
      console.log('🌊 ZenithKernel: Online mode');
    });

    window.addEventListener('offline', () => {
      kernel.setOnlineStatus(false);
      console.log('🌊 ZenithKernel: Offline mode');
    });
  }

  /**
   * Cleanup resources
   */
  private async cleanup(
    kernel: ZenithKernel,
    router: ZenithRouterIntegration
  ): Promise<void> {
    // Uninstall plugins
    for (const [name, plugin] of this.plugins) {
      if (plugin.uninstall) {
        try {
          await plugin.uninstall(kernel);
        } catch (error) {
          console.error(`Failed to uninstall plugin ${name}:`, error);
        }
      }
    }

    // Stop kernel
    kernel.stop();

    // Clear devtools
    if (typeof window !== 'undefined') {
      delete (window as any).__ZENITH_DEVTOOLS__;
    }

    this.updateState({
      phase: 'initializing',
      progress: 0,
      currentStep: 'Cleaned up'
    });
  }

  /**
   * Restart the entire system
   */
  private async restart(): Promise<ZenithBootstrapResult> {
    if (this.kernel && this.router) {
      await this.cleanup(this.kernel, this.router);
    }
    return this.bootstrap();
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(config: ZenithBootstrapConfig): ZenithBootstrapConfig {
    return {
      kernel: {
        enableDiagnostics: true,
        enableHotReload: import.meta.env.DEV,
        logLevel: import.meta.env.DEV ? 'debug' : 'info',
        maxSystems: 50,
        ...config.kernel
      },
      router: {
        enableZKVerification: true,
        enableQuantumConsensus: false,
        enablePrefetching: true,
        cacheStrategy: 'normal',
        ...config.router
      },
      security: {
        zkTrustLevel: 'local',
        enableWasmSandbox: true,
        enableManifestVerification: true,
        enableRateLimiting: true,
        ...config.security
      },
      performance: {
        enableCompression: true,
        enableServiceWorker: !import.meta.env.DEV,
        enablePreloading: true,
        chunkStrategy: 'route',
        ...config.performance
      },
      network: {
        registryUrl: 'https://registry.zenithkernel.dev',
        p2pEnabled: true,
        offlineMode: false,
        syncStrategy: 'eager',
        ...config.network
      },
      development: {
        enableDevtools: import.meta.env.DEV,
        enableHMR: import.meta.env.DEV,
        enableSourceMaps: import.meta.env.DEV,
        mockServices: import.meta.env.DEV,
        ...config.development
      },
      plugins: config.plugins || []
    };
  }

  /**
   * Update bootstrap state
   */
  private updateState(updates: Partial<BootstrapState>): void {
    this.state.value = { ...this.state.value, ...updates };
  }

  /**
   * Get current bootstrap state
   */
  getState(): Signal<BootstrapState> {
    return this.state;
  }

  /**
   * Add plugin dynamically
   */
  addPlugin(plugin: ZenithPlugin): void {
    if (!this.config.plugins) {
      this.config.plugins = [];
    }
    this.config.plugins.push(plugin);
  }

  /**
   * Remove plugin
   */
  removePlugin(name: string): void {
    if (this.config.plugins) {
      this.config.plugins = this.config.plugins.filter(p => p.name !== name);
    }
    this.plugins.delete(name);
  }
}

/**
 * Quick bootstrap function for simple use cases
 */
export async function quickBootstrap(
  config: ZenithBootstrapConfig = {}
): Promise<ZenithBootstrapResult> {
  const bootstrap = new ZenithBootstrap(config);
  return bootstrap.bootstrap();
}

/**
 * Bootstrap with React integration
 */
export async function bootstrapWithReact(
  config: ZenithBootstrapConfig = {}
): Promise<ZenithBootstrapResult & { 
  RouterProvider: React.ComponentType<{ children: React.ReactNode }> 
}> {
  const result = await quickBootstrap(config);
  
  // Dynamic React import
  const React = await import('react');
  const { RouterProvider: BaseRouterProvider } = await import('../core/router');
  
  // Ensure BaseRouterProvider is a valid React component, otherwise wrap it
  const RouterProvider: React.ComponentType<{ children: React.ReactNode }> = ({ children }) => {
    // If BaseRouterProvider is not a React component, render children directly or wrap as needed
    if (typeof BaseRouterProvider === 'function' && BaseRouterProvider.prototype && BaseRouterProvider.prototype.isReactComponent) {
      return React.createElement(BaseRouterProvider as any, {
        router: result.router.getRouter()
      }, children);
    } else if (typeof BaseRouterProvider === 'function') {
      // If it's a function but not a React component, wrap it
      return React.createElement(React.Fragment, null, children);
    } else {
      // Fallback: just render children
      return React.createElement(React.Fragment, null, children);
    }
  };

  return { ...result, RouterProvider };
}

/**
 * Create development bootstrap with all dev features enabled
 */
export async function createDevBootstrap(
  config: ZenithBootstrapConfig = {}
): Promise<ZenithBootstrapResult> {
  const devConfig: ZenithBootstrapConfig = {
    ...config,
    development: {
      enableDevtools: true,
      enableHMR: true,
      enableSourceMaps: true,
      mockServices: true,
      ...config.development
    },
    kernel: {
      enableDiagnostics: true,
      enableHotReload: true,
      logLevel: 'debug',
      ...config.kernel
    }
  };

  return quickBootstrap(devConfig);
}

/**
 * Create production bootstrap with optimization
 */
export async function createProdBootstrap(
  config: ZenithBootstrapConfig = {}
): Promise<ZenithBootstrapResult> {
  const prodConfig: ZenithBootstrapConfig = {
    ...config,
    development: {
      enableDevtools: false,
      enableHMR: false,
      enableSourceMaps: false,
      mockServices: false,
      ...config.development
    },
    performance: {
      enableCompression: true,
      enableServiceWorker: true,
      enablePreloading: true,
      chunkStrategy: 'route',
      ...config.performance
    },
    kernel: {
      enableDiagnostics: false,
      enableHotReload: false,
      logLevel: 'warn',
      ...config.kernel
    }
  };

  return quickBootstrap(prodConfig);
}

export default ZenithBootstrap;
