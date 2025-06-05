
## Overview

This document outlines the integration of Archipelago's sophisticated template parsing, JSX type generation, and custom syntax features into ZenithKernel's Hydra system. Archipelago provides advanced parsing capabilities that can significantly enhance ZenithKernel's component system.

## Archipelago Syntax Features

### 1. Template Parser Architecture

Archipelago's `TemplateParser` provides sophisticated parsing capabilities:

```typescript
// Core parsing result structure
interface ParsedTemplate {
  componentName: string;
  attributes: Record<string, string>;
  slots: Record<string, string>;
  expressions: string[];
  directives?: {
    vIf?: string;
    vFor?: { item: string; iterable: string };
    bindings?: Record<string, string>;
  };
  errors?: string[];
}
```

**Key Features:**
- Component name extraction
- Attribute parsing with proper escaping
- Slot content extraction
- Expression interpolation (`{{ expression }}`)
- Vue.js-style directives (`v-if`, `v-for`, `:binding`)
- Error handling and recovery

### 2. HTML Transformer

The `HtmlTransformer` converts parsed templates into rendered HTML:

```typescript
// Enhanced transformation with context evaluation
class HtmlTransformer {
  // Context-aware expression evaluation
  private evalInContext(expr: string): any {
    return Function(...Object.keys(this.context), `return (${expr})`)(
      ...Object.values(this.context)
    );
  }

  // Template interpolation
  private interpolate(content: string): string {
    return content.replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, (_, expr) => {
      try {
        const result = this.evalInContext(expr);
        return result != null ? String(result) : '';
      } catch {
        return '';
      }
    });
  }

  // Loop rendering with scoped context
  private renderLoop(template: ParsedTemplate): string {
    const { item, iterable } = template.directives!.vFor!;
    const array = this.evalInContext(iterable);
    
    return array.map((value, index) => {
      const scopedContext = {
        ...this.context,
        [item]: value,
        index,
      };
      // ... render with scoped context
    }).join('');
  }
}
```

### 3. Advanced JSX Type Generation

Archipelago's JSX type generator creates sophisticated TypeScript definitions:

```typescript
// Features:
// - Automatic prop type inference
// - Support for both PascalCase and kebab-case
// - Children detection
// - Custom tag support
// - Watch mode for development

function inferType(attr: ts.JsxAttribute | ts.JsxSpreadAttribute): [string, string] | null {
  if (ts.isJsxSpreadAttribute(attr)) return [\"props\", \"Record<string, any>\"];
  
  const name = attr.name.text;
  if (!attr.initializer) return [name, \"boolean\"];
  
  if (ts.isJsxExpression(attr.initializer)) {
    const expr = attr.initializer.expression;
    switch (expr.kind) {
      case ts.SyntaxKind.StringLiteral: return [name, \"string\"];
      case ts.SyntaxKind.NumericLiteral: return [name, \"number\"];
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword: return [name, \"boolean\"];
      default: return [name, \"any\"];
    }
  }
  
  return [name, \"string\"];
}
```

## Integration Plan for ZenithKernel

### Phase 1: Enhanced Template Parser

#### 1.1 ZenithKernel Template Parser

