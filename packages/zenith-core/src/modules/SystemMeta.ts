/**
 * SystemMeta Interface
 * Defines metadata structure for registered systems in ZenithKernel
 */

export interface ISystemMeta {
  /**
   * Unique identifier for the system
   */
  id: string;

  /**
   * Display name of the system
   */
  name: string;

  /**
   * System description
   */
  description: string;

  /**
   * Type of system (e.g., 'core', 'rendering', 'physics', 'input', etc.)
   */
  type: string;

  /**
   * System priority for execution order (lower numbers execute first)
   */
  priority: number;

  /**
   * Whether the system is enabled by default
   */
  enabled: boolean;

  /**
   * Dependencies on other systems
   */
  dependencies?: string[];

  /**
   * Additional configuration options
   */
  config?: Record<string, any>;

  /**
   * Version information
   */
  version?: string;
}

/**
 * SystemMeta class implementation
 */
export class SystemMeta implements ISystemMeta {
  public id: string;
  public name: string;
  public description: string;
  public type: string;
  public priority: number;
  public enabled: boolean;
  public dependencies?: string[];
  public config?: Record<string, any>;
  public version?: string;

  constructor(
    name: string,
    tags: string[] = [],
    version: string = "0.1.0",
    options: Partial<ISystemMeta> = {}
  ) {
    this.id = options.id || name.toLowerCase().replace(/\s+/g, '-');
    this.name = name;
    this.description = options.description || `System: ${name}`;
    this.type = options.type || 'custom';
    this.priority = options.priority || 100;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.dependencies = options.dependencies || [];
    this.config = options.config || { tags };
    this.version = version;
  }
}
