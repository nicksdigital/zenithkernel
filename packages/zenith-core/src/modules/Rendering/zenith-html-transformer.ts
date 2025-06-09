 /* ZenithKernel Enhanced HTML Transformer
 * 
 * Extends Archipelago's HtmlTransformer with ZenithKernel-specific features:
 * - ZK proof verification and placeholders
 * - ECS data binding and component integration
 * - Hydration configuration and data attribute application
 * - Enhanced context evaluation with ZK and ECS helpers
 * - Graceful fallbacks for security and data operations
 */

import type { HydraContext } from './types';
import type { ECSManager, Entity } from '../../core/ECSManager';
import { ZenithParsedTemplate, ZenithTemplateParser } from './template-parser';

/**
 * Enhanced render context with ZK and ECS integration
 */
export interface ZenithRenderContext {
  // Base context from Archipelago
  [key: string]: any;
  
  // ZenithKernel-specific context
  zkContext?: HydraContext;
  ecsManager?: ECSManager;
  verifySystem?: {
    verifyProof: (entityId: string, zkProof: string) => Promise<boolean>;
    isVerified: (entityId: string) => boolean;
  };
  
  // Helper functions available in template expressions
  zkVerify?: (proof: string, entityId?: string) => Promise<boolean>;
  ecsGet?: (entityId: Entity, componentType: string) => any;
  ecsHas?: (entityId: Entity, componentType: string) => boolean;
  ecsQuery?: (queryId: string) => Entity[];
}

/**
 * Enhanced render options for ZenithKernel
 */
export interface ZenithRenderOptions {
  // Base options from Archipelago
  hydrate?: boolean;
  ssr?: boolean;
  clientOnly?: boolean;
  
  // ZenithKernel-specific options
  enableZKVerification?: boolean;
  enableECSBinding?: boolean;
  enableHydrationConfig?: boolean;
  zkVerificationTimeout?: number;
  fallbackToPlaceholder?: boolean;
  debugMode?: boolean;
}

/**
 * ZK verification result
 */
interface ZKVerificationResult {
  isValid: boolean;
  error?: string;
  cached?: boolean;
}

/**
 * Enhanced HTML Transformer for ZenithKernel
 * Extends Archipelago's functionality with ZK verification and ECS integration
 */
export class ZenithHtmlTransformer {
  private context: ZenithRenderContext;
  private options: ZenithRenderOptions;
  private zkVerificationCache = new Map<string, ZKVerificationResult>();

  constructor(context: ZenithRenderContext, options: ZenithRenderOptions = {}) {
    this.context = {
      ...context,
      // Inject helper functions into context
      zkVerify: this.createZKVerifyHelper(),
      ecsGet: this.createECSGetHelper(),
      ecsHas: this.createECSHasHelper(),
      ecsQuery: this.createECSQueryHelper(),
    };
    
    this.options = {
      enableZKVerification: true,
      enableECSBinding: true,
      enableHydrationConfig: true,
      zkVerificationTimeout: 5000,
      fallbackToPlaceholder: true,
      debugMode: false,
      ...options
    };
  }

  /**
   * Transform a ZenithParsedTemplate into HTML
   */
  public async transform(template: ZenithParsedTemplate): Promise<string> {
    try {
      // Check if template should be skipped (v-if evaluation)
      if (await this.shouldSkip(template)) {
        return '';
      }

      // Handle v-for loops
      if (template.directives?.vFor) {
        return await this.renderLoop(template);
      }

      // ZK verification check
      if (this.options.enableZKVerification && template.zkDirectives?.zkProof) {
        const zkResult = await this.verifyZKProof(template);
        if (!zkResult.isValid) {
          return this.renderZKVerificationPlaceholder(template, zkResult.error);
        }
      }

      // ECS data binding
      if (this.options.enableECSBinding && template.ecsBindings) {
        await this.bindECSData(template);
      }

      // Build the HTML element
      const tag = template.componentName || 'div';
      const attrs = await this.buildAttributes(template);
      const innerHTML = await this.buildInnerHTML(template);

      // Apply hydration configuration
      if (this.options.enableHydrationConfig && template.hydrationConfig) {
        this.applyHydrationConfig(attrs, template.hydrationConfig);
      }

      // Client-only short circuit
      if (this.options.clientOnly && !this.options.ssr) {
        return `<${tag}${this.buildAttributeString(attrs)} />`;
      }

      return `<${tag}${this.buildAttributeString(attrs)}>${innerHTML}</${tag}>`;

    } catch (error) {
      return this.renderErrorPlaceholder(template, error);
    }
  }