```typescript
// src/modules/Rendering/template-parser.ts
import { HydraContext } from '../../lib/hydra-runtime';

export interface ZenithParsedTemplate extends ParsedTemplate {
  // ZenithKernel-specific extensions
  zkDirectives?: {
    zkProof?: string;
    zkTrust?: 'unverified' | 'local' | 'community' | 'verified';
    zkEntity?: string;
    zkStrategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
  };
  ecsBindings?: {
    entity?: string;
    components?: string[];
  };
  hydrationConfig?: {
    strategy?: string;
    priority?: number;
    lazy?: boolean;
  };
}

export class ZenithTemplateParser extends TemplateParser {
  constructor() {
    super();
  }

  parse(template: string): ZenithParsedTemplate {
    const baseResult = super.parse(template);
    
    return {
      ...baseResult,
      zkDirectives: this.parseZKDirectives(baseResult.attributes),
      ecsBindings: this.parseECSBindings(baseResult.attributes),
      hydrationConfig: this.parseHydrationConfig(baseResult.attributes)
    };
  }

  /**
   * Parse ZenithKernel-specific zk-* directives
   */
  private parseZKDirectives(attributes: Record<string, string>): ZenithParsedTemplate['zkDirectives'] {
    const zkDirectives: ZenithParsedTemplate['zkDirectives'] = {};

    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'zk-proof') {
        zkDirectives.zkProof = value;
      } else if (key === 'zk-trust') {
        zkDirectives.zkTrust = value as any;
      } else if (key === 'zk-entity') {
        zkDirectives.zkEntity = value;
      } else if (key === 'zk-strategy') {
        zkDirectives.zkStrategy = value as any;
      }
    }

    return Object.keys(zkDirectives).length > 0 ? zkDirectives : undefined;
  }

  /**
   * Parse ECS-specific bindings
   */
  private parseECSBindings(attributes: Record<string, string>): ZenithParsedTemplate['ecsBindings'] {
    const ecsBindings: ZenithParsedTemplate['ecsBindings'] = {};

    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'ecs-entity') {
        ecsBindings.entity = value;
      } else if (key === 'ecs-components') {
        ecsBindings.components = value.split(',').map(c => c.trim());
      }
    }

    return Object.keys(ecsBindings).length > 0 ? ecsBindings : undefined;
  }

  /**
   * Parse hydration configuration
   */
  private parseHydrationConfig(attributes: Record<string, string>): ZenithParsedTemplate['hydrationConfig'] {
    const hydrationConfig: ZenithParsedTemplate['hydrationConfig'] = {};

    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'hydration-strategy') {
        hydrationConfig.strategy = value;
      } else if (key === 'hydration-priority') {
        hydrationConfig.priority = parseInt(value, 10);
      } else if (key === 'hydration-lazy') {
        hydrationConfig.lazy = value === 'true';
      }
    }

    return Object.keys(hydrationConfig).length > 0 ? hydrationConfig : undefined;
  }

  /**
   * Enhanced attribute parsing with ZenithKernel syntax
   */
  protected parseAttributes(template: string): Record<string, string> {
    const attributes = super.parseAttributes(template);
    
    // Add support for data-zk-* attributes
    const zkAttributeRegex = /data-zk-([a-zA-Z0-9\\-]+)=\"([^\"]*)\"/g;
    let match;

    while ((match = zkAttributeRegex.exec(template)) !== null) {
      const [, name, value] = match;
      attributes[`zk-${name}`] = value;
    }

    return attributes;
  }
}
```

#### 1.2 Enhanced HTML Transformer

