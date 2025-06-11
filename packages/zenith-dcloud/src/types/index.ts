/**
 * Types for ZenithCore DCloud
 */

export interface DCloudFile {
  hash: string;
  name: string;
  size: number;
  type: string;
  created: Date;
  metadata?: Record<string, any>;
}

export interface DCloudWebsite {
  hash: string;
  url: string;
  domain?: string;
  ssl: boolean;
  files: string[];
}

export interface DCloudPeer {
  id: string;
  address: string;
  online: boolean;
  lastSeen: Date;
}

export type DCloudEvent = 
  | { type: 'connected'; nodeId: string }
  | { type: 'disconnected' }
  | { type: 'file:stored'; hash: string }
  | { type: 'file:retrieved'; hash: string }
  | { type: 'website:deployed'; hash: string; url: string }
  | { type: 'error'; error: Error };
