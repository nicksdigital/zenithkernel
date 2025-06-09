/**
 * SystemMeta Interface
 * Defines metadata structure for registered systems in ZenithKernel
 */

export interface SystemMeta {
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
