/**
 * Enhanced Test Setup for ZenithKernel SFC System
 * 
 * Configures the test environment with all necessary mocks and globals
 */

import 'intersection-observer';
import { vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { TestEnvironment } from './utils/test-helpers';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000/',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Assign DOM globals
global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;
global.Event = dom.window.Event;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;

// Ensure dispatchEvent is available on window
if (!global.window.dispatchEvent) {
  global.window.dispatchEvent = dom.window.dispatchEvent.bind(dom.window);
}

// Add performance API for benchmarks
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  } as any;
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}
global.IntersectionObserver = MockIntersectionObserver as any;

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}
global.ResizeObserver = MockResizeObserver as any;

// Mock MutationObserver
class MockMutationObserver {
  constructor(callback: any) {}
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
}
global.MutationObserver = MockMutationObserver as any;

// Mock Performance API with memory support
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000000
    },
    timeOrigin: Date.now()
  } as any;
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
});
global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  const storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: vi.fn((index: number) => Object.keys(storage)[index] || null)
  };
};

global.localStorage = createStorageMock() as any;
global.sessionStorage = createStorageMock() as any;

// Mock crypto for ZK proof generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    subtle: {}
  },
  writable: false
});

// Mock URL and URLSearchParams
global.URL = dom.window.URL;
global.URLSearchParams = dom.window.URLSearchParams;

// Mock File and FileReader for .zk file processing
global.File = class MockFile extends Blob {
  public readonly name: string;
  public readonly lastModified: number;
  public readonly webkitRelativePath: string = "";

  constructor(
    bits: BlobPart[],
    name: string,
    options: FilePropertyBag = {}
  ) {
    super(bits, options);
    this.name = name;
    this.lastModified = options.lastModified ?? Date.now();
  }

  // The following methods are part of the File interface
  arrayBuffer(): Promise<ArrayBuffer> {
    return super.arrayBuffer();
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return super.slice(start, end, contentType);
  }

  stream(): ReadableStream<Uint8Array> {
    return super.stream();
  }

  text(): Promise<string> {
    return super.text();
  }
};

global.FileReader = class MockFileReader extends EventTarget {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  
  readAsText(file: any) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = Array.isArray(file.bits) ? file.bits.join('') : String(file);
      this.dispatchEvent(new Event('load'));
    }, 0);
  }
  
  readAsDataURL(file: any) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = `data:${file.type || 'text/plain'};base64,${btoa(file.bits?.join('') || '')}`;
      this.dispatchEvent(new Event('load'));
    }, 0);
  }
} as any;

// Mock fetch for API calls
const fetchMock = vi.fn().mockImplementation((url: string, options: any = {}) => {
  const response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Map(),
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0)
  };
  
  return Promise.resolve(response);
});
// Add the required 'preconnect' property to match typeof fetch
(fetchMock as any).preconnect = vi.fn();

global.fetch = fetchMock as unknown as typeof fetch;

// Mock WebSocket
global.WebSocket = class MockWebSocket extends EventTarget {
  readyState = 1; // OPEN
  url: string;
  
  constructor(url: string) {
    super();
    this.url = url;
  }
  
  send(data: any) {
    // Mock send implementation
  }
  
  close() {
    this.readyState = 3; // CLOSED
  }
} as any;

// Mock console methods for tests
const originalConsole = global.console;
const consoleMethodNames = ['log', 'warn', 'error', 'info', 'debug'] as const;

// Store original console methods
const originalConsoleMethods = consoleMethodNames.reduce((acc, method) => {
  acc[method] = originalConsole[method];
  return acc;
}, {} as Record<string, any>);

// Mock fs for Node.js file system operations in tests
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(() => ({
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date()
  }))
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(() => Promise.resolve({
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date()
  })),
  access: vi.fn(),
  readdir: vi.fn(() => Promise.resolve([]))
}));

// Mock path module
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    resolve: vi.fn((...args) => args.join('/')),
    join: vi.fn((...args) => args.join('/')),
    relative: vi.fn((from, to) => to),
    basename: vi.fn((path, ext) => {
      const name = path.split('/').pop() || path;
      return ext ? name.replace(ext, '') : name;
    }),
    dirname: vi.fn((path) => path.split('/').slice(0, -1).join('/')),
    extname: vi.fn((path) => {
      const match = path.match(/\.[^.]*$/);
      return match ? match[0] : '';
    })
  };
});

// Mock glob for file pattern matching
vi.mock('glob', () => ({
  glob: vi.fn(() => Promise.resolve([])),
  globSync: vi.fn(() => [])
}));

