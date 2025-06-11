/**
 * Registry Metadata Interface
 * Defines the structure for entity registry metadata
 */

export interface IRegistryMeta {
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

/**
 * RegistryMeta class implementation
 */
export class RegistryMeta implements IRegistryMeta {
  public id: string;
  public type: 'hydra' | 'component' | 'system' | 'asset' | 'other';
  public name: string;
  public description?: string;
  public version?: string;
  public registeredAt: Date;
  public metadata?: { [key: string]: any };

  constructor(
    id: string,
    type: 'hydra' | 'component' | 'system' | 'asset' | 'other',
    name: string,
    options: Partial<IRegistryMeta> = {}
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = options.description;
    this.version = options.version || '1.0.0';
    this.registeredAt = options.registeredAt || new Date();
    this.metadata = options.metadata || {};
  }
}
