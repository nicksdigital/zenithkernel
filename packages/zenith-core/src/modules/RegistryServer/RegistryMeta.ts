/**
 * Registry Metadata Interface
 * Defines the structure for entity registry metadata
 */

export interface RegistryMeta {
  /**
   * Unique identifier for the registry entry
   */
  id: string;
  
  /**
   * Type of registry entry (e.g., 'hydra', 'component', 'system')
   */
  type: 'hydra' | 'component' | 'system' | 'asset' | 'other';

  /**
   * Name of the entry
   */
  name: string;

  /**
   * Description of the registry entry
   */
  description?: string;

  /**
   * Version information
   */
  version?: string;

  /**
   * When the entry was registered
   */
  registeredAt: Date;

  /**
   * Additional metadata specific to the entry type
   */
  metadata?: {
    [key: string]: any;
  };
}