// Setup test environment helpers
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Set up initial URL for JSDOM window
  const url = new URL('http://localhost:3000/');
  dom.reconfigure({ url: url.href });

  // Mock navigation methods without trying to redefine location
  // Create a new window object with mocked location
  const mockWindow = {
    ...global.window,
    location: {
      ...global.window.location,
      assign: vi.fn((url: string) => {
        dom.reconfigure({ url });
      }),
      replace: vi.fn((url: string) => {
        dom.reconfigure({ url });
      }),
      reload: vi.fn()
    }
  };

  // Replace the global window object
  global.window = mockWindow;

  // Ensure dispatchEvent is available on the new window object
  if (!global.window.dispatchEvent) {
    global.window.dispatchEvent = dom.window.dispatchEvent.bind(dom.window);
  }

  // Mock history methods
  global.window.history.pushState = vi.fn((state: any, title: string, url?: string) => {
    if (url) {
      dom.reconfigure({ url: new URL(url, global.window.location.href).href });
    }
  });

  global.window.history.replaceState = vi.fn((state: any, title: string, url?: string) => {
    if (url) {
      dom.reconfigure({ url: new URL(url, global.window.location.href).href });
    }
  });
  
  // Reset console to quiet mode for tests (unless explicitly testing console output)
  consoleMethodNames.forEach(method => {
    if (process.env.VITEST_CONSOLE_VERBOSE !== 'true') {
      global.console[method] = vi.fn();
    }
  });
  
  // Clear any timers
  vi.clearAllTimers();
  
  // Reset performance measurements
  if (performance.clearMarks) {
    performance.clearMarks();
  }
  if (performance.clearMeasures) {
    performance.clearMeasures();
  }
});

afterEach(() => {
  // Restore console methods
  consoleMethodNames.forEach(method => {
    global.console[method] = originalConsoleMethods[method];
  });
  
  // Clean up any event listeners
  document.removeEventListener = document.removeEventListener;
  window.removeEventListener = window.removeEventListener;
  
  // Clear any remaining timers
  vi.clearAllTimers();
  
  // Reset URL back to default
  window.history.replaceState({}, '', 'http://localhost:3000/');
});

// Add type declaration for __TEST_UTILS__ on globalThis
declare global {
  // eslint-disable-next-line no-var
  var __TEST_UTILS__: {
    createMockFile: (content: string, name?: string) => File;
    createMockEvent: (type: string, properties?: any) => Event;
    flushPromises: () => Promise<void>;
    waitForNextTick: () => Promise<void>;
    triggerResize: () => void;
    triggerVisibilityChange: (hidden?: boolean) => void;
  };
}

// Global test utilities
globalThis.__TEST_UTILS__ = {
  createMockFile: (content: string, name: string = 'test.zk') => {
    return new File([content], name, { type: 'text/plain' });
  },

  createMockEvent: (type: string, properties: any = {}) => {
    const event = new Event(type);
    Object.assign(event, properties);
    return event;
  },

  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0)),

  waitForNextTick: () => new Promise(resolve => process.nextTick(resolve)),

  triggerResize: () => {
    window.dispatchEvent(new Event('resize'));
  },

  triggerVisibilityChange: (hidden: boolean = false) => {
    Object.defineProperty(document, 'hidden', {
      value: hidden,
      writable: true
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }
};

// Error boundary for uncaught test errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Custom matchers for better assertions
expect.extend({
  toBeValidHTML(received: string) {
    // Basic HTML validation
    const openTags = (received.match(/<[^/][^>]*[^/]>/g) || []).length;
    const closeTags = (received.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (received.match(/<[^>]+\/>/g) || []).length;
    
    // Very basic check - for production use a real HTML parser
    const isValid = Math.abs(openTags - closeTags) <= selfClosingTags;
    
    return {
      message: () => `Expected HTML to be valid but found ${openTags} open tags and ${closeTags} close tags`,
      pass: isValid
    };
  },
  
  toContainZKDirectives(received: string, directives: string[]) {
    const missing = directives.filter(directive => !received.includes(directive));
    
    return {
      message: () => `Expected HTML to contain ZK directives: ${missing.join(', ')}`,
      pass: missing.length === 0
    };
  },
  
  toHavePerformanceWithin(received: number, max: number) {
    return {
      message: () => `Expected performance ${received}ms to be within ${max}ms`,
      pass: received <= max
    };
  }
});

// Add type declarations for custom matchers
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidHTML(): any;
      toContainZKDirectives(directives: string[]): any;
      toHavePerformanceWithin(max: number): any;
    }
  }
  
  interface Window {
    __TEST_UTILS__: {
      createMockFile: (content: string, name?: string) => File;
      createMockEvent: (type: string, properties?: any) => Event;
      flushPromises: () => Promise<void>;
      waitForNextTick: () => Promise<void>;
      triggerResize: () => void;
      triggerVisibilityChange: (hidden?: boolean) => void;
    };
  }
}

export { TestEnvironment };
