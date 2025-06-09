#!/usr/bin/env tsx

/**
 * ZenithKernel Advanced JSX Type Generator
 * 
 * Extends Archipelago's JSX type generator with ZenithKernel-specific features:
 * - Auto-generates TypeScript definitions for ZenithKernel islands
 * - Supports Archipelago-style .zenith.tsx syntax with <Template> wrapper
 * - Supports ZK, ECS, and hydration directives and attributes
 * - Generates both PascalCase and kebab-case component variants
 * - Includes comprehensive documentation and IntelliSense support
 * - Watch mode for development workflow
 */

import ts from "typescript";
import fs from "fs";
import path from "path";
import chokidar from "chokidar";

interface ZenithGeneratorConfig {
  islandsDir: string;
  outputDir: string;
  outputFile: string;
  watchMode: boolean;
  debugMode: boolean;
}

interface IslandInfo {
  name: string;
  propsInterface?: string;
  metadata?: any;
  dependencies?: string[];
  trustLevel?: string;
  execType?: string;
  ecsComponents?: string[];
  filePath?: string;
}

interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
  documentation?: string;
}

class ZenithJSXGenerator {
  private config: ZenithGeneratorConfig;
  private discoveredIslands = new Map<string, IslandInfo>();
  private islandProps = new Map<string, PropInfo[]>();
  private templateDirectives = new Set<string>();

  constructor(config: ZenithGeneratorConfig) {
    this.config = config;
  }

  /**
   * Main entry point for type generation
   */
  public async generate(): Promise<void> {
    try {
      console.log('🌊 ZenithKernel JSX Type Generator');
      console.log(`📁 Scanning: ${this.config.islandsDir}`);
      
      // Clear previous data
      this.discoveredIslands.clear();
      this.islandProps.clear();
      this.templateDirectives.clear();

      // Scan for islands
      await this.scanIslands();
      
      // Generate type definitions
      const typeDefinitions = this.generateZenithTypeDefinitions();
      
      // Write output file
      await this.writeTypeDefinitions(typeDefinitions);
      
      console.log(`✅ Generated JSX types → ${this.config.outputFile}`);
      console.log(`📊 Found ${this.discoveredIslands.size} islands with ${this.templateDirectives.size} unique directives`);
      
    } catch (error) {
      console.error('❌ Error generating JSX types:', error);
      throw error;
    }
  }

  /**
   * Enable watch mode for development
   */
  public async startWatchMode(): Promise<void> {
    console.log('👀 Watching for changes in .zenith.tsx files...');
    
    const watcher = chokidar.watch(
      path.join(this.config.islandsDir, '**/*.zenith.tsx'),
      { ignored: /node_modules/, persistent: true }
    );

    watcher
      .on('change', (filePath) => {
        console.log(`🔄 File changed: ${path.relative(this.config.islandsDir, filePath)}`);
        this.generate();
      })
      .on('add', (filePath) => {
        console.log(`➕ File added: ${path.relative(this.config.islandsDir, filePath)}`);
        this.generate();
      })
      .on('unlink', (filePath) => {
        console.log(`➖ File removed: ${path.relative(this.config.islandsDir, filePath)}`);
        this.generate();
      });

    // Initial generation
    await this.generate();
  }

  /**
   * Scan islands directory for .zenith.tsx files
   */
  private async scanIslands(): Promise<void> {
    await this.scanDirectory(this.config.islandsDir);
  }