```typescript
// src/modules/Rendering/zenith-html-transformer.ts
export class ZenithHtmlTransformer extends HtmlTransformer {
  constructor(
    context: RenderContext & { 
      zkContext?: HydraContext;
      ecsManager?: ECSManager;
    },
    options: RenderOptions & {
      zkProofRequired?: boolean;
      ecsIntegration?: boolean;
    } = {}
  ) {
    super(context, options);
  }

  public transform(template: ZenithParsedTemplate): string {
    // Handle ZK proof verification
    if (this.shouldVerifyZKProof(template)) {
      return this.renderZKVerificationPlaceholder(template);
    }

    // Handle ECS integration
    if (template.ecsBindings && this.options.ecsIntegration) {
      this.bindECSData(template);
    }

    // Handle hydration configuration
    if (template.hydrationConfig) {
      this.applyHydrationConfig(template);
    }

    return super.transform(template);
  }

  private shouldVerifyZKProof(template: ZenithParsedTemplate): boolean {
    return !!(
      template.zkDirectives?.zkProof && 
      this.options.zkProofRequired &&
      !this.context.zkContext?.zkProof
    );
  }

  private renderZKVerificationPlaceholder(template: ZenithParsedTemplate): string {
    return `
      <div class=\"zk-verification-required\" data-component=\"${template.componentName}\">
        <div class=\"zk-verification-message\">
          ZK Proof verification required for ${template.componentName}
        </div>
        <button class=\"zk-verification-trigger\" onclick=\"requestZKProof('${template.componentName}')\">
          Verify Identity
        </button>
      </div>
    `;
  }

  private bindECSData(template: ZenithParsedTemplate): void {
    if (!template.ecsBindings || !this.context.ecsManager) return;

    const { entity, components } = template.ecsBindings;
    
    if (entity && components) {
      const entityId = this.evalInContext(entity);
      const ecsData: Record<string, any> = {};
      
      for (const componentName of components) {
        const component = this.context.ecsManager.getComponent(entityId, componentName);
        ecsData[componentName] = component;
      }
      
      // Add ECS data to context
      this.context.ecs = ecsData;
    }
  }

  private applyHydrationConfig(template: ZenithParsedTemplate): void {
    if (!template.hydrationConfig) return;

    const { strategy, priority, lazy } = template.hydrationConfig;
    
    // Add hydration attributes to template
    if (strategy) {
      template.attributes['data-hydration-strategy'] = strategy;
    }
    if (priority !== undefined) {
      template.attributes['data-hydration-priority'] = priority.toString();
    }
    if (lazy) {
      template.attributes['data-hydration-lazy'] = 'true';
    }
  }

  /**
   * Enhanced expression evaluation with ZK and ECS context
   */
  protected evalInContext(expr: string): any {
    const enhancedContext = {
      ...this.context,
      zk: this.context.zkContext || {},
      ecs: this.context.ecs || {},
      // ZenithKernel-specific helpers
      zkVerify: (proof: string) => this.verifyZKProof(proof),
      ecsGet: (entity: number, component: string) => 
        this.context.ecsManager?.getComponent(entity, component)
    };

    return Function(
      ...Object.keys(enhancedContext), 
      `return (${expr})`
    )(...Object.values(enhancedContext));
  }

  private async verifyZKProof(proof: string): Promise<boolean> {
    // Integration with ZenithKernel's VerifySystem
    return true; // Placeholder
  }
}
```

### Phase 2: Enhanced JSX Type Generation

#### 2.1 ZenithKernel JSX Type Generator

```typescript
// src/devtools/zenith-jsx-generator.ts
export class ZenithJSXTypeGenerator extends JSXTypeGenerator {
  constructor(config: Partial<JSXTypeGeneratorConfig> = {}) {
    super({
      inputDir: './src/modules/Rendering/islands',
      outputFile: './src/types/zenith-jsx.d.ts',
      islandPattern: /\\.(island|hydra)\\.(tsx?|jsx?)$/,
      ...config
    });
  }

  /**
   * Generate enhanced types with ZenithKernel-specific features
   */
  async generateTypes(): Promise<void> {
    const islandFiles = this.scanIslandFiles();
    const islandTypes = await this.analyzeIslands(islandFiles);
    const typeDefinitions = this.generateZenithTypeDefinitions(islandTypes);
    
    await this.writeTypeFile(typeDefinitions);
    console.log(`[ZenithJSX] Generated types for ${islandTypes.length} islands`);
  }

  private generateZenithTypeDefinitions(islandTypes: IslandTypeInfo[]): string {
    const interfaceDefinitions = this.generateIslandInterfaces(islandTypes);
    const intrinsicElements = this.generateIntrinsicElements(islandTypes);
    const zenithSpecificTypes = this.generateZenithTypes();

    return `
// AUTO-GENERATED FILE. DO NOT EDIT.
// Generated by ZenithKernel JSX Type Generator

declare global {
  namespace JSX {
    interface IntrinsicElements {
${intrinsicElements}
      
      // ZenithKernel-specific elements
      'Hydra': HydraProps;
      'HydraLoader': HydraLoaderProps;
      'Island': IslandProps;
      'ZKGate': ZKGateProps;
      'ECSBinder': ECSBinderProps;
    }
  }
}

