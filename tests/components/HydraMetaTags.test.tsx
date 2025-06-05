import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jsx } from '../../src/modules/Rendering/jsx-runtime';

describe('Hydra Meta Tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should create meta tags with proper attributes', () => {
    const element = jsx('meta', {
      title: 'Test Page',
      description: 'A test page for Hydra meta tags',
      keywords: ['test', 'hydra', 'meta'],
      author: 'Test Author',
      viewport: 'width=device-width, initial-scale=1',
      'og:title': 'OG Test Page',
      'og:description': 'OG Test Description',
      'og:image': 'https://example.com/image.jpg',
      'og:type': 'website',
      layout: 'default'
    });

    document.body.appendChild(element);

    // Verify meta container
    const container = document.querySelector('[data-hydra-meta="true"]');
    expect(container).toBeTruthy();
    expect(container?.getAttribute('data-hydra-layout')).toBe('default');

    // Verify standard meta tags
    expect(document.querySelector('meta[name="title"]')?.getAttribute('content'))
      .toBe('Test Page');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content'))
      .toBe('A test page for Hydra meta tags');
    expect(document.querySelector('meta[name="keywords"]')?.getAttribute('content'))
      .toBe('test, hydra, meta');
    expect(document.querySelector('meta[name="author"]')?.getAttribute('content'))
      .toBe('Test Author');
    expect(document.querySelector('meta[name="viewport"]')?.getAttribute('content'))
      .toBe('width=device-width, initial-scale=1');

    // Verify OpenGraph meta tags
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content'))
      .toBe('OG Test Page');
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content'))
      .toBe('OG Test Description');
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content'))
      .toBe('https://example.com/image.jpg');
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content'))
      .toBe('website');
  });

  it('should create safe script tags with security attributes', () => {
    const element = jsx('safeScript', {
      type: 'on_load',
      src: 'https://example.com/script.js',
      integrity: 'sha384-abc123',
      crossorigin: 'anonymous',
      nonce: 'random-nonce',
      async: true,
      defer: true
    });

    document.body.appendChild(element);

    const script = document.querySelector('script[data-hydra-script-type="on_load"]');
    expect(script).toBeTruthy();
    expect(script?.getAttribute('src')).toBe('https://example.com/script.js');
    expect(script?.getAttribute('integrity')).toBe('sha384-abc123');
    expect(script?.getAttribute('crossorigin')).toBe('anonymous');
    expect(script?.getAttribute('nonce')).toBe('random-nonce');
    expect(script?.hasAttribute('async')).toBe(true);
    expect(script?.hasAttribute('defer')).toBe(true);
  });

  it('should handle inline scripts', () => {
    const element = jsx('safeScript', {
      type: 'on_before_load',
      children: 'console.log("Hello from inline script");'
    });

    document.body.appendChild(element);

    const script = document.querySelector('script[data-hydra-script-type="on_before_load"]');
    expect(script).toBeTruthy();
    expect(script?.textContent).toBe('console.log("Hello from inline script");');
  });

  it('should create CSS tags with proper attributes', () => {
    const element = jsx('css', {
      href: 'https://example.com/styles.css',
      media: 'screen',
      integrity: 'sha384-xyz789',
      crossorigin: 'anonymous'
    });

    document.body.appendChild(element);

    const link = document.querySelector('link[rel="stylesheet"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com/styles.css');
    expect(link?.getAttribute('media')).toBe('screen');
    expect(link?.getAttribute('integrity')).toBe('sha384-xyz789');
    expect(link?.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('should handle inline styles', () => {
    const element = jsx('css', {
      children: `
        .test-class {
          color: blue;
          font-size: 16px;
        }
      `
    });

    document.body.appendChild(element);

    const style = document.querySelector('style');
    expect(style).toBeTruthy();
    expect(style?.textContent).toContain('.test-class');
    expect(style?.textContent).toContain('color: blue');
  });

  it('should combine all tags in a Hydra island', () => {
    const element = jsx('div', {
      children: [
        jsx('meta', {
          title: 'Island Page',
          layout: 'island-layout'
        }),
        jsx('css', {
          href: 'island-styles.css'
        }),
        jsx('safeScript', {
          type: 'on_load',
          src: 'island-script.js'
        }),
        jsx('Hydra', {
          type: 'island',
          id: 'test-island',
          entry: 'TestComponent.tsx',
          execType: 'local',
          children: [
            jsx('safeScript', {
              type: 'lifecycle_id',
              children: 'console.log("Island loaded");'
            })
          ]
        })
      ]
    });

    document.body.appendChild(element);

    // Verify meta
    expect(document.querySelector('[data-hydra-layout="island-layout"]')).toBeTruthy();

    // Verify CSS
    expect(document.querySelector('link[href="island-styles.css"]')).toBeTruthy();

    // Verify scripts
    expect(document.querySelector('script[src="island-script.js"]')).toBeTruthy();
    const template = document.querySelector('template[data-hydra-id="test-island"]') as HTMLTemplateElement | null;
    expect(template).toBeTruthy();
    const lifecycleScript = template?.content.querySelector('script[data-hydra-script-type="lifecycle_id"]');
    expect(lifecycleScript).toBeTruthy();

    // Verify Hydra island
    expect(template?.getAttribute('data-hydra-entry')).toBe('TestComponent.tsx');
  });
}); 