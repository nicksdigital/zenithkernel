/**
 * ZenithKernel Template Parser - Enhanced template parsing with ZK and ECS directives
 * 
 * Extends Archipelago's TemplateParser with ZenithKernel-specific features:
 * - zk-* directives for zero-knowledge proof verification
 * - ecs-* directives for Entity Component System binding
 * - hydration-* directives for advanced hydration strategies
 * - data-zk-* attributes for island discovery
 * - Compatible with Vue.js-style directives (v-if, v-for, :bindings)
 */

import type { HydraContext } from '@zenithkernel/runtime/hydra';

/**
 * ZenithKernel-specific directive types
 */
export interface ZKDirectives {
  /** ZK proof verification requirement */
  zkProof?: string;
  /** Trust level requirement */
  zkTrust?: 'unverified' | 'local' | 'community' | 'verified';
  /** Entity binding for ZK context */
  zkEntity?: string;
  /** ZK verification strategy */
  zkStrategy?: 'eager' | 'lazy' | 'manual';
  /** Validation errors */
  errors?: string[];
}

export interface ECSBindings {
  /** Entity ID to bind to */
  ecsEntity?: string;
  /** Component types to observe */
  ecsComponents?: string[];
  /** Auto-create entity if not found */
  ecsAutoCreate?: boolean;
  /** Update strategy */
  ecsUpdateStrategy?: 'reactive' | 'polling' | 'manual';
}

export interface HydrationConfig {
  /** Hydration strategy */
  strategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
  /** Priority level */
  priority?: 'high' | 'normal' | 'low';
  /** Lazy loading threshold */
  lazy?: boolean;
  /** Custom trigger selector */
  trigger?: string;
  /** Debounce delay for interaction triggers */
  debounce?: number;
}

/**
 * Enhanced parsed template structure for ZenithKernel
 */
export interface ZenithParsedTemplate {
  componentName: string;
  attributes: Record<string, string>;
  slots: Record<string, string>;
  expressions: string[];
  content?: string; // Inner text content of the element
  directives?: {
    vIf?: string;
    vFor?: { item: string; iterable: string };
    bindings?: Record<string, string>;
  };
  zkDirectives?: ZKDirectives;
  ecsBindings?: ECSBindings;
  hydrationConfig?: HydrationConfig;
  errors?: string[];
}

/**
 * Template parser options for ZenithKernel
 */
export interface ZenithTemplateParserOptions {
  /** Enable ZK directive parsing */
  enableZKDirectives?: boolean;
  /** Enable ECS directive parsing */
  enableECSDirectives?: boolean;
  /** Enable hydration directive parsing */
  enableHydrationDirectives?: boolean;
  /** Strict mode for directive validation */
  strict?: boolean;
  /** Custom directive handlers */
  customDirectives?: Record<string, (value: string) => any>;
}

/**
 * Enhanced Template Parser for ZenithKernel
 * Extends Archipelago's TemplateParser with ZK, ECS, and hydration support
 */
export class ZenithTemplateParser {
  private options: ZenithTemplateParserOptions;

  constructor(options: ZenithTemplateParserOptions = {}) {
    this.options = {
      enableZKDirectives: true,
      enableECSDirectives: true,
      enableHydrationDirectives: true,
      strict: false,
      ...options
    };
  }