${zenithSpecificTypes}

${interfaceDefinitions}

export {};
`;
  }

  private generateZenithTypes(): string {
    return `
// ZenithKernel Core Types
interface HydraContext {
  peerId: string;
  zkProof?: string;
  trustLevel?: 'unverified' | 'local' | 'community' | 'verified';
  ecsEntity?: number;
  [key: string]: any;
}

interface HydraProps {
  type?: 'island' | 'component';
  id: string;
  entry: string;
  execType?: 'local' | 'remote' | 'edge';
  context?: HydraContext;
  strategy?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
  priority?: number | 'high' | 'medium' | 'low';
  'zk-proof'?: string;
  'zk-trust'?: 'unverified' | 'local' | 'community' | 'verified';
  'ecs-entity'?: string;
  'ecs-components'?: string;
  children?: any;
  [key: \\`data-\\${string}\\`]: any;
}

interface HydraLoaderProps extends HydraProps {
  fallback?: React.ReactNode;
  onHydrated?: (element: HTMLElement) => void;
  onError?: (error: Error) => void;
}

interface IslandProps {
  name: string;
  props?: Record<string, any>;
  context?: HydraContext;
  lazy?: boolean;
  'v-if'?: string;
  'v-for'?: string;
  ':bind'?: string;
  children?: any;
}

interface ZKGateProps {
  requiredTrust?: 'unverified' | 'local' | 'community' | 'verified';
  proof?: string;
  challenge?: string;
  onVerified?: () => void;
  onFailed?: () => void;
  fallback?: React.ReactNode;
  children?: any;
}

interface ECSBinderProps {
  entity: number | string;
  components?: string[];
  autoCreate?: boolean;
  children?: (data: Record<string, any>) => React.ReactNode;
}

// Template directive support
interface TemplateDirectives {
  'v-if'?: string;
  'v-for'?: string;
  'v-show'?: string;
  ':class'?: string;
  ':style'?: string;
  [key: \\`:$\\{string}\\`]: string;
}

// Enhanced HTML attributes with ZenithKernel features
interface ZenithHTMLAttributes extends React.HTMLAttributes<HTMLElement> {
  // ZK attributes
  'zk-proof'?: string;
  'zk-trust'?: 'unverified' | 'local' | 'community' | 'verified';
  'zk-entity'?: string;
  'zk-strategy'?: 'immediate' | 'visible' | 'interaction' | 'idle' | 'manual';
  
  // ECS attributes
  'ecs-entity'?: string;
  'ecs-components'?: string;
  
  // Hydration attributes
  'hydration-strategy'?: string;
  'hydration-priority'?: string;
  'hydration-lazy'?: string;
  
  // Template directives
  'v-if'?: string;
  'v-for'?: string;
  'v-show'?: string;
  
  // Dynamic bindings
  [key: \\`:$\\{string}\\`]: any;
  [key: \\`zk-$\\{string}\\`]: any;
  [key: \\`ecs-$\\{string}\\`]: any;
  [key: \\`data-$\\{string}\\`]: any;
}

// Extend all HTML elements with ZenithKernel attributes
declare module 'react' {
  interface HTMLAttributes<T> extends ZenithHTMLAttributes {}
}
`;
  }

  private generateIslandInterfaces(islandTypes: IslandTypeInfo[]): string {
    return islandTypes.map(island => {
      const propsInterface = island.propsInterface || `
interface ${island.name}Props {
  [key: string]: any;
}`;

      const contextInterface = island.contextInterface || `
interface ${island.name}Context extends HydraContext {
  [key: string]: any;
}`;

      return `
// ${island.name} Component Types
${propsInterface}

${contextInterface}

