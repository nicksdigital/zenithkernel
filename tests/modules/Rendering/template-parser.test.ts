/**
 * Tests for ZenithTemplateParser
 * 
 * Tests the parsing of ZK directives, ECS bindings, and hydration configuration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ZenithTemplateParser } from '../../../packages/zenith-core/src/modules/Rendering/template-parser';

describe('ZenithTemplateParser', () => {
  let parser: ZenithTemplateParser;

  beforeEach(() => {
    parser = new ZenithTemplateParser({
      enableZKDirectives: true,
      enableECSDirectives: true,
      enableHydrationDirectives: true,
      strict: false
    });
  });

  describe('Basic Template Parsing', () => {
    it('should parse component name from template', () => {
      const template = '<CounterIsland prop="value">Content</CounterIsland>';
      const result = parser.parse(template);
      
      expect(result.componentName).toBe('CounterIsland');
    });

    it('should parse attributes correctly', () => {
      const template = '<div class="test" data-value="123">Content</div>';
      const result = parser.parse(template);
      
      expect(result.attributes).toEqual({
        class: 'test',
        'data-value': '123'
      });
    });

    it('should parse expressions from template content', () => {
      const template = '<div>{{ count }} items, {{ title }}</div>';
      const result = parser.parse(template);
      
      expect(result.expressions).toContain('count');
      expect(result.expressions).toContain('title');
    });
  });

  describe('Vue.js-style Directives', () => {
    it('should parse v-if directive', () => {
      const template = '<div v-if="isVisible">Content</div>';
      const result = parser.parse(template);
      
      expect(result.directives?.vIf).toBe('isVisible');
    });

    it('should parse v-for directive', () => {
      const template = '<div v-for="item in items">{{ item }}</div>';
      const result = parser.parse(template);
      
      expect(result.directives?.vFor).toEqual({
        item: 'item',
        iterable: 'items'
      });
    });

    it('should parse binding directives', () => {
      const template = '<div :class="dynamicClass" :data-id="itemId">Content</div>';
      const result = parser.parse(template);
      
      expect(result.directives?.bindings).toEqual({
        class: 'dynamicClass',
        'data-id': 'itemId'
      });
    });

    it('should handle invalid v-for syntax gracefully', () => {
      const template = '<div v-for="invalid syntax">Content</div>';
      
      expect(() => parser.parse(template)).not.toThrow();
      
      const result = parser.parse(template);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('ZK Directives', () => {
    it('should parse zk-proof directive', () => {
      const template = '<div zk-proof="zk:abc123">Content</div>';
      const result = parser.parse(template);
      
      expect(result.zkDirectives?.zkProof).toBe('zk:abc123');
    });

    it('should parse zk-trust directive', () => {
      const template = '<div zk-trust="verified">Content</div>';
      const result = parser.parse(template);
      
      expect(result.zkDirectives?.zkTrust).toBe('verified');
    });

    it('should parse zk-entity directive', () => {
      const template = '<div zk-entity="entity123">Content</div>';
      const result = parser.parse(template);
      
      expect(result.zkDirectives?.zkEntity).toBe('entity123');
    });

    it('should parse zk-strategy directive', () => {
      const template = '<div zk-strategy="lazy">Content</div>';
      const result = parser.parse(template);
      
      expect(result.zkDirectives?.zkStrategy).toBe('lazy');
    });

    it('should parse data-zk-* attributes', () => {
      const template = '<div data-zk-proof="zk:xyz789" data-zk-trust="local">Content</div>';
      const result = parser.parse(template);
      
      expect(result.zkDirectives?.zkProof).toBe('zk:xyz789');
      expect(result.zkDirectives?.zkTrust).toBe('local');
    });

    it('should validate zk-trust values', () => {
      const template = '<div zk-trust="invalid">Content</div>';
      const result = parser.parse(template);
      
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.includes('Invalid zk-trust value'))).toBe(true);
    });

    it('should validate zk-strategy values', () => {
      const template = '<div zk-strategy="invalid">Content</div>';
      const result = parser.parse(template);
      
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.includes('Invalid zk-strategy value'))).toBe(true);
    });
  });

  describe('ECS Directives', () => {
    it('should parse ecs-entity directive', () => {
      const template = '<div ecs-entity="123">Content</div>';
      const result = parser.parse(template);
      
      expect(result.ecsBindings?.ecsEntity).toBe('123');
    });

    it('should parse ecs-components as JSON array', () => {
      const template = '<div ecs-components=\'["Counter", "Health"]\'>Content</div>';
      const result = parser.parse(template);
      
      expect(result.ecsBindings?.ecsComponents).toEqual(['Counter', 'Health']);
    });

    it('should parse ecs-components as comma-separated string', () => {
      const template = '<div ecs-components="Counter, Health, Position">Content</div>';
      const result = parser.parse(template);
      
      expect(result.ecsBindings?.ecsComponents).toEqual(['Counter', 'Health', 'Position']);
    });

    it('should parse ecs-auto-create directive', () => {
      const template = '<div ecs-auto-create="true">Content</div>';
      const result = parser.parse(template);
      
      expect(result.ecsBindings?.ecsAutoCreate).toBe(true);
    });

    it('should parse ecs-update-strategy directive', () => {
      const template = '<div ecs-update-strategy="reactive">Content</div>';
      const result = parser.parse(template);
      
      expect(result.ecsBindings?.ecsUpdateStrategy).toBe('reactive');
    });

    it('should parse data-ecs-* attributes', () => {
      const template = '<div data-ecs-entity="456" data-ecs-components=\'["Transform"]\'>Content</div>';
      const result = parser.parse(template);
      
      expect(result.ecsBindings?.ecsEntity).toBe('456');
      expect(result.ecsBindings?.ecsComponents).toEqual(['Transform']);
    });
  });

  describe('Hydration Configuration', () => {
    it('should parse hydration-strategy directive', () => {
      const template = '<div hydration-strategy="visible">Content</div>';
      const result = parser.parse(template);
      
      expect(result.hydrationConfig?.strategy).toBe('visible');
    });

    it('should parse hydration-priority directive', () => {
      const template = '<div hydration-priority="high">Content</div>';
      const result = parser.parse(template);
      
      expect(result.hydrationConfig?.priority).toBe('high');
    });

    it('should parse hydration-lazy directive', () => {
      const template = '<div hydration-lazy="true">Content</div>';
      const result = parser.parse(template);
      
      expect(result.hydrationConfig?.lazy).toBe(true);
    });

    it('should parse hydration-trigger directive', () => {
      const template = '<div hydration-trigger="#trigger-button">Content</div>';
      const result = parser.parse(template);
      
      expect(result.hydrationConfig?.trigger).toBe('#trigger-button');
    });

    it('should parse hydration-debounce directive', () => {
      const template = '<div hydration-debounce="300">Content</div>';
      const result = parser.parse(template);
      
      expect(result.hydrationConfig?.debounce).toBe(300);
    });

    it('should validate hydration strategy values', () => {
      const template = '<div hydration-strategy="invalid">Content</div>';
      const result = parser.parse(template);
      
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.includes('Invalid hydration strategy'))).toBe(true);
    });
  });

  describe('Complex Templates', () => {
    it('should parse template with multiple directive types', () => {
      const template = `
        <CounterIsland 
          v-if="showCounter"
          :class="dynamicClass"
          zk-entity="counter123"
          zk-trust="verified"
          ecs-entity="123"
          ecs-components='["Counter", "Display"]'
          hydration-strategy="interaction"
          hydration-priority="high"
        >
          <div class="content">{{ count }} items</div>
        </CounterIsland>
      `;
      
      const result = parser.parse(template);
      
      expect(result.componentName).toBe('CounterIsland');
      expect(result.directives?.vIf).toBe('showCounter');
      expect(result.directives?.bindings?.class).toBe('dynamicClass');
      expect(result.zkDirectives?.zkEntity).toBe('counter123');
      expect(result.zkDirectives?.zkTrust).toBe('verified');
      expect(result.ecsBindings?.ecsEntity).toBe('123');
      expect(result.ecsBindings?.ecsComponents).toEqual(['Counter', 'Display']);
      expect(result.hydrationConfig?.strategy).toBe('interaction');
      expect(result.hydrationConfig?.priority).toBe('high');
      expect(result.expressions).toContain('count');
    });
  });

  describe('Utility Functions', () => {
    it('should validate ZK proof format', () => {
      expect(ZenithTemplateParser.validateZKProof('zk:abc123')).toBe(true);
      expect(ZenithTemplateParser.validateZKProof('zk:xyz789==')).toBe(true);
      expect(ZenithTemplateParser.validateZKProof('invalid')).toBe(false);
      expect(ZenithTemplateParser.validateZKProof('')).toBe(false);
    });

    it('should validate entity ID format', () => {
      expect(ZenithTemplateParser.validateEntityId('entity123')).toBe(true);
      expect(ZenithTemplateParser.validateEntityId('test-entity_456')).toBe(true);
      expect(ZenithTemplateParser.validateEntityId('invalid@entity')).toBe(false);
      expect(ZenithTemplateParser.validateEntityId('')).toBe(false);
    });

    it('should create HydraContext from parsed template', () => {
      const parsed = parser.parse(`
        <div zk-proof="zk:test123" zk-trust="local" ecs-entity="456">Content</div>
      `);
      
      const context = ZenithTemplateParser.createHydraContext(parsed, {
        peerId: 'test-peer'
      });
      
      expect(context.peerId).toBe('test-peer');
      expect(context.zkProof).toBe('zk:test123');
      expect(context.trustLevel).toBe('local');
      expect(context.ecsEntity).toBe(456);
    });

    it('should extract island configuration', () => {
      const parsed = parser.parse(`
        <div hydration-strategy="visible" hydration-priority="high" hydration-lazy="true">Content</div>
      `);
      
      const config = ZenithTemplateParser.extractIslandConfig(parsed);
      
      expect(config.strategy).toBe('visible');
      expect(config.priority).toBe('high');
      expect(config.lazy).toBe(true);
    });

    it('should get Zenith data attributes', () => {
      const parsed = parser.parse(`
        <div zk-proof="zk:test" ecs-entity="123" hydration-strategy="idle">Content</div>
      `);
      
      const dataAttrs = ZenithTemplateParser.getZenithDataAttributes(parsed);
      
      expect(dataAttrs['data-zk-proof']).toBe('zk:test');
      expect(dataAttrs['data-ecs-entity']).toBe('123');
      expect(dataAttrs['data-hydration-strategy']).toBe('idle');
    });
  });

  describe('Error Handling', () => {
    it('should handle parsing errors gracefully in non-strict mode', () => {
      const parser = new ZenithTemplateParser({ strict: false });
      const template = '<div invalid-directive="bad">Content</div>';
      
      expect(() => parser.parse(template)).not.toThrow();
    });

    it('should throw errors in strict mode', () => {
      const parser = new ZenithTemplateParser({ strict: true });
      const template = '<div zk-trust="invalid">Content</div>';
      
      expect(() => parser.parse(template)).toThrow();
    });

    it('should recover from parsing errors', () => {
      const template = '<div zk-trust="invalid" valid-attr="ok">Content</div>';
      const result = parser.parseWithRecovery(template);
      
      expect(result.attributes['valid-attr']).toBe('ok');
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Factory Methods', () => {
    it('should create minimal parser', () => {
      const minimal = ZenithTemplateParser.createMinimal();
      expect(minimal).toBeInstanceOf(ZenithTemplateParser);
    });

    it('should create strict parser', () => {
      const strict = ZenithTemplateParser.createStrict();
      expect(strict).toBeInstanceOf(ZenithTemplateParser);
    });
  });
});