  /**
   * Parse a template string into ZenithParsedTemplate
   */
  parse(template: string): ZenithParsedTemplate {
    const errors: string[] = [];
    let componentName = '';
    let attributes = {};
    let slots = {};
    let expressions: string[] = [];
    let content = '';
    let directives;
    let zkDirectives;
    let ecsBindings;
    let hydrationConfig;

    try {
      // Basic parsing (from Archipelago TemplateParser)
      componentName = this.extractComponentName(template) || '';
      attributes = this.parseAttributes(template);
      slots = this.parseSlots(template);
      expressions = this.parseExpressions(template);
      directives = this.parseDirectives(attributes);

      // Extract inner content
      content = this.extractInnerContent(template);

      // ZenithKernel-specific parsing
      if (this.options.enableZKDirectives) {
        try {
          zkDirectives = this.parseZKDirectives(attributes);
        } catch (error) {
          errors.push(`ZK directive error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (this.options.strict) throw error;
        }
      }

      if (this.options.enableECSDirectives) {
        try {
          ecsBindings = this.parseECSBindings(attributes);
        } catch (error) {
          errors.push(`ECS directive error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (this.options.strict) throw error;
        }
      }

      if (this.options.enableHydrationDirectives) {
        try {
          hydrationConfig = this.parseHydrationConfig(attributes);
        } catch (error) {
          errors.push(`Hydration directive error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (this.options.strict) throw error;
        }
      }

      // Custom directive processing
      if (this.options.customDirectives) {
        try {
          this.processCustomDirectives(attributes, this.options.customDirectives);
        } catch (error) {
          errors.push(`Custom directive error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (this.options.strict) throw error;
        }
      }

    } catch (err: any) {
      const errorMsg = `Parsing failed: ${err.message}`;
      errors.push(errorMsg);
      
      if (this.options.strict) {
        throw new Error(errorMsg);
      }
    }

    return {
      componentName,
      attributes,
      slots,
      expressions,
      content,
      directives,
      zkDirectives,
      ecsBindings,
      hydrationConfig,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Extract component name from template (from Archipelago)
   */
  private extractComponentName(template: string): string | null {
    const match = template.match(/<([A-Z][a-zA-Z0-9]*)[\s>]/);
    return match ? match[1] : null;
  }

  /**
   * Parse attributes from template (enhanced from Archipelago)
   */
  private parseAttributes(template: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Enhanced regex to support data-zk-*, zk-*, ecs-*, hydration-* attributes
    const attributeRegex = /([a-zA-Z0-9_:@\-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let match;

    while ((match = attributeRegex.exec(template)) !== null) {
      const [, name, doubleQuoted, singleQuoted, unquoted] = match;
      const value = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
      attributes[name] = value;
    }

    return attributes;
  }

  /**
   * Parse slots from template (from Archipelago)
   */
  private parseSlots(template: string): Record<string, string> {
    const slots: Record<string, string> = {};
    const slotRegex = /<slot name="([^"]*)"[^>]*>([\s\S]*?)<\/slot>/g;
    let match;

    while ((match = slotRegex.exec(template)) !== null) {
      const [, name, content] = match;
      slots[name] = content.trim();
    }

    return slots;
  }

  /**
   * Extract inner content from template
   */
  private extractInnerContent(template: string): string {
    // Match the content between opening and closing tags
    const match = template.match(/^<[^>]*>([\s\S]*?)<\/[^>]*>$/);
    if (match) {
      return match[1].trim();
    }

    // Handle self-closing tags or plain text
    const selfClosingMatch = template.match(/^<[^>]*\/>$/);
    if (selfClosingMatch) {
      return '';
    }

    // Return the template as-is if it doesn't match expected patterns
    return template.trim();
  }

  /**
   * Parse expressions from template (from Archipelago)
   */
  private parseExpressions(template: string): string[] {
    const expressions: string[] = [];
    const expressionRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
    let match;

    while ((match = expressionRegex.exec(template)) !== null) {
      const [, expr] = match;
      expressions.push(expr.trim());
    }

    return expressions;
  }

  /**
   * Remove expression placeholders from content to avoid double-processing
   */
  private removeExpressionsFromContent(content: string): string {
    // Remove {{ }} expressions from content since they're processed separately
    return content.replace(/\{\{\s*[^}]+?\s*\}\}/g, '').trim();
  }

  /**
   * Parse Vue.js-style directives (from Archipelago)
   */
  private parseDirectives(attributes: Record<string, string>) {
    const directives: ZenithParsedTemplate['directives'] = {
      bindings: {},
    };

    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'v-if') {
        directives.vIf = value;
      } else if (key === 'v-for') {
        const match = value.match(/^([a-zA-Z0-9_$]+)\s+in\s+([a-zA-Z0-9_$.]+)$/);
        if (match) {
          const [, item, iterable] = match;
          directives.vFor = { item, iterable };
        } else {
          throw new Error(`Invalid v-for syntax: ${value}`);
        }
      } else if (key.startsWith(':')) {
        const bindingName = key.slice(1);
        directives.bindings![bindingName] = value;
      }
    }

    return directives;
  }

  /**
   * Parse ZK-specific directives
   */
  private parseZKDirectives(attributes: Record<string, string>): ZKDirectives {
    const zkDirectives: ZKDirectives = {
      errors: []
    };

    for (const [key, value] of Object.entries(attributes)) {
      try {
        if (key === 'zk-proof' || key === 'data-zk-proof') {
          if (!ZenithTemplateParser.validateZKProof(value)) {
            throw new Error(`Invalid zk-proof format: ${value}`);
          }
          zkDirectives.zkProof = value;
        } else if (key === 'zk-trust' || key === 'data-zk-trust') {
          if (!['unverified', 'local', 'community', 'verified'].includes(value)) {
            throw new Error(`Invalid zk-trust value: ${value}`);
          }
          zkDirectives.zkTrust = value as ZKDirectives['zkTrust'];
        } else if (key === 'zk-entity' || key === 'data-zk-entity') {
          if (!ZenithTemplateParser.validateEntityId(value)) {
            throw new Error(`Invalid zk-entity value: ${value}`);
          }
          zkDirectives.zkEntity = value;
        } else if (key === 'zk-strategy' || key === 'data-zk-strategy') {
          if (!['eager', 'lazy', 'manual'].includes(value)) {
            throw new Error(`Invalid zk-strategy value: ${value}`);
          }
          zkDirectives.zkStrategy = value as ZKDirectives['zkStrategy'];
        }
      } catch (error) {
        zkDirectives.errors!.push(error instanceof Error ? error.message : 'Unknown error');
        if (this.options.strict) {
          throw error;
        }
      }
    }

    return zkDirectives;
  }

  /**
   * Parse ECS-specific directives
   */
  private parseECSBindings(attributes: Record<string, string>): ECSBindings {
    const ecsBindings: ECSBindings = {};
    const errors: string[] = [];

    for (const [key, value] of Object.entries(attributes)) {
      try {
        if (key === 'ecs-entity' || key === 'data-ecs-entity') {
          ecsBindings.ecsEntity = value;
        } else if (key === 'ecs-components' || key === 'data-ecs-components') {
          // Parse as JSON array or comma-separated string
          try {
            ecsBindings.ecsComponents = JSON.parse(value);
          } catch {
            ecsBindings.ecsComponents = value.split(',').map(c => c.trim());
          }
        } else if (key === 'ecs-auto-create' || key === 'data-ecs-auto-create') {
          ecsBindings.ecsAutoCreate = value === 'true' || value === '';
        } else if (key === 'ecs-update-strategy' || key === 'data-ecs-update-strategy') {
          if (['reactive', 'polling', 'manual'].includes(value)) {
            ecsBindings.ecsUpdateStrategy = value as ECSBindings['ecsUpdateStrategy'];
          } else {
            throw new Error(`Invalid ecs-update-strategy value: ${value}`);
          }
        }
      } catch (error) {
        if (this.options.strict) {
          throw error;
        }
        errors.push(`ECS directive error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return ecsBindings;
  }

  /**
   * Parse hydration configuration directives
   */
  private parseHydrationConfig(attributes: Record<string, string>): HydrationConfig {
    const hydrationConfig: HydrationConfig & { errors?: string[] } = {
      errors: []
    };

    for (const [key, value] of Object.entries(attributes)) {
      try {
        if (key === 'hydration-strategy' || key === 'data-hydration-strategy' || key === 'data-zk-strategy') {
          if (['immediate', 'visible', 'interaction', 'idle', 'manual'].includes(value)) {
            hydrationConfig.strategy = value as HydrationConfig['strategy'];
          } else {
            throw new Error(`Invalid hydration strategy: ${value}`);
          }
        } else if (key === 'hydration-priority' || key === 'data-hydration-priority') {
          if (['high', 'normal', 'low'].includes(value)) {
            hydrationConfig.priority = value as HydrationConfig['priority'];
          } else {
            throw new Error(`Invalid hydration priority: ${value}`);
          }
        } else if (key === 'hydration-lazy' || key === 'data-hydration-lazy' || key === 'lazy') {
          hydrationConfig.lazy = value === 'true' || value === '';
        } else if (key === 'hydration-trigger' || key === 'data-hydration-trigger') {
          hydrationConfig.trigger = value;
        } else if (key === 'hydration-debounce' || key === 'data-hydration-debounce') {
          const debounce = parseInt(value, 10);
          if (!isNaN(debounce) && debounce >= 0) {
            hydrationConfig.debounce = debounce;
          } else {
            throw new Error(`Invalid hydration debounce value: ${value}`);
          }
        }
      } catch (error) {
        hydrationConfig.errors!.push(error instanceof Error ? error.message : 'Unknown error');
        if (this.options.strict) {
          throw error;
        }
      }
    }

    return hydrationConfig;
  }

  /**
   * Process custom directives
   */
  private processCustomDirectives(
    attributes: Record<string, string>,
    customDirectives: Record<string, (value: string) => any>
  ): void {
    for (const [key, value] of Object.entries(attributes)) {
      for (const [directiveName, handler] of Object.entries(customDirectives)) {
        if (key === directiveName || key === `data-${directiveName}`) {
          try {
            handler(value);
          } catch (error) {
            if (this.options.strict) {
              throw new Error(`Custom directive '${directiveName}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }
    }
  }

  /**
   * Validate ZK proof format
   */
  public static validateZKProof(proof: string): boolean {
    // Basic validation - in real implementation this would be more sophisticated
    return typeof proof === 'string' && proof.length > 0 && /^zk:[a-zA-Z0-9+/=_-]+$/.test(proof);
  }

  /**
   * Validate entity ID format
   */
  public static validateEntityId(entityId: string): boolean {
    // Basic validation for entity IDs
    return typeof entityId === 'string' && /^[a-zA-Z0-9_-]+$/.test(entityId);
  }

  /**
   * Create a HydraContext from parsed template data
   */
  public static createHydraContext(parsed: ZenithParsedTemplate, baseContext: Partial<HydraContext> = {}): HydraContext {
    const context: HydraContext = {
      peerId: baseContext.peerId || 'template-parser',
      ...baseContext
    };

    // Add ZK directives to context
    if (parsed.zkDirectives) {
      if (parsed.zkDirectives.zkProof) {
        context.zkProof = parsed.zkDirectives.zkProof;
      }
      if (parsed.zkDirectives.zkTrust) {
        context.trustLevel = parsed.zkDirectives.zkTrust;
      }
    }

    // Add ECS bindings to context
    if (parsed.ecsBindings) {
      if (parsed.ecsBindings.ecsEntity) {
        // Try to parse as number first, fallback to string
        const entityId = parseInt(parsed.ecsBindings.ecsEntity, 10);
        context.ecsEntity = isNaN(entityId) ? parsed.ecsBindings.ecsEntity : entityId;
      }
    }

    return context;
  }

  /**
   * Extract island configuration from parsed template
   */
  public static extractIslandConfig(parsed: ZenithParsedTemplate): {
    strategy?: string;
    priority?: string;
    lazy?: boolean;
    trigger?: string;
    debounce?: number;
  } {
    const config: any = {};

    if (parsed.hydrationConfig) {
      if (parsed.hydrationConfig.strategy) {
        config.strategy = parsed.hydrationConfig.strategy;
      }
      if (parsed.hydrationConfig.priority) {
        config.priority = parsed.hydrationConfig.priority;
      }
      if (parsed.hydrationConfig.lazy !== undefined) {
        config.lazy = parsed.hydrationConfig.lazy;
      }
      if (parsed.hydrationConfig.trigger) {
        config.trigger = parsed.hydrationConfig.trigger;
      }
      if (parsed.hydrationConfig.debounce !== undefined) {
        config.debounce = parsed.hydrationConfig.debounce;
      }
    }

    return config;
  }

  /**
   * Get all data-zk-* attributes from parsed template
   */
  public static getZenithDataAttributes(parsed: ZenithParsedTemplate): Record<string, string> {
    const dataAttrs: Record<string, string> = {};

    // Convert parsed directives back to data attributes
    if (parsed.zkDirectives) {
      if (parsed.zkDirectives.zkProof) {
        dataAttrs['data-zk-proof'] = parsed.zkDirectives.zkProof;
      }
      if (parsed.zkDirectives.zkTrust) {
        dataAttrs['data-zk-trust'] = parsed.zkDirectives.zkTrust;
      }
      if (parsed.zkDirectives.zkEntity) {
        dataAttrs['data-zk-entity'] = parsed.zkDirectives.zkEntity;
      }
      if (parsed.zkDirectives.zkStrategy) {
        dataAttrs['data-zk-strategy'] = parsed.zkDirectives.zkStrategy;
      }
    }

    if (parsed.ecsBindings) {
      if (parsed.ecsBindings.ecsEntity) {
        dataAttrs['data-ecs-entity'] = parsed.ecsBindings.ecsEntity;
      }
      if (parsed.ecsBindings.ecsComponents) {
        dataAttrs['data-ecs-components'] = JSON.stringify(parsed.ecsBindings.ecsComponents);
      }
      if (parsed.ecsBindings.ecsAutoCreate !== undefined) {
        dataAttrs['data-ecs-auto-create'] = parsed.ecsBindings.ecsAutoCreate.toString();
      }
      if (parsed.ecsBindings.ecsUpdateStrategy) {
        dataAttrs['data-ecs-update-strategy'] = parsed.ecsBindings.ecsUpdateStrategy;
      }
    }

    if (parsed.hydrationConfig) {
      if (parsed.hydrationConfig.strategy) {
        dataAttrs['data-hydration-strategy'] = parsed.hydrationConfig.strategy;
      }
      if (parsed.hydrationConfig.priority) {
        dataAttrs['data-hydration-priority'] = parsed.hydrationConfig.priority;
      }
      if (parsed.hydrationConfig.lazy !== undefined) {
        dataAttrs['data-hydration-lazy'] = parsed.hydrationConfig.lazy.toString();
      }
      if (parsed.hydrationConfig.trigger) {
        dataAttrs['data-hydration-trigger'] = parsed.hydrationConfig.trigger;
      }
      if (parsed.hydrationConfig.debounce !== undefined) {
        dataAttrs['data-hydration-debounce'] = parsed.hydrationConfig.debounce.toString();
      }
    }

    return dataAttrs;
  }

  /**
   * Parse a template with error recovery
   * Continues parsing even if individual directives fail
   */
  public parseWithRecovery(template: string): ZenithParsedTemplate {
    const originalStrict = this.options.strict;
    this.options.strict = false;
    
    try {
      const result = this.parse(template);
      
      // Ensure errors array exists
      if (!result.errors) {
        result.errors = [];
      }
      
      // Collect errors from all directive parsers
      if (result.zkDirectives?.errors) {
        result.errors.push(...result.zkDirectives.errors);
      }
      
      if ((result.hydrationConfig as any)?.errors) {
        result.errors.push(...(result.hydrationConfig as any).errors);
      }
      
      // Clean up internal error arrays
      if (result.zkDirectives) {
        delete result.zkDirectives.errors;
      }
      if (result.hydrationConfig) {
        delete (result.hydrationConfig as any).errors;
      }
      
      return result;
    } finally {
      this.options.strict = originalStrict;
    }
  }

  /**
   * Create a minimal template parser for testing
   */
  public static createMinimal(): ZenithTemplateParser {
    return new ZenithTemplateParser({
      enableZKDirectives: true,
      enableECSDirectives: true,
      enableHydrationDirectives: true,
      strict: false
    });
  }

  /**
   * Create a strict template parser for production
   */
  public static createStrict(): ZenithTemplateParser {
    return new ZenithTemplateParser({
      enableZKDirectives: true,
      enableECSDirectives: true,
      enableHydrationDirectives: true,
      strict: true
    });
  }
}