// Enhanced ${island.name} with ZenithKernel features
interface Enhanced${island.name}Props extends ${island.name}Props, ZenithHTMLAttributes {
  context?: ${island.name}Context;
}`;
    }).join('\
\
');
  }

  private generateIntrinsicElements(islandTypes: IslandTypeInfo[]): string {
    return islandTypes.map(island => {
      const kebabName = this.toKebabCase(island.name);
      return `      '${island.name}': Enhanced${island.name}Props;
      '${kebabName}': Enhanced${island.name}Props;`;
    }).join('\
');
  }

  private toKebabCase(name: string): string {
    return name
      .replace(/([a-z0-9])([A-Z])/g, \"$1-$2\")
      .replace(/([A-Z])([A-Z][a-z])/g, \"$1-$2\")
      .toLowerCase();
  }
}
```

### Phase 3: Enhanced Syntax Support

#### 3.1 Custom JSX Runtime with Template Features

```typescript
// src/modules/Rendering/zenith-jsx-runtime.ts
import { jsx as reactJsx, Fragment } from 'react/jsx-runtime';
import { ZenithTemplateParser } from './template-parser';
import { ZenithHtmlTransformer } from './zenith-html-transformer';

const parser = new ZenithTemplateParser();

/**
 * Enhanced JSX factory with template parsing support
 */
export function jsx(type: any, props: any, key?: any): any {
  // Handle ZenithKernel-specific components
  if (typeof type === 'string') {
    return handleCustomElement(type, props, key);
  }

  // Handle template strings with directives
  if (props && typeof props.template === 'string') {
    return handleTemplateProps(type, props, key);
  }

  // Default React JSX handling
  return reactJsx(type, props, key);
}

function handleCustomElement(type: string, props: any, key?: any): any {
  // Handle Hydra components
  if (type === 'Hydra' || type === 'HydraLoader') {
    return createHydraElement(type, props, key);
  }

  // Handle ZK gates
  if (type === 'ZKGate') {
    return createZKGateElement(props, key);
  }

  // Handle ECS binders
  if (type === 'ECSBinder') {
    return createECSBinderElement(props, key);
  }

  // Handle template directives on regular elements
  if (hasTemplateDirectives(props)) {
    return handleTemplateDirectives(type, props, key);
  }

  return reactJsx(type, props, key);
}

function createHydraElement(type: string, props: any, key?: any): any {
  const {
    id,
    entry,
    execType = 'local',
    strategy = 'visible',
    context,
    priority,
    children,
    ...restProps
  } = props;

  // Create placeholder element that will be hydrated
  return reactJsx('div', {
    ...restProps,
    key,
    id,
    'data-zk-island': entry,
    'data-zk-strategy': strategy,
    'data-zk-exec-type': execType,
    'data-zk-context': context ? JSON.stringify(context) : undefined,
    'data-zk-priority': priority,
    className: \\`zenith-hydra-placeholder \\${props.className || ''}\\`,
    children: children || 'Loading...'
  });
}

function createZKGateElement(props: any, key?: any): any {
  const {
    requiredTrust = 'local',
    proof,
    challenge,
    onVerified,
    onFailed,
    fallback,
    children,
    ...restProps
  } = props;

  return reactJsx('div', {
    ...restProps,
    key,
    'data-zk-gate': 'true',
    'data-zk-required-trust': requiredTrust,
    'data-zk-proof': proof,
    'data-zk-challenge': challenge,
    className: \\`zenith-zk-gate \\${props.className || ''}\\`,
    children: children || fallback || 'ZK verification required'
  });
}

function createECSBinderElement(props: any, key?: any): any {
  const {
    entity,
    components = [],
    autoCreate = false,
    children,
    ...restProps
  } = props;

  return reactJsx('div', {
    ...restProps,
    key,
    'data-ecs-binder': 'true',
    'data-ecs-entity': entity,
    'data-ecs-components': components.join(','),
    'data-ecs-auto-create': autoCreate,
    className: \\`zenith-ecs-binder \\${props.className || ''}\\`,
    children: typeof children === 'function' ? children({}) : children
  });
}

function hasTemplateDirectives(props: any): boolean {
  return Object.keys(props).some(key => 
    key.startsWith('v-') || 
    key.startsWith(':') ||
    key.includes('{{') ||
    key.startsWith('zk-') ||
    key.startsWith('ecs-')
  );
}

function handleTemplateDirectives(type: string, props: any, key?: any): any {
  // Extract template directives
  const templateProps: any = {};
  const regularProps: any = {};

  for (const [propKey, propValue] of Object.entries(props)) {
    if (propKey.startsWith('v-') || 
        propKey.startsWith(':') || 
        propKey.startsWith('zk-') ||
        propKey.startsWith('ecs-')) {
      templateProps[propKey] = propValue;
    } else {
      regularProps[propKey] = propValue;
    }
  }

  // Add template processing attributes
  if (Object.keys(templateProps).length > 0) {
    regularProps['data-template-props'] = JSON.stringify(templateProps);
    regularProps['data-template-processing'] = 'true';
  }

  return reactJsx(type, { ...regularProps, key });
}

function handleTemplateProps(type: any, props: any, key?: any): any {
  const { template, context = {}, ...restProps } = props;

  try {
    // Parse template string
    const parsed = parser.parse(template);
    
    // Transform to HTML
    const transformer = new ZenithHtmlTransformer(context);
    const html = transformer.transform(parsed);

    // Return element with processed template
    return reactJsx('div', {
      ...restProps,
      key,
      dangerouslySetInnerHTML: { __html: html },
      'data-template-processed': 'true'
    });
  } catch (error) {
    console.error('Template processing error:', error);
    return reactJsx('div', {
      ...restProps,
      key,
      children: 'Template processing error',
      'data-template-error': 'true'
    });
  }
}

export { Fragment };
export const jsxs = jsx;
export const jsxDEV = jsx;
```

