// Jest setup file
import '@testing-library/jest-dom';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

global.cancelAnimationFrame = (handle: number): void => {
  clearTimeout(handle);
};

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.root = (options?.root ?? null) as Element | null;
    this.rootMargin = options?.rootMargin ?? '0px';
    this.thresholds = this.parseThresholds(options?.threshold);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }

  private parseThresholds(threshold: number | number[] | undefined): number[] {
    if (threshold === undefined) return [0];
    return Array.isArray(threshold) ? threshold : [threshold];
  }
}

global.IntersectionObserver = MockIntersectionObserver as any;

// Mock requestIdleCallback and cancelIdleCallback
global.requestIdleCallback = (callback: IdleRequestCallback): number => {
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 15 }), 0) as unknown as number;
};

global.cancelIdleCallback = (handle: number): void => {
  clearTimeout(handle);
};

// Mock performance.now()
//global.performance.now = jest.fn(() => Date.now());