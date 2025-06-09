/**
 * ZenithApp
 * 
 * The primary interface for interacting with the ZenithKernel.
 * Provides simplified access to core functionality while
 * hiding implementation details.
 */

import type { ZenithKernel } from '@zenithkernel/core/core/ZenithKernel';
import { AppManager } from './AppManager';
import type { RouteDefinition } from '@zenithkernel/core/modules/Routing/types';
import type { HydrationStrategy } from '@zenithkernel/core/modules/Rendering/types';

/**
 * ZenithApp Configuration Options
 */
export interface ZenithAppOptions {
  /**
   * Debug mode enables additional logging and development features
   */
  debug?: boolean;
  
  /**
   * Default hydration strategy for components
   */
  defaultHydrationStrategy?: HydrationStrategy;
  
  /**
   * Auto-start the app when instantiated
   */
  autoStart?: boolean;
}

/**
 * ZenithApp class provides a simplified developer interface 
 * to the ZenithKernel system
 */
export class ZenithApp {
  private zenith: ZenithKernel;
  private appManager: AppManager;
  private options: ZenithAppOptions;
  private isRunning: boolean = false;
  
  /**
   * Create a new ZenithApp instance
   */
  constructor(zenithInstance: ZenithKernel, options: ZenithAppOptions = {}) {
    this.zenith = zenithInstance;
    this.options = {
      debug: false,
      defaultHydrationStrategy: 'visible',
      autoStart: true,
      ...options
    };
    
    this.appManager = new AppManager(zenithInstance.getECS());
    
    // Set as global instance if needed
    if (this.options.autoStart) {
      this.start();
    }
  }
  
  /**
   * Get the AppManager instance
   */
  getAppManager(): AppManager {
    return this.appManager;
  }
  
  /**
   * Register a component with the app
   */
  registerComponent(componentType: any, componentName: string): void {
    this.appManager.registerComponent(componentType, componentName);
  }
  
  /**
   * Register a system with the app
   */
  registerSystem(systemType: any, systemName: string): void {
    this.zenith.getSystemManager().registerSystem(systemType, systemName);
    
    if (this.options.debug) {
      console.log(`[ZenithApp] Registered system: ${systemName}`);
    }
  }
  
  /**
   * Add a route to the application
   */
  addRoute(path: string, routeDefinition: RouteDefinition<any, any>): void {
    this.zenith.getRouter().addRoute(path, routeDefinition);
    
    if (this.options.debug) {
      console.log(`[ZenithApp] Added route: ${path}`);
    }
  }
  
  /**
   * Start the application
   */
  start(): void {
    if (this.isRunning) {
      return;
    }
    
    // Start the kernel main loop
    this.zenith.start();
    this.isRunning = true;
    
    if (this.options.debug) {
      console.log('[ZenithApp] Started');
    }
  }
  
  /**
   * Stop the application
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    // Stop the kernel main loop
    this.zenith.stop();
    this.isRunning = false;
    
    if (this.options.debug) {
      console.log('[ZenithApp] Stopped');
    }
  }
  
  /**
   * Create a global instance of the app
   */
  static createGlobal(zenithInstance: ZenithKernel, options: ZenithAppOptions = {}): ZenithApp {
    const app = new ZenithApp(zenithInstance, options);
    (globalThis as any).__ZENITH_APP__ = app;
    return app;
  }
  
  /**
   * Get the global app instance if available
   */
  static getGlobal(): ZenithApp | null {
    return (globalThis as any).__ZENITH_APP__ || null;
  }
}