#### 3.2 Enhanced Syntax Examples

```tsx
// Example usage of enhanced ZenithKernel syntax

// 1. Basic Hydra component with ZK verification
<Hydra 
  id=\"secure-component\"
  entry=\"SecureIsland\"
  zk-proof={userProof}
  zk-trust=\"verified\"
  strategy=\"interaction\"
  priority=\"high\"
/>

// 2. Template directives with ECS integration
<div 
  v-if=\"user.isActive\"
  ecs-entity={userId}
  ecs-components=\"Profile,Permissions\"
>
  <UserCard :name=\"user.name\" :role=\"user.role\" />
</div>

// 3. ZK-gated content
<ZKGate requiredTrust=\"community\" proof={zkProof}>
  <SecretContent />
</ZKGate>

// 4. ECS data binding
<ECSBinder entity={entityId} components={['Health', 'Position']}>
  {(data) => (
    <div>
      Health: {data.Health?.value}
      Position: {data.Position?.x}, {data.Position?.y}
    </div>
  )}
</ECSBinder>

// 5. Template string with context
<TemplateComponent 
  template={\\`
    <UserList v-for=\"user in users\">
      <UserCard :name=\"user.name\" v-if=\"user.active\" />
    </UserList>
  \\`}
  context={{ users: activeUsers }}
/>

// 6. Loop with ZK verification per item
<div v-for=\"item in secureItems\">
  <Hydra 
    :id=\"\\`secure-\\${item.id}\\`\"
    entry=\"SecureItemDisplay\"
    :zk-proof=\"item.proof\"
    :context=\"{ itemId: item.id }\"
  />
</div>

// 7. Conditional hydration based on ECS state
<div 
  ecs-entity={playerId}
  v-if=\"player.level >= 10\"
>
  <Hydra 
    entry=\"AdvancedPlayerPanel\"
    strategy=\"visible\"
    :context=\"{ playerId }\"
  />
</div>
```

### Phase 4: Development Tools Integration

####` 4.1 Enhanced DevTools for JSX Type Generation

```typescript