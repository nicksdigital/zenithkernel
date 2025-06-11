/**
 * @zenithcore/dcloud - Decentralized Cloud Infrastructure
 * 
 * Enterprise-grade decentralized storage, websites, and cloud services
 * built on IPFS and distributed technologies for ZenithKernel.
 */

// Core DCloud functionality
export { DCloudClient } from './core/DCloudClient';
export { DCloudNode } from './core/DCloudNode';
export { DCloudNetwork } from './core/DCloudNetwork';

// IPFS integration
export * from './ipfs';

// Storage services
export * from './storage';

// Decentralized websites
export * from './websites';

// Enterprise features
export * from './enterprise';

// Utilities and helpers
export * from './utils';

// Types and interfaces
export * from './types';

/**
 * DCloud Version
 */
export const VERSION = '0.1.0';

/**
 * DCloud Package Name
 */
export const PACKAGE_NAME = '@zenithcore/dcloud';

/**
 * Default DCloud Configuration
 */
export const DEFAULT_CONFIG = {
  ipfs: {
    repo: './ipfs-repo',
    config: {
      Addresses: {
        Swarm: [
          '/ip4/0.0.0.0/tcp/4001',
          '/ip4/127.0.0.1/tcp/4001/ws'
        ],
        API: '/ip4/127.0.0.1/tcp/5001',
        Gateway: '/ip4/127.0.0.1/tcp/8080'
      },
      Discovery: {
        MDNS: {
          Enabled: true,
          Interval: 10
        },
        webRTCStar: {
          Enabled: true
        }
      }
    }
  },
  storage: {
    encryption: true,
    compression: true,
    replication: 3,
    pinning: true
  },
  enterprise: {
    authentication: true,
    authorization: true,
    audit: true,
    backup: true
  },
  websites: {
    caching: true,
    cdn: true,
    ssl: true,
    customDomains: true
  }
} as const;

/**
 * Initialize DCloud with configuration
 */
export async function initializeDCloud(config: Partial<typeof DEFAULT_CONFIG> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  console.log('🌐 Initializing ZenithCore DCloud...');
  console.log('📦 Version:', VERSION);
  console.log('⚙️ Configuration:', mergedConfig);
  
  // Future: Initialize IPFS node, storage, and enterprise features
  return {
    config: mergedConfig,
    version: VERSION,
    packageName: PACKAGE_NAME
  };
}
