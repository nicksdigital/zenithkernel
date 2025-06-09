/**
 * Hydra Status Component - ECS component for Hydra runtime status
 * Used by Hydra Status Island for monitoring Hydra instances
 */

export class HydraStatusComponent {
  hydraId: string;
  status: 'loading' | 'active' | 'inactive' | 'error';
  loadTime: number;
  lastActivity: number;
  errorMessage?: string;
  execType: 'local' | 'remote' | 'edge';
  trustLevel: number;
  
  constructor(
    hydraId: string,
    status: 'loading' | 'active' | 'inactive' | 'error' = 'loading',
    execType: 'local' | 'remote' | 'edge' = 'local',
    trustLevel: number = 100
  ) {
    this.hydraId = hydraId;
    this.status = status;
    this.execType = execType;
    this.trustLevel = trustLevel;
    this.loadTime = Date.now();
    this.lastActivity = Date.now();
  }
  
  /**
   * Update the status of the Hydra instance
   */
  setStatus(status: 'loading' | 'active' | 'inactive' | 'error', errorMessage?: string): void {
    this.status = status;
    this.lastActivity = Date.now();
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
  }
  
  /**
   * Mark activity for the Hydra instance
   */
  markActivity(): void {
    this.lastActivity = Date.now();
  }
  
  /**
   * Get the uptime of the Hydra instance in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.loadTime;
  }
  
  /**
   * Get time since last activity in milliseconds
   */
  getTimeSinceActivity(): number {
    return Date.now() - this.lastActivity;
  }
}

/**
 * Hydra Registry Component - ECS component for Hydra registry management
 * Used by Hydra Registry Island for tracking registered Hydras
 */
export class HydraRegistryComponent {
  registeredHydras: Map<string, HydraRegistryEntry>;
  totalCount: number;
  activeCount: number;
  lastUpdated: number;
  
  constructor() {
    this.registeredHydras = new Map();
    this.totalCount = 0;
    this.activeCount = 0;
    this.lastUpdated = Date.now();
  }
  
  /**
   * Register a new Hydra instance
   */
  registerHydra(hydraId: string, entry: HydraRegistryEntry): void {
    this.registeredHydras.set(hydraId, entry);
    this.totalCount = this.registeredHydras.size;
    this.updateActiveCounts();
    this.lastUpdated = Date.now();
  }
  
  /**
   * Unregister a Hydra instance
   */
  unregisterHydra(hydraId: string): boolean {
    const removed = this.registeredHydras.delete(hydraId);
    if (removed) {
      this.totalCount = this.registeredHydras.size;
      this.updateActiveCounts();
      this.lastUpdated = Date.now();
    }
    return removed;
  }
  
  /**
   * Get all registered Hydras
   */
  getAllHydras(): HydraRegistryEntry[] {
    return Array.from(this.registeredHydras.values());
  }
  
  /**
   * Get active Hydras only
   */
  getActiveHydras(): HydraRegistryEntry[] {
    return this.getAllHydras().filter(hydra => hydra.status === 'active');
  }
  
  /**
   * Update the count of active Hydras
   */
  private updateActiveCounts(): void {
    this.activeCount = this.getActiveHydras().length;
  }
}

/**
 * Registry entry for a Hydra instance
 */
export interface HydraRegistryEntry {
  hydraId: string;
  peerId: string;
  execType: 'local' | 'remote' | 'edge';
  entry: string;
  status: 'loading' | 'active' | 'inactive' | 'error';
  registeredAt: number;
  lastSeen: number;
  trustLevel: number;
  zkProof?: string;
}