  /**
   * Check if ZK proof verification is required and valid
   */
  private async verifyZKProof(template: ZenithParsedTemplate): Promise<ZKVerificationResult> {
    const zkDirectives = template.zkDirectives;
    if (!zkDirectives?.zkProof) {
      return { isValid: true };
    }

    const proof = zkDirectives.zkProof;
    const entityId = zkDirectives.zkEntity || this.context.zkContext?.peerId || 'unknown';
    const cacheKey = `${entityId}:${proof}`;

    // Check cache first
    if (this.zkVerificationCache.has(cacheKey)) {
      const cached = this.zkVerificationCache.get(cacheKey)!;
      return { ...cached, cached: true };
    }

    try {
      // Use the verify system if available
      if (this.context.verifySystem?.verifyProof) {
        const isValid = await Promise.race([
          this.context.verifySystem.verifyProof(entityId, proof),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('ZK verification timeout')), this.options.zkVerificationTimeout)
          )
        ]);

        const result = { isValid };
        this.zkVerificationCache.set(cacheKey, result);
        return result;
      }

      // Fallback to basic proof validation
      const isValid = ZenithTemplateParser.validateZKProof(proof);
      const result = { isValid };
      this.zkVerificationCache.set(cacheKey, result);
      return result;

    } catch (error) {
      const result = { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'ZK verification failed' 
      };
      this.zkVerificationCache.set(cacheKey, result);
      return result;
    }
  }

  /**
   * Bind ECS data to the template context
   */
  private async bindECSData(template: ZenithParsedTemplate): Promise<void> {
    const ecsBindings = template.ecsBindings;
    if (!ecsBindings || !this.context.ecsManager) {
      return;
    }

    try {
      // Bind entity data
      if (ecsBindings.ecsEntity) {
        const entityId = parseInt(ecsBindings.ecsEntity, 10);
        if (!isNaN(entityId)) {
          // Add entity ID to context
          this.context.entityId = entityId;

          // Bind specific components if specified
          if (ecsBindings.ecsComponents) {
            for (const componentType of ecsBindings.ecsComponents) {
              try {
                // Get component data from ECS
                const componentMap = this.context.ecsManager.dumpComponentMap().get(componentType);
                const componentData = componentMap?.get(entityId);
                
                if (componentData) {
                  // Add component data to context with safe key name
                  const safeKey = this.toSafeVariableName(componentType);
                  this.context[safeKey] = componentData;
                }
              } catch (error) {
                if (this.options.debugMode) {
                  console.warn(`Failed to bind ECS component ${componentType}:`, error);
                }
              }
            }
          }

          // Auto-create entity if needed and specified
          if (ecsBindings.ecsAutoCreate && !this.context.ecsManager.getAllEntities().includes(entityId)) {
            // Note: In a real implementation, we'd need to handle entity creation more carefully
            if (this.options.debugMode) {
              console.info(`Entity ${entityId} would be auto-created`);
            }
          }
        }
      }
    } catch (error) {
      if (this.options.debugMode) {
        console.error('ECS data binding failed:', error);
      }
    }
  }

 
  /**
   * Apply hydration configuration as data attributes
   */
  private applyHydrationConfig(attrs: Record<string, string>, config: any): void {
    if (config.strategy) {
      attrs['data-hydration-strategy'] = config.strategy;
    }
    
    if (config.priority) {
      attrs['data-hydration-priority'] = config.priority;
    }
    
    if (config.lazy !== undefined) {
      attrs['data-hydration-lazy'] = config.lazy.toString();
    }
    
    if (config.trigger) {
      attrs['data-hydration-trigger'] = config.trigger;
    }
    
    if (config.debounce !== undefined) {
      attrs['data-hydration-debounce'] = config.debounce.toString();
    }
  }

  /**
   * Build HTML attributes from template
   */
  private async buildAttributes(template: ZenithParsedTemplate): Promise<Record<string, string>> {
    const attrs: Record<string, string> = {};

    // Process template bindings (:attr=\"expression\")
    if (template.directives?.bindings) {
      for (const [name, expr] of Object.entries(template.directives.bindings)) {
        try {
          const value = await this.evalInContext(expr);
          attrs[name] = String(value);
        } catch (error) {
          attrs[name] = '';
          if (this.options.debugMode) {
            console.warn(`Failed to evaluate binding ${name}:`, error);
          }
        }
      }
    }

    // Process static attributes (excluding directives)
    for (const [name, value] of Object.entries(template.attributes)) {
      if (!this.isDirectiveAttribute(name)) {
        attrs[name] = await this.interpolate(value);
      }
    }

    // Add hydration attributes if enabled
    if (this.options.hydrate) {
      attrs['data-hydrate'] = 'true';
      if (template.componentName) {
        attrs['data-component'] = template.componentName;
      }
    }

    // Add ZK attributes
    if (template.zkDirectives) {
      const zkAttrs = ZenithTemplateParser.getZenithDataAttributes({ zkDirectives: template.zkDirectives } as any);
      Object.assign(attrs, zkAttrs);
    }

    // Add ECS attributes
    if (template.ecsBindings) {
      const ecsAttrs = ZenithTemplateParser.getZenithDataAttributes({ ecsBindings: template.ecsBindings } as any);
      Object.assign(attrs, ecsAttrs);
    }

    return attrs;
  }

  /**
   * Build inner HTML content
   */
  private async buildInnerHTML(template: ZenithParsedTemplate): Promise<string> {
    const slotContents = await Promise.all(
      Object.values(template.slots).map(content => this.interpolate(content))
    );
    
    return slotContents.join('');
  }

  /**
   * Render a v-for loop
   */
  private async renderLoop(template: ZenithParsedTemplate): Promise<string> {
    const { item, iterable } = template.directives!.vFor!;
    
    try {
      const array = await this.evalInContext(iterable);
      if (!Array.isArray(array)) {
        return '';
      }

      const results = await Promise.all(
        array.map(async (value, index) => {
          const scopedContext = {
            ...this.context,
            [item]: value,
            index,
          };
          
          const instance = new ZenithHtmlTransformer(scopedContext, this.options);
          const clone: ZenithParsedTemplate = {
            ...template,
            directives: { ...template.directives, vFor: undefined }, // Prevent recursion
          };
          
          return await instance.transform(clone);
        })
      );

      return results.join('');
    } catch (error) {
      if (this.options.debugMode) {
        console.error('v-for rendering failed:', error);
      }
      return '';
    }
  }

  /**
   * Check if template should be skipped (v-if evaluation)
   */
  private async shouldSkip(template: ZenithParsedTemplate): Promise<boolean> {
    const expr = template.directives?.vIf;
    if (!expr) return false;

    try {
      const result = await this.evalInContext(expr);
      return !result;
    } catch (error) {
      if (this.options.debugMode) {
        console.warn('v-if evaluation failed:', error);
      }
      return false;
    }
  }

  /**
   * Interpolate template expressions in content
   */
  private async interpolate(content: string): Promise<string> {
    // Process all {{ expression }} patterns
    const expressions = content.match(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g) || [];
    
    let result = content;
    for (const match of expressions) {
      const expr = match.replace(/\\{\\{\\s*|\\s*\\}\\}/g, '');
      try {
        const value = await this.evalInContext(expr);
        const stringValue = value != null ? String(value) : '';
        result = result.replace(match, stringValue);
      } catch (error) {
        result = result.replace(match, '');
        if (this.options.debugMode) {
          console.warn(`Interpolation failed for ${expr}:`, error);
        }
      }
    }
    
    return result;
  }

  /**
   * Evaluate an expression in the current context
   */
  private async evalInContext(expr: string): Promise<any> {
    try {
      // Create a safe evaluation function
      const contextKeys = Object.keys(this.context);
      const contextValues = Object.values(this.context);
      
      // Handle async expressions
      const func = new Function(...contextKeys, `
        try {
          return (${expr});
        } catch (error) {
          throw new Error('Expression evaluation failed: ' + error.message);
        }
      `);
      
      const result = func(...contextValues);
      
      // Handle promises
      if (result instanceof Promise) {
        return await result;
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate expression \"${expr}\": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create ZK verification helper function
   */
  private createZKVerifyHelper() {
    return async (proof: string, entityId?: string): Promise<boolean> => {
      try {
        if (this.context.verifySystem?.verifyProof) {
          const id = entityId || this.context.zkContext?.peerId || 'unknown';
          return await this.context.verifySystem.verifyProof(id, proof);
        }
        return ZenithTemplateParser.validateZKProof(proof);
      } catch {
        return false;
      }
    };
  }

  /**
   * Create ECS get helper function
   */
  private createECSGetHelper() {
    return (entityId: Entity, componentType: string): any => {
      try {
        if (!this.context.ecsManager) return null;
        const componentMap = this.context.ecsManager.dumpComponentMap().get(componentType);
        return componentMap?.get(entityId) || null;
      } catch {
        return null;
      }
    };
  }

  /**
   * Create ECS has helper function
   */
  private createECSHasHelper() {
    return (entityId: Entity, componentType: string): boolean => {
      try {
        if (!this.context.ecsManager) return false;
        const componentMap = this.context.ecsManager.dumpComponentMap().get(componentType);
        return componentMap?.has(entityId) || false;
      } catch {
        return false;
      }
    };
  }

  /**
   * Create ECS query helper function
   */
  private createECSQueryHelper() {
    return (queryId: string): Entity[] => {
      try {
        if (!this.context.ecsManager) return [];
        return this.context.ecsManager.getEntitiesWithQuery(queryId);
      } catch {
        return [];
      }
    };
  }

  /**
   * Render ZK verification placeholder
   */
  private renderZKVerificationPlaceholder(template: ZenithParsedTemplate, error?: string): string {
    const componentName = template.componentName || 'div';
    const errorMsg = error || 'ZK proof verification failed';
    
    return `<${componentName} class=\"zk-verification-placeholder\" data-zk-error=\"${errorMsg}\">
      <div class=\"zk-verification-message\">
        🔒 Verification Required
        ${this.options.debugMode ? `<small>${errorMsg}</small>` : ''}
      </div>
    </${componentName}>`;
  }

  /**
   * Render error placeholder
   */
  private renderErrorPlaceholder(template: ZenithParsedTemplate, error: any): string {
    const componentName = template.componentName || 'div';
    const errorMsg = error instanceof Error ? error.message : 'Rendering error';
    
    if (!this.options.fallbackToPlaceholder) {
      throw error;
    }
    
    return `<${componentName} class=\"render-error-placeholder\" data-error=\"${errorMsg}\">
      <div class=\"error-message\">
        ⚠️ Rendering Error
        ${this.options.debugMode ? `<small>${errorMsg}</small>` : ''}
      </div>
    </${componentName}>`;
  }

  /**
   * Check if an attribute is a directive
   */
  private isDirectiveAttribute(name: string): boolean {
    return name.startsWith('v-') || 
           name.startsWith(':') || 
           name.startsWith('zk-') || 
           name.startsWith('data-zk-') ||
           name.startsWith('ecs-') || 
           name.startsWith('data-ecs-') ||
           name.startsWith('hydration-') || 
           name.startsWith('data-hydration-');
  }

  /**
   * Build attribute string for HTML
   */
  private buildAttributeString(attrs: Record<string, string>): string {
    const attrString = Object.entries(attrs)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=\"${this.escapeHtml(String(value))}\"`)
      .join(' ');
    
    return attrString ? ' ' + attrString : '';
  }

  /**
   * Convert component type name to safe variable name
   */
  private toSafeVariableName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[0-9]/, '_$&');
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Create a transformer with minimal configuration for testing
   */
  public static createMinimal(context: ZenithRenderContext = {}): ZenithHtmlTransformer {
    return new ZenithHtmlTransformer(context, {
      enableZKVerification: false,
      enableECSBinding: false,
      enableHydrationConfig: true,
      fallbackToPlaceholder: true,
      debugMode: true
    });
  }

  /**
   * Create a transformer with full production configuration
   */
  public static createProduction(context: ZenithRenderContext): ZenithHtmlTransformer {
    return new ZenithHtmlTransformer(context, {
      enableZKVerification: true,
      enableECSBinding: true,
      enableHydrationConfig: true,
      zkVerificationTimeout: 3000,
      fallbackToPlaceholder: false,
      debugMode: false
    });
  }
}