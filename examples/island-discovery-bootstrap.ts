/**
 * Island Discovery and Bootstrap Integration
 * 
 * This module integrates the Vite plugin island discovery process
 * with the ZenithKernel bootstrap system, enabling automatic
 * registration and hydration of Hydra islands.
 */

import { IslandRegistration, IslandComponent } from '../src/modules/Rendering/types';
import { registerIsland, autoHydrateIslands } from '../src/lib/hydra-runtime';

// Island discovery integration
export interface DiscoveredIsland {
  name: string;
  path: string;
  hash: string;
  dependencies: string[];
  metadata: any;
  component?: IslandComponent;
}

export interface IslandDiscoveryConfig {
  /** Enable automatic discovery */
  autoDiscover: boolean;
  /** Directory patterns to scan */
  scanPatterns: string[];
  /** Enable hot reload in development */
  enableHMR: boolean;
  /** Registry endpoint for remote islands */
  registryEndpoint?: string;
  /** ZK verification requirement */
  requireZKVerification: boolean;
}

export class IslandDiscoveryBootstrap {
  private islands: Map<string, DiscoveredIsland> = new Map();
  private config: IslandDiscoveryConfig;
  private isInitialized = false;
  private hmrCleanupFunctions: (() => void)[] = [];

  constructor(config: Partial<IslandDiscoveryConfig> = {}) {
    this.config = {
      autoDiscover: true,
      scanPatterns: ['src/modules/Rendering/islands/**/*Island.{ts,tsx}'],
      enableHMR: true,
      requireZKVerification: false,
      ...config
    };
  }

  /**
   * Initialize the island discovery system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Island discovery already initialized');
      return;
    }

    console.log('🏝️ Initializing Island Discovery Bootstrap...');

    try {
      // Discover and register islands
      if (this.config.autoDiscover) {
        await this.discoverIslands();
      }

      // Register discovered islands with the Hydra runtime
      await this.registerDiscoveredIslands();

      // Setup HMR if in development
      if (this.config.enableHMR && import.meta.env?.DEV) {
        this.setupHMR();
      }

      // Auto-hydrate any islands already in the DOM
      await autoHydrateIslands();

      this.isInitialized = true;
      console.log(`✅ Island discovery initialized with ${this.islands.size} islands`);
    } catch (error) {
      console.error('❌ Failed to initialize island discovery:', error);
      throw error;
    }
  }

  /**
   * Discover islands from various sources
   */
  private async discoverIslands(): Promise<void> {
    // 1. Discover from Vite plugin registry (if available)
    await this.discoverFromViteRegistry();
    
    // 2. Discover from static imports
    await this.discoverFromStaticImports();
    
    // 3. Discover from remote registry (if configured)
    if (this.config.registryEndpoint) {
      await this.discoverFromRemoteRegistry();
    }
    
    // 4. Discover from DOM attributes
    await this.discoverFromDOM();
  }

  /**
   * Discover islands from Vite plugin generated registry
   */
  private async discoverFromViteRegistry(): Promise<void> {
    try {
      // Try to load the auto-generated island registry
      const registryModule = await import('/dist/hydra/island-registry.js').catch(() => null);
      
      if (registryModule?.ISLANDS) {
        console.log('📋 Loading islands from Vite registry...');
        
        Object.entries(registryModule.ISLANDS).forEach(([name, island]: [string, any]) => {
          this.islands.set(name, {
            name,
            path: island.path || '',
            hash: island.hash || '',
            dependencies: island.dependencies || [],
            metadata: island.metadata || {},
            component: island.component
          });
        });
        
        console.log(`🎯 Loaded ${Object.keys(registryModule.ISLANDS).length} islands from Vite registry`);
      }
    } catch (error) {
      console.warn('Could not load Vite island registry:', error);
    }
  }

