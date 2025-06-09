/**
 * Core types and interfaces for ZenithKernel Islands Architecture
 */

/**
 * Context provided to hydrated islands
 */
export interface HydraContext {
  /**
   * Environment the island is running in
   */
  env: 'client' | 'server' | 'edge';
  
  /**
   * Access to ECS entities and components when applicable
   */
  ecs?: {
    entityId?: number;
    registry?: any;
    components?: Record<string, any>;
  };
  
  /**
   * Strategy for hydration
   */
  strategy?: string;
  
  /**
   * Trust level for the component
   */
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
  
  /**
   * Additional context data
   */
  [key: string]: any;
}

/**
 * Base interface for all island components
 */
export interface IslandComponent {
  /**
   * Mount function called when the island is hydrated
   * @param element - The DOM element to mount the island into
   * @param props - Props passed to the island
   * @param context - ZenithKernel Hydra context
   */
  mount: (element: HTMLElement, props: any, context?: HydraContext) => void | Promise<void>;

  /**
   * Optional unmount function for cleanup
   * @param element - The DOM element to unmount
   */
  unmount?: (element: HTMLElement) => void;

  /**
   * Optional view function for SSR/initial structure
   * @param props - Props for the component
   * @returns DOM element representing the initial structure
   */
  view?: (props: any) => HTMLElement | DocumentFragment;
}

/**
 * Island metadata for registration and discovery
 */
export interface IslandMetadata {
  /** Unique name for the island */
  name: string;
  /** Islands that this island depends on */
  dependencies?: string[];
  /** ZKP verification requirements */
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
  /** ECS components this island interacts with */
  ecsComponents?: string[];
  /** Execution environment preference */
  execType?: 'local' | 'remote' | 'edge';
}

/**
 * Island registration entry
 */
export interface IslandRegistration extends IslandMetadata {
  /** The island component module */
  component: IslandComponent;
  /** Module path for dynamic loading */
  modulePath?: string;
}

/**
 * Hydration strategy for when to load/hydrate islands
 */
export type HydrationStrategy = 
  | 'immediate'      // Hydrate immediately on page load
  | 'visible'        // Hydrate when island becomes visible (Intersection Observer)
  | 'interaction'    // Hydrate on first user interaction
  | 'idle'          // Hydrate when browser is idle
  | 'manual';       // Hydrate manually via API call

/**
 * Island configuration for discovery and hydration
 */
export interface IslandConfig {
  /** Island component name */
  island: string;
  /** Props to pass to the island */
  props?: Record<string, any>;
  /** Hydration strategy */
  strategy?: HydrationStrategy;
  /** ZenithKernel Hydra context */
  context?: HydraContext;
  /** Custom hydration trigger selector */
  trigger?: string;
}

/**
 * Island discovery data attributes
 */
export interface IslandDataAttributes {
  /** data-zk-island: Island component name */
  'data-zk-island': string;
  /** data-zk-props: JSON-encoded props */
  'data-zk-props'?: string;
  /** data-zk-strategy: Hydration strategy */
  'data-zk-strategy'?: HydrationStrategy;
  /** data-zk-context: JSON-encoded Hydra context */
  'data-zk-context'?: string;
  /** data-hydra-state: Hydration status */
  'data-hydra-state'?: 'hydrated' | 'loading' | 'error';
}

/**
 * Event types for island lifecycle
 */
export interface IslandEvents {
  'island:discovered': { element: HTMLElement; config: IslandConfig };
  'island:loading': { element: HTMLElement; name: string };
  'island:hydrated': { element: HTMLElement; name: string };
  'island:error': { element: HTMLElement; name: string; error: Error };
  'island:unmounted': { element: HTMLElement; name: string };
}

/**
 * Island loader module interface
 */
export interface IslandLoader {
  /** Discover islands in the DOM */
  discoverIslands(): HTMLElement[];
  
  /** Hydrate a specific island */
  hydrateIsland(element: HTMLElement, config: IslandConfig): Promise<void>;
  
  /** Register an island component */
  registerIsland(registration: IslandRegistration): void;
  
  /** Unregister an island component */
  unregisterIsland(name: string): void;
  
  /** Get registered island */
  getIsland(name: string): IslandRegistration | undefined;
  
  /** Cleanup and unmount all islands */
  cleanup(): void;
}

/**
 * Props interface for island components that use ECS
 */
export interface ECSIslandProps {
  /** Entity ID to bind to */
  entityId?: string;
  /** Component types to observe */
  components?: string[];
  /** Auto-create entity if not found */
  autoCreate?: boolean;
}

/**
 * Props interface for island components that use Hydra events
 */
export interface HydraEventIslandProps {
  /** Event types to listen for */
  events?: string[];
  /** Connection configuration */
  connection?: {
    url?: string;
    autoReconnect?: boolean;
  };
}

/**
 * Definition of a Hydra component including implementation and metadata
 */
export interface HydraComponentDefinition {
  /**
   * The component implementation
   */
  component: IslandComponent;
  
  /**
   * Metadata for the component
   */
  metadata?: IslandMetadata;
  
  /**
   * Path to the module if loading dynamically
   */
  modulePath?: string;
  
  /**
   * Whether the component is preloaded
   */
  preloaded?: boolean;
}
