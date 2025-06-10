/**
 * Tests for ZenithHtmlTransformer
 * 
 * Tests the HTML transformation with ZK verification, ECS binding, and hydration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZenithHtmlTransformer, ZenithRenderContext, ZenithRenderOptions } from '../../../packages/zenith-core/src/modules/Rendering/zenith-html-transformer';
import { ZenithTemplateParser } from '../../../packages/zenith-core/src/modules/Rendering/template-parser';

// Mock ECS Manager
const mockECSManager = {
  dumpComponentMap: vi.fn(() => new Map([
    ['Counter', new Map([[123, { value: 42 }]])]
  ])),
  getAllEntities: vi.fn(() => [123, 456]),
  getComponent: vi.fn((entityId, componentType) => {
    if (entityId === 123 && componentType === 'Counter') {
      return { value: 42 };
    }
    return null;
  }),
  getEntitiesWithQuery: vi.fn(() => [123])
};

// Mock verify system
const mockVerifySystem = {
  verifyProof: vi.fn().mockResolvedValue(true),
  isVerified: vi.fn().mockReturnValue(true)
};

describe('ZenithHtmlTransformer', () => {
  let transformer: ZenithHtmlTransformer;
  let context: ZenithRenderContext;
  let options: ZenithRenderOptions;
  let parser: ZenithTemplateParser;

  beforeEach(() => {
    context = {
      ecsManager: mockECSManager as any,
      verifySystem: mockVerifySystem,
      zkContext: {
        peerId: 'test-peer'
      },
      testData: 'test-value',
      count: 10,
      title: 'Test Component',
      items: ['item1', 'item2', 'item3']
    };

    options = {
      enableZKVerification: true,
      enableECSBinding: true,
      enableHydrationConfig: true,
      zkVerificationTimeout: 1000,
      fallbackToPlaceholder: true,
      debugMode: true
    };

    transformer = new ZenithHtmlTransformer(context, options);
    parser = new ZenithTemplateParser();

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Basic Template Transformation', () => {
    it('should transform simple template', async () => {
      const template = parser.parse('<div class="test">{{ title }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('class="test"');
      expect(result).toContain('Test Component');
    });

    it('should interpolate expressions', async () => {
      const template = parser.parse('<div>Count: {{ count }}, Title: {{ title }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('Count: 10');
      expect(result).toContain('Title: Test Component');
    });

    it('should handle missing expressions gracefully', async () => {
      const template = parser.parse('<div>{{ missingValue }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('<div></div>');
    });

    it('should handle binding attributes', async () => {
      const template = parser.parse('<div :class="title" :data-count="count">Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('class="Test Component"');
      expect(result).toContain('data-count="10"');
    });
  });

  describe('Conditional Rendering (v-if)', () => {
    it('should render when v-if condition is true', async () => {
      context.showElement = true;
      const template = parser.parse('<div v-if="showElement">Visible content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('Visible content');
    });

    it('should not render when v-if condition is false', async () => {
      context.showElement = false;
      const template = parser.parse('<div v-if="showElement">Hidden content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toBe('');
    });

    it('should handle complex v-if expressions', async () => {
      context.user = { isAdmin: true };
      const template = parser.parse('<div v-if="user && user.isAdmin">Admin content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('Admin content');
    });
  });

  describe('List Rendering (v-for)', () => {
    it('should render list items', async () => {
      const template = parser.parse('<div v-for="item in items">{{ item }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('item1');
      expect(result).toContain('item2');
      expect(result).toContain('item3');
    });

    it('should provide index in v-for loops', async () => {
      const template = parser.parse('<div v-for="item in items">{{ index }}: {{ item }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('0: item1');
      expect(result).toContain('1: item2');
      expect(result).toContain('2: item3');
    });

    it('should handle empty arrays gracefully', async () => {
      context.emptyItems = [];
      const template = parser.parse('<div v-for="item in emptyItems">{{ item }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toBe('');
    });

    it('should handle non-array iterables gracefully', async () => {
      context.notArray = 'not an array';
      const template = parser.parse('<div v-for="item in notArray">{{ item }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toBe('');
    });
  });

  describe('ZK Verification', () => {
    it('should render when ZK verification passes', async () => {
      const template = parser.parse('<div zk-proof="zk:valid123">Verified content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('Verified content');
      expect(mockVerifySystem.verifyProof).toHaveBeenCalledWith('test-peer', 'zk:valid123');
    });

    it('should render placeholder when ZK verification fails', async () => {
      mockVerifySystem.verifyProof.mockResolvedValueOnce(false);
      const template = parser.parse('<div zk-proof="zk:invalid123">Should not see this</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('zk-verification-placeholder');
      expect(result).toContain('🔒 Verification Required');
      expect(result).not.toContain('Should not see this');
    });

    it('should handle ZK verification timeout', async () => {
      mockVerifySystem.verifyProof.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 2000))
      );
      
      transformer = new ZenithHtmlTransformer(context, { ...options, zkVerificationTimeout: 100 });
      const template = parser.parse('<div zk-proof="zk:timeout123">Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('zk-verification-placeholder');
    });

    it('should use entity ID from ZK directives', async () => {
      const template = parser.parse('<div zk-proof="zk:test123" zk-entity="custom-entity">Content</div>');
      await transformer.transform(template);
      
      expect(mockVerifySystem.verifyProof).toHaveBeenCalledWith('custom-entity', 'zk:test123');
    });

    it('should cache ZK verification results', async () => {
      const template = parser.parse('<div zk-proof="zk:cached123">Content</div>');
      
      // First call
      await transformer.transform(template);
      // Second call with same proof
      await transformer.transform(template);
      
      // Should only call verifyProof once due to caching
      expect(mockVerifySystem.verifyProof).toHaveBeenCalledTimes(1);
    });
  });

  describe('ECS Data Binding', () => {
    it('should bind ECS entity data to context', async () => {
      const template = parser.parse('<div ecs-entity="123" ecs-components=\'["Counter"]\'>Value: {{ Counter.value }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('Value: 42');
      expect(mockECSManager.dumpComponentMap).toHaveBeenCalled();
    });

    it('should add entity ID to context', async () => {
      const template = parser.parse('<div ecs-entity="123">Entity: {{ entityId }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('Entity: 123');
    });

    it('should handle missing ECS components gracefully', async () => {
      const template = parser.parse('<div ecs-entity="999" ecs-components=\'["NonExistent"]\'>{{ NonExistent.value }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('<div');
      expect(result).not.toContain('undefined');
    });

    it('should handle invalid entity IDs gracefully', async () => {
      const template = parser.parse('<div ecs-entity="invalid">{{ entityId }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('<div');
    });

    it('should work without ECS manager', async () => {
      const contextWithoutECS = { ...context };
      delete contextWithoutECS.ecsManager;
      
      const transformer = new ZenithHtmlTransformer(contextWithoutECS, options);
      const template = parser.parse('<div ecs-entity="123">Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('Content');
    });
  });

  describe('Hydration Configuration', () => {
    it('should apply hydration data attributes', async () => {
      const template = parser.parse(`
        <div hydration-strategy="visible" hydration-priority="high" hydration-lazy="true">
          Content
        </div>
      `);
      const result = await transformer.transform(template);
      
      expect(result).toContain('data-hydration-strategy="visible"');
      expect(result).toContain('data-hydration-priority="high"');
      expect(result).toContain('data-hydration-lazy="true"');
    });

    it('should add hydrate attribute when hydration is enabled', async () => {
      transformer = new ZenithHtmlTransformer(context, { ...options, hydrate: true });
      const template = parser.parse('<TestComponent>Content</TestComponent>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('data-hydrate="true"');
      expect(result).toContain('data-component="TestComponent"');
    });
  });

  describe('Helper Functions', () => {
    it('should provide zkVerify helper', async () => {
      const template = parser.parse('<div>{{ await zkVerify("zk:test123") }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('true');
      expect(mockVerifySystem.verifyProof).toHaveBeenCalledWith('test-peer', 'zk:test123');
    });

    it('should provide ecsGet helper', async () => {
      const template = parser.parse('<div>{{ ecsGet(123, "Counter").value }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('42');
    });

    it('should provide ecsHas helper', async () => {
      const template = parser.parse('<div>{{ ecsHas(123, "Counter") }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('true');
    });

    it('should provide ecsQuery helper', async () => {
      const template = parser.parse('<div>{{ ecsQuery("test-query").length }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('1');
      expect(mockECSManager.getEntitiesWithQuery).toHaveBeenCalledWith('test-query');
    });
  });

  describe('Error Handling', () => {
    it('should render error placeholder when fallback is enabled', async () => {
      const template = parser.parse('<div>{{ invalidExpression() }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('render-error-placeholder');
      expect(result).toContain('⚠️ Rendering Error');
    });

    it('should throw error when fallback is disabled', async () => {
      transformer = new ZenithHtmlTransformer(context, { ...options, fallbackToPlaceholder: false });
      const template = parser.parse('<div>{{ invalidExpression() }}</div>');
      
      await expect(transformer.transform(template)).rejects.toThrow();
    });

    it('should handle attribute binding errors gracefully', async () => {
      const template = parser.parse('<div :class="invalidFunction()">Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('class=""');
      expect(result).toContain('Content');
    });
  });

  describe('Client-only Rendering', () => {
    it('should render self-closing tag for client-only mode', async () => {
      transformer = new ZenithHtmlTransformer(context, { ...options, clientOnly: true, ssr: false });
      const template = parser.parse('<div class="test">Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('<div class="test" />');
      expect(result).not.toContain('Content');
    });
  });

  describe('Data Attributes Generation', () => {
    it('should generate ZK data attributes', async () => {
      const template = parser.parse('<div zk-proof="zk:test" zk-trust="local">Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('data-zk-proof="zk:test"');
      expect(result).toContain('data-zk-trust="local"');
    });

    it('should generate ECS data attributes', async () => {
      const template = parser.parse('<div ecs-entity="123" ecs-components=\'["Counter"]\'>Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('data-ecs-entity="123"');
      expect(result).toContain('data-ecs-components="[&quot;Counter&quot;]"');
    });
  });

  describe('Factory Methods', () => {
    it('should create minimal transformer', () => {
      const minimal = ZenithHtmlTransformer.createMinimal();
      expect(minimal).toBeInstanceOf(ZenithHtmlTransformer);
    });

    it('should create production transformer', () => {
      const production = ZenithHtmlTransformer.createProduction(context);
      expect(production).toBeInstanceOf(ZenithHtmlTransformer);
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML characters in attributes', async () => {
      context.unsafeValue = '<script>alert("xss")</script>';
      const template = parser.parse('<div :title="unsafeValue">Content</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should escape HTML characters in content', async () => {
      context.unsafeContent = '<script>alert("xss")</script>';
      const template = parser.parse('<div>{{ unsafeContent }}</div>');
      const result = await transformer.transform(template);
      
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complex template with all features', async () => {
      context.showItems = true;
      context.currentUser = { isVerified: true };
      
      const template = parser.parse(`
        <div 
          v-if="showItems"
          :class="currentUser.isVerified ? 'verified' : 'unverified'"
          zk-proof="zk:complex123"
          ecs-entity="123"
          ecs-components='["Counter"]'
          hydration-strategy="interaction"
        >
          <h2>{{ title }}</h2>
          <div v-for="item in items" :key="item">
            Item: {{ item }} (Count: {{ Counter.value }})
          </div>
        </div>
      `);
      
      const result = await transformer.transform(template);
      
      expect(result).toContain('class="verified"');
      expect(result).toContain('Test Component');
      expect(result).toContain('Item: item1 (Count: 42)');
      expect(result).toContain('data-hydration-strategy="interaction"');
      expect(mockVerifySystem.verifyProof).toHaveBeenCalledWith('test-peer', 'zk:complex123');
    });
  });
});