  /**
   * Discover islands from static imports (fallback)
   */
  private async discoverFromStaticImports(): Promise<void> {
    const knownIslands = [
      'ECSCounterIsland',
      'QuantumStatusIsland', 
      'HydraRegistryIsland',
      'HydraTrustBarIsland',
      'HydraDashboardIsland'
    ];

    for (const islandName of knownIslands) {
      if (this.islands.has(islandName)) continue; // Skip if already discovered

      try {
        // Try to dynamically import the island
        const modulePath = `../src/modules/Rendering/islands/${islandName}`;
        const islandModule = await import(modulePath).catch(() => null);
        
        if (islandModule?.default || islandModule?.[islandName]) {
          const component = islandModule.default || islandModule[islandName];
          const metadata = islandModule.metadata || {};
          
          this.islands.set(islandName, {
            name: islandName,
            path: modulePath,
            hash: this.generateHash(islandName),
            dependencies: metadata.dependencies || [],
            metadata,
            component
          });
          
          console.log(`📦 Loaded ${islandName} from static import`);
        }
      } catch (error) {
        console.warn(`Could not load island ${islandName}:`, error);
      }
    }
  }

  /**
   * Discover islands from remote registry
   */
  private async discoverFromRemoteRegistry(): Promise<void> {
    if (!this.config.registryEndpoint) return;

    try {
      console.log(`🌐 Fetching islands from remote registry: ${this.config.registryEndpoint}`);
      
      const response = await fetch(`${this.config.registryEndpoint}/api/hydra/islands`);
      const data = await response.json();
      
      if (data.islands && Array.isArray(data.islands)) {
        for (const remoteIsland of data.islands) {
          // Only add if not already discovered locally
          if (!this.islands.has(remoteIsland.name)) {
            this.islands.set(remoteIsland.name, {
              name: remoteIsland.name,
              path: remoteIsland.path || '',
              hash: remoteIsland.hash || '',
              dependencies: remoteIsland.dependencies || [],
              metadata: remoteIsland.metadata || {},
              // Remote component will be loaded dynamically when needed
            });
          }
        }
        
        console.log(`🌍 Discovered ${data.islands.length} remote islands`);
      }
    } catch (error) {
      console.error('Failed to fetch from remote registry:', error);
    }
  }

  /**
   * Discover islands from DOM data attributes
   */
  private async discoverFromDOM(): Promise<void> {
    const islandElements = document.querySelectorAll('[data-zk-island]');
    
    islandElements.forEach(element => {
      const islandName = element.getAttribute('data-zk-island');
      if (!islandName || this.islands.has(islandName)) return;

      // Create a minimal island entry for DOM-discovered islands
      this.islands.set(islandName, {
        name: islandName,
        path: '', // Will be resolved later
        hash: this.generateHash(islandName),
        dependencies: [],
        metadata: {
          discoveredFrom: 'dom',
          element: element
        }
      });
      
      console.log(`🔍 Discovered ${islandName} from DOM`);
    });
  }

  /**
   * Register all discovered islands with the Hydra runtime
   */
  private async registerDiscoveredIslands(): Promise<void> {
    for (const [name, island] of this.islands) {
      try {
        await this.registerSingleIsland(island);
      } catch (error) {
        console.error(`Failed to register island ${name}:`, error);
      }
    }
  }

  /**
   * Register a single island with the runtime
   */
  private async registerSingleIsland(island: DiscoveredIsland): Promise<void> {
    const registration: IslandRegistration = {
      name: island.name,
      component: island.component || await this.loadIslandComponent(island),
      trustLevel: island.metadata.trustLevel || 'unverified',
      execType: island.metadata.execType || 'local',
      ecsComponents: island.metadata.ecsComponents || [],
      zkRequirement: this.config.requireZKVerification || island.metadata.zkRequirement || false
    };

    registerIsland(registration);
    console.log(`✅ Registered island: ${island.name}`);
  }

