import 'intersection-observer';
import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Setup a DOM environment using jsdom
const dom = new JSDOM('', { url: 'http://localhost/' });

global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock vi.mock for fs module
vi.mock('fs', () => ({
  ...require('fs'),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));