  /**
   * Recursively scan directory for island files
   */
  private async scanDirectory(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️ Islands directory not found: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.name.endsWith('.zenith.tsx')) {
        await this.parseIslandFile(fullPath);
      }
    }
  }

  /**
   * Parse individual island file
   */
  private async parseIslandFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath, 
        content, 
        ts.ScriptTarget.Latest, 
        true, 
        ts.ScriptKind.TSX
      );

      const islandInfo = this.extractIslandInfo(sourceFile, filePath);
      if (islandInfo) {
        this.discoveredIslands.set(islandInfo.name, islandInfo);
        
        if (this.config.debugMode) {
          console.log(`🏝️ Found island: ${islandInfo.name}`);
        }
      }

      // Parse template directives and components
      this.parseTemplateDirectives(sourceFile);
      
    } catch (error) {
      console.error(`❌ Error parsing ${filePath}:`, error);
    }
  }

  /**
   * Extract island information from TypeScript AST
   */
  private extractIslandInfo(sourceFile: ts.SourceFile, filePath: string): IslandInfo | null {
    let islandName = path.basename(filePath, '.zenith.tsx');
    let metadata: any = {};
    let propsInterface: string | undefined;

    const visit = (node: ts.Node) => {
      // Look for metadata export
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.name.text === 'metadata') {
            metadata = this.extractMetadata(declaration.initializer);
          }
        }
      }

      // Look for props interface
      if (ts.isInterfaceDeclaration(node)) {
        const interfaceName = node.name.text;
        if (interfaceName.includes('Props')) {
          propsInterface = interfaceName;
          this.extractPropsFromInterface(node, islandName);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (metadata.name) {
      islandName = metadata.name;
    }

    return {
      name: islandName,
      propsInterface,
      metadata,
      dependencies: metadata.dependencies || [],
      trustLevel: metadata.trustLevel || 'local',
      execType: metadata.execType || 'local',
      ecsComponents: metadata.ecsComponents || [],
      filePath
    };
  }

  /**
   * Extract props from TypeScript interface
   */
  private extractPropsFromInterface(node: ts.InterfaceDeclaration, islandName: string): void {
    const props: PropInfo[] = [];

    for (const member of node.members) {
      if (ts.isPropertySignature(member)) {
        const propName = (member.name as ts.Identifier)?.text;
        const isOptional = member.questionToken !== undefined;
        const typeNode = member.type;
        
        if (propName && typeNode) {
          const propType = this.getTypeString(typeNode);
          const documentation = this.getJSDocComment(member);
          
          props.push({
            name: propName,
            type: propType,
            optional: isOptional,
            documentation
          });
        }
      }
    }

    this.islandProps.set(islandName, props);
  }

  /**
   * Parse template directives from JSX
   */
  private parseTemplateDirectives(sourceFile: ts.SourceFile): void {
    const visit = (node: ts.Node) => {
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        // Collect all directive attributes
        for (const attribute of node.attributes.properties) {
          if (ts.isJsxAttribute(attribute)) {
            const attrName = (attribute.name as ts.Identifier)?.text;
            if (this.isDirectiveAttribute(attrName)) {
              this.templateDirectives.add(attrName);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * Check if attribute is a ZenithKernel directive
   */
  private isDirectiveAttribute(name: string): boolean {
    return typeof name == "string" && (
      name.startsWith('zk-') ||
      name.startsWith('data-zk-') ||
      name.startsWith('ecs-') ||
      name.startsWith('data-ecs-') ||
      name.startsWith('hydration-') ||
      name.startsWith('data-hydration-') ||
      name.startsWith('v-') ||
      name.startsWith(':')
    );
  }

  /**
   * Generate comprehensive TypeScript definitions
   */
  private generateZenithTypeDefinitions(): string {
    const lines: string[] = [
      '// AUTO-GENERATED BY ZENITHKERNEL JSX TYPE GENERATOR',
      '// DO NOT EDIT THIS FILE MANUALLY',
      '',
      'import { HydraContext } from "../lib/hydra-runtime";',
      'import { Entity } from "../core/ECSManager";',
      '',
      '// ================================================',
      '// ZENITHKERNEL-SPECIFIC TYPE DEFINITIONS',
      '// ================================================',
      ''
    ];

    // Generate ZenithKernel base types
    lines.push(...this.generateZenithTypes());
    lines.push('');

    // Generate island-specific types
    lines.push(...this.generateIslandTypes());
    lines.push('');

    // Generate JSX namespace declaration
    lines.push(...this.generateJSXNamespace());

    return lines.join('\n');
  }

  /**
   * Generate ZenithKernel base types
   */
  private generateZenithTypes(): string[] {
    return [
      '// ================================================',
      '// ZENITHKERNEL BASE TYPES',
      '// ================================================',
      '',
      '/** ZenithKernel Hydra context for islands */',
      'export interface HydraProps {',
      '  /** Peer ID for ZK verification */',
      '  peerId?: string;',
      '  /** ZK proof for verification */',
      '  zkProof?: string;',
      '  /** Trust level requirement */',
      '  trustLevel?: "unverified" | "local" | "community" | "verified";',
      '  /** ECS entity binding */',
      '  ecsEntity?: Entity | string;',
      '  /** Manifest URL for remote components */',
      '  manifestUrl?: string;',
      '  /** Additional context data */',
      '  [key: string]: any;',
      '}',
      '',
      '/** ZK Gate component props */',
      'export interface ZKGateProps {',
      '  /** Required ZK proof */',
      '  zkProof: string;',
      '  /** Trust level requirement */',
      '  trustLevel?: "verified" | "community";',
      '  /** Fallback content when verification fails */',
      '  fallback?: React.ReactNode;',
      '  /** Children to render when verified */',
      '  children?: React.ReactNode;',
      '}',
      '',
      '/** ECS Binder component props */',
      'export interface ECSBinderProps {',
      '  /** Entity ID to bind */',
      '  entityId: Entity | string;',
      '  /** Component types to observe */',
      '  components?: string[];',
      '  /** Auto-create entity if not found */',
      '  autoCreate?: boolean;',
      '  /** Update strategy */',
      '  updateStrategy?: "reactive" | "polling" | "manual";',
      '  /** Children render function */',
      '  children?: (data: Record<string, any>) => React.ReactNode;',
      '}',
      '',
      '/** Template component props */',
      'export interface TemplateProps {',
      '  /** ZK proof requirement */',
      '  "zk-proof"?: string;',
      '  /** ZK trust level */',
      '  "zk-trust"?: "unverified" | "local" | "community" | "verified";',
      '  /** ZK entity binding */',
      '  "zk-entity"?: string;',
      '  /** ZK verification strategy */',
      '  "zk-strategy"?: "eager" | "lazy" | "manual";',
      '  /** ECS entity binding */',
      '  "ecs-entity"?: string;',
      '  /** ECS components to observe */',
      '  "ecs-components"?: string | string[];',
      '  /** ECS auto-create entity */',
      '  "ecs-auto-create"?: boolean;',
      '  /** ECS update strategy */',
      '  "ecs-update-strategy"?: "reactive" | "polling" | "manual";',
      '  /** Hydration strategy */',
      '  "hydration-strategy"?: "immediate" | "visible" | "interaction" | "idle" | "manual";',
      '  /** Hydration priority */',
      '  "hydration-priority"?: "high" | "normal" | "low";',
      '  /** Lazy hydration */',
      '  "hydration-lazy"?: boolean;',
      '  /** Hydration trigger */',
      '  "hydration-trigger"?: string;',
      '  /** Hydration debounce */',
      '  "hydration-debounce"?: number;',
      '  /** Template directives */',
      '  "v-if"?: string;',
      '  "v-for"?: string;',
      '  /** Dynamic bindings */',
      '  [key: `:${string}`]: any;',
      '  /** Data attributes */',
      '  [key: `data-${string}`]: any;',
      '  /** Children content */',
      '  children?: React.ReactNode;',
      '}',
      ''
    ];
  }

  /**
   * Generate island-specific types
   */
  private generateIslandTypes(): string[] {
    const lines: string[] = [
      '// ================================================',
      '// ISLAND-SPECIFIC TYPES',
      '// ================================================',
      ''
    ];

    for (const [islandName, props] of this.islandProps.entries()) {
      const island = this.discoveredIslands.get(islandName);
      if (!island) continue;

      lines.push(`/** Props for ${islandName} island */`);
      lines.push(`export interface ${islandName}Props {`);

      for (const prop of props) {
        if (prop.documentation) {
          lines.push(`  /** ${prop.documentation} */`);
        }
        const optional = prop.optional ? '?' : '';
        lines.push(`  ${prop.name}${optional}: ${prop.type};`);
      }

      // Add standard island props
      lines.push('  /** ZenithKernel Hydra context */');
      lines.push('  context?: HydraContext;');
      lines.push('  /** Additional props */');
      lines.push('  [key: string]: any;');
      lines.push('}');
      lines.push('');
    }

    return lines;
  }

  /**
   * Generate JSX namespace with intrinsic elements
   */
  private generateJSXNamespace(): string[] {
    const lines: string[] = [
      '// ================================================',
      '// JSX NAMESPACE EXTENSIONS',
      '// ================================================',
      '',
      'declare global {',
      '  namespace JSX {',
      '    interface IntrinsicElements {'
    ];

    // Add ZenithKernel-specific elements
    lines.push('      /** ZenithKernel Template wrapper */');
    lines.push('      Template: TemplateProps;');
    lines.push('      template: TemplateProps;');
    lines.push('');
    lines.push('      /** ZenithKernel Hydra component */');
    lines.push('      Hydra: HydraProps;');
    lines.push('      hydra: HydraProps;');
    lines.push('');
    lines.push('      /** ZK Gate component for conditional rendering */');
    lines.push('      ZKGate: ZKGateProps;');
    lines.push('      "zk-gate": ZKGateProps;');
    lines.push('');
    lines.push('      /** ECS Binder component for data binding */');
    lines.push('      ECSBinder: ECSBinderProps;');
    lines.push('      "ecs-binder": ECSBinderProps;');
    lines.push('');

    // Add discovered islands
    for (const [islandName, island] of this.discoveredIslands.entries()) {
      const propsType = `${islandName}Props`;
      const kebabName = this.toKebabCase(islandName);
      
      lines.push(`      /** ${islandName} island component */`);
      lines.push(`      ${islandName}: ${propsType};`);
      lines.push(`      "${kebabName}": ${propsType};`);
    }

    lines.push('    }');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export {};');

    return lines;
  }

  /**
   * Convert PascalCase to kebab-case
   */
  private toKebabCase(name: string): string {
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Extract metadata from AST node
   */
  private extractMetadata(node: ts.Expression | undefined): any {
    if (!node) return {};
    
    if (ts.isObjectLiteralExpression(node)) {
      const metadata: any = {};
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) {
          const key = (property.name as ts.Identifier)?.text;
          const value = this.extractLiteralValue(property.initializer);
          if (key) {
            metadata[key] = value;
          }
        }
      }
      return metadata;
    }
    
    return {};
  }

  /**
   * Extract literal value from AST node
   */
  private extractLiteralValue(node: ts.Expression): any {
    if (ts.isStringLiteral(node)) {
      return node.text;
    }
    if (ts.isNumericLiteral(node)) {
      return parseFloat(node.text);
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }
    if (node.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map(element => this.extractLiteralValue(element));
    }
    return node.getText();
  }

  /**
   * Get type string from TypeScript type node
   */
  private getTypeString(typeNode: ts.TypeNode): string {
    if (ts.isTypeLiteralNode(typeNode)) {
      return 'object';
    }
    if (ts.isArrayTypeNode(typeNode)) {
      return `${this.getTypeString(typeNode.elementType)}[]`;
    }
    return typeNode.getText();
  }

  /**
   * Get JSDoc comment from node
   */
  private getJSDocComment(node: ts.Node): string | undefined {
    const jsDocTags = ts.getJSDocTags(node);
    if (jsDocTags.length > 0) {
      return jsDocTags[0].comment?.toString();
    }
    return undefined;
  }

  /**
   * Write type definitions to file
   */
  private async writeTypeDefinitions(content: string): Promise<void> {
    // Ensure output directory exists
    fs.mkdirSync(this.config.outputDir, { recursive: true });
    
    // Write the file
    fs.writeFileSync(this.config.outputFile, content, 'utf-8');
  }
}

// ================================================
// CLI INTERFACE
// ================================================

function createConfig(): ZenithGeneratorConfig {
  const args = process.argv.slice(2);
  
  const islandsDir = args.find(arg => !arg.startsWith('--')) || 
                    path.resolve('src/modules/Rendering/islands');
  
  const outputDir = path.resolve('src/types');
  const outputFile = path.join(outputDir, 'zenith-jsx.d.ts');
  
  return {
    islandsDir: path.resolve(islandsDir),
    outputDir,
    outputFile,
    watchMode: args.includes('--watch'),
    debugMode: args.includes('--debug')
  };
}

async function main() {
  const config = createConfig();
  const generator = new ZenithJSXGenerator(config);

  try {
    if (config.watchMode) {
      await generator.startWatchMode();
      // Keep process alive in watch mode
      process.stdin.resume();
    } else {
      await generator.generate();
    }
  } catch (error) {
    console.error('❌ Failed to generate JSX types:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export type { ZenithJSXGenerator, ZenithGeneratorConfig };
