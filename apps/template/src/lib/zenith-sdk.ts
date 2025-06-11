/**
 * Mock implementation of @zenithcore/sdk for template testing
 */

import { ZenithKernel } from './zenith-core';

export interface ZenithAppConfig {
  name?: string;
  version?: string;
  features?: string[];
  kernel?: any;
}

export class ZenithApp {
  private kernel: ZenithKernel;
  private config: ZenithAppConfig;
  
  constructor(config: ZenithAppConfig = {}) {
    this.config = {
      name: 'ZenithApp',
      version: '1.0.0',
      features: ['signals', 'stores'],
      ...config
    };
    
    this.kernel = config.kernel || new ZenithKernel();
  }
  
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.config.name} v${this.config.version}`);
    console.log('Features:', this.config.features);
    
    // Mock initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.kernel.start();
  }
  
  getKernel(): ZenithKernel {
    return this.kernel;
  }
  
  mount(element: string | HTMLElement): void {
    const target = typeof element === 'string' 
      ? document.querySelector(element)
      : element;
      
    if (!target) {
      throw new Error('Mount target not found');
    }
    
    console.log('App mounted to:', target);
  }
}

// Utility functions
export function createApp(config?: ZenithAppConfig): ZenithApp {
  return new ZenithApp(config);
}

export function defineConfig(config: ZenithAppConfig): ZenithAppConfig {
  return config;
}
