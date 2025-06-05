import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jsx } from '../../src/modules/Rendering/jsx-runtime';
import { HydraTrustBar } from '../../src/components/hydra/HydraTrustBar';

describe('HydraTrustBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render trust bar with basic hydra info', () => {
    const element = jsx(HydraTrustBar, {
      hydraId: 'test-hydra',
      peerId: 'peer123',
      execType: 'local',
      entry: 'TestComponent.tsx'
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.getAttribute('data-testid')).toBe('trust-bar-test-hydra');
    expect(element.textContent).toContain('test-hydra');
    expect(element.textContent).toContain('peer123');
    expect(element.textContent).toContain('local');
  });

  it('should show verified status when zkProof is provided', () => {
    const element = jsx(HydraTrustBar, {
      hydraId: 'verified-hydra',
      peerId: 'peer123',
      execType: 'remote',
      entry: 'VerifiedComponent.wasm',
      zkProof: 'proof_abc123'
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.textContent).toContain('Verified');
    expect(element.querySelector('[data-testid="verified-icon"]')).toBeTruthy();
  });

  it('should show unverified status when no zkProof is provided', () => {
    const element = jsx(HydraTrustBar, {
      hydraId: 'unverified-hydra',
      peerId: 'peer123',
      execType: 'remote',
      entry: 'UnverifiedComponent.wasm'
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.textContent).toContain('Unverified');
    expect(element.querySelector('[data-testid="unverified-icon"]')).toBeTruthy();
  });

  it('should show local trust level for local execution', () => {
    const element = jsx(HydraTrustBar, {
      hydraId: 'local-hydra',
      peerId: 'peer123',
      execType: 'local',
      entry: 'LocalComponent.tsx'
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.textContent).toContain('Local');
    expect(element.querySelector('[data-testid="trust-level-local"]')).toBeTruthy();
  });

  it('should display component entry information', () => {
    const element = jsx(HydraTrustBar, {
      hydraId: 'entry-test',
      peerId: 'peer123',
      execType: 'remote',
      entry: 'components/MyComponent.wasm'
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.textContent).toContain('components/MyComponent.wasm');
  });

  it('should handle click events and call onDetailsClick', () => {
    const mockOnDetailsClick = vi.fn();
    const element = jsx(HydraTrustBar, {
      hydraId: 'clickable-hydra',
      peerId: 'peer123',
      execType: 'local',
      entry: 'ClickableComponent.tsx',
      onDetailsClick: mockOnDetailsClick
    });

    expect(element).toBeInstanceOf(HTMLElement);
    element.click();
    expect(mockOnDetailsClick).toHaveBeenCalledWith('clickable-hydra');
  });

  it('should show different styles for different execution types', () => {
    const localElement = jsx(HydraTrustBar, {
      hydraId: 'style-test',
      peerId: 'peer123',
      execType: 'local',
      entry: 'Component.tsx'
    });

    expect(localElement).toBeInstanceOf(HTMLElement);
    expect(localElement.className).toContain('trust-bar-local');

    const remoteElement = jsx(HydraTrustBar, {
      hydraId: 'style-test',
      peerId: 'peer123',
      execType: 'remote',
      entry: 'Component.wasm'
    });

    expect(remoteElement).toBeInstanceOf(HTMLElement);
    expect(remoteElement.className).toContain('trust-bar-remote');

    const edgeElement = jsx(HydraTrustBar, {
      hydraId: 'style-test',
      peerId: 'peer123',
      execType: 'edge',
      entry: 'Component.wasm'
    });

    expect(edgeElement).toBeInstanceOf(HTMLElement);
    expect(edgeElement.className).toContain('trust-bar-edge');
  });

  it('should display trust score when provided', () => {
    const element = jsx(HydraTrustBar, {
      hydraId: 'score-test',
      peerId: 'peer123',
      execType: 'remote',
      entry: 'Component.wasm',
      trustScore: 85
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.textContent).toContain('Trust: 85%');
    expect(element.querySelector('[data-testid="trust-score-85"]')).toBeTruthy();
  });
});