  /**
   * Dynamically load an island component
   */
  private async loadIslandComponent(island: DiscoveredIsland): Promise<IslandComponent> {
    if (island.component) {
      return island.component;
    }

    // Try various loading strategies
    const loadingStrategies = [
      () => this.loadFromPath(island.path),
      () => this.loadFromConvention(island.name),
      () => this.loadFromRemote(island),
      () => this.createPlaceholderComponent(island.name)
    ];

    for (const strategy of loadingStrategies) {
      try {
        const component = await strategy();
        if (component) return component;
      } catch (error) {
        console.warn(`Loading strategy failed for ${island.name}:`, error);
      }
    }

    throw new Error(`Could not load component for island: ${island.name}`);
  }

  /**
   * Load component from explicit path
   */
  private async loadFromPath(path: string): Promise<IslandComponent | null> {
    if (!path) return null;

    const module = await import(path);
    return module.default || module[Object.keys(module).find(key => key.includes('Island')) || ''];
  }

  /**
   * Load component using naming convention
   */
  private async loadFromConvention(name: string): Promise<IslandComponent | null> {
    const possiblePaths = [
      `../src/modules/Rendering/islands/${name}`,
      `../src/modules/Rendering/islands/${name}.tsx`,
      `../src/modules/Rendering/islands/${name}/${name}.tsx`,
      `../src/components/hydra/${name}`,
      `../examples/${name.toLowerCase().replace('island', '')}`
    ];

    for (const path of possiblePaths) {
      try {
        const module = await import(path);
        const component = module.default || module[name];
        if (component) return component;
      } catch {
        // Continue to next path
      }
    }

    return null;
  }

  /**
   * Load component from remote source
   */
  private async loadFromRemote(island: DiscoveredIsland): Promise<IslandComponent | null> {
    if (!this.config.registryEndpoint) return null;

    try {
      const response = await fetch(`${this.config.registryEndpoint}/api/hydra/islands/${island.name}/component`);
      if (!response.ok) return null;

      const componentCode = await response.text();
      
      // Create a blob URL and import the component
      const blob = new Blob([componentCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      
      const module = await import(blobUrl);
      URL.revokeObjectURL(blobUrl);
      
      return module.default || module[island.name];
    } catch (error) {
      console.warn(`Failed to load remote component for ${island.name}:`, error);
      return null;
    }
  }

  /**
   * Create a placeholder component for missing islands
   */
  private createPlaceholderComponent(name: string): IslandComponent {
    return {
      mount: async (element: HTMLElement) => {
        element.innerHTML = `
          <div class="island-placeholder" style="
            padding: 20px;
            border: 2px dashed #ccc;
            border-radius: 8px;
            text-align: center;
            color: #666;
          ">
            <h3>🏝️ ${name}</h3>
            <p>Island component not found</p>
            <small>Check your island registry and imports</small>
          </div>
        `;
        
        return () => {
          element.innerHTML = '';
        };
      }
    };
  }

  /**
   * Setup Hot Module Replacement for development
   */
  private setupHMR(): void {
    if (!import.meta.hot) return;

    console.log('🔄 Setting up island HMR...');

    // Listen for custom island updates from Vite plugin
    const hmrHandler = (data: any) => {
      console.log('🌊 HMR: Island updated:', data.islandPath);
      this.handleIslandHMR(data);
    };

    import.meta.hot.on('hydra:island-updated', hmrHandler);
    
    // Cleanup function
    this.hmrCleanupFunctions.push(() => {
      import.meta.hot?.off('hydra:island-updated', hmrHandler);
    });

    // Listen for Vite's built-in updates
    import.meta.hot.on('vite:beforeUpdate', () => {
      console.log('🔄 Vite update detected, preparing island refresh...');
    });
  }

  /**
   * Handle HMR updates for islands
   */
  private async handleIslandHMR(data: any): Promise<void> {
    const islandName = this.extractIslandNameFromPath(data.islandPath);
    if (!islandName) return;

    try {
      // Re-discover and reload the specific island
      await this.reloadIsland(islandName);
      
      // Re-hydrate any instances of this island in the DOM
      await this.rehydrateIslandInstances(islandName);
      
      console.log(`✅ HMR: Reloaded ${islandName}`);
    } catch (error) {
      console.error(`❌ HMR: Failed to reload ${islandName}:`, error);
    }
  }

  /**
   * Reload a specific island
   */
  private async reloadIsland(islandName: string): Promise<void> {
    const island = this.islands.get(islandName);
    if (!island) return;

    // Reload the component
    const newComponent = await this.loadIslandComponent(island);
    
    // Update the island registration
    island.component = newComponent;
    await this.registerSingleIsland(island);
  }

  /**
   * Re-hydrate all instances of an island in the DOM
   */
  private async rehydrateIslandInstances(islandName: string): Promise<void> {
    const instances = document.querySelectorAll(`[data-hydra-island="${islandName}"]`);
    
    for (const instance of instances) {
      const elementId = instance.id;
      if (elementId) {
        try {
          // Trigger re-hydration
          const event = new CustomEvent('hydra:reload', { 
            detail: { islandName, elementId } 
          });
          instance.dispatchEvent(event);
        } catch (error) {
          console.warn(`Failed to re-hydrate ${elementId}:`, error);
        }
      }
    }
  }

  /**
   * Extract island name from file path
   */
  private extractIslandNameFromPath(path: string): string | null {
    const match = path.match(/([^/]+)Island\.(ts|tsx)$/);
    return match ? match[1] + 'Island' : null;
  }

  /**
   * Generate a simple hash for an island
   */
  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get all discovered islands
   */
  getDiscoveredIslands(): DiscoveredIsland[] {
    return Array.from(this.islands.values());
  }

  /**
   * Get a specific island by name
   */
  getIsland(name: string): DiscoveredIsland | undefined {
    return this.islands.get(name);
  }

  /**
   * Check if an island is registered
   */
  hasIsland(name: string): boolean {
    return this.islands.has(name);
  }

  /**
   * Manually register an island
   */
  async addIsland(island: DiscoveredIsland): Promise<void> {
    this.islands.set(island.name, island);
    await this.registerSingleIsland(island);
  }

  /**
   * Remove an island
   */
  removeIsland(name: string): boolean {
    return this.islands.delete(name);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Run HMR cleanup functions
    this.hmrCleanupFunctions.forEach(cleanup => cleanup());
    this.hmrCleanupFunctions = [];
    
    // Clear islands
    this.islands.clear();
    
    this.isInitialized = false;
    console.log('🧹 Island discovery cleanup completed');
  }
}

// Default singleton instance
export const islandDiscovery = new IslandDiscoveryBootstrap();

/**
 * Bootstrap integration function
 * Call this during ZenithKernel initialization
 */
export async function bootstrapIslandDiscovery(config?: Partial<IslandDiscoveryConfig>): Promise<void> {
  if (config) {
    // Create new instance with custom config
    const discovery = new IslandDiscoveryBootstrap(config);
    await discovery.initialize();
  } else {
    // Use default singleton
    await islandDiscovery.initialize();
  }
}

/**
 * Integration with ZenithKernel bootstrap
 */
export function integrateWithKernel(): void {
  // Add to window for global access
  (window as any).__ISLAND_DISCOVERY__ = islandDiscovery;
  
  // Listen for kernel events
  document.addEventListener('zenith:kernel:initialized', () => {
    console.log('🌊 Kernel initialized, starting island discovery...');
    bootstrapIslandDiscovery().catch(console.error);
  });
  
  document.addEventListener('zenith:kernel:shutdown', () => {
    console.log('🌊 Kernel shutdown, cleaning up island discovery...');
    islandDiscovery.cleanup();
  });
}

// Auto-integrate if in browser
if (typeof window !== 'undefined') {
  integrateWithKernel();
}

export default IslandDiscoveryBootstrap;
