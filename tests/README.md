# ZenithKernel SFC Testing Guide

This comprehensive testing guide covers the ZenithKernel Single File Component (SFC) system testing strategy, tools, and best practices.

## Table of Contents

- [Overview](#overview)
- [Test Architecture](#test-architecture)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The ZenithKernel SFC system uses **Vitest** as the primary testing framework, providing:

- 🚀 **Fast execution** with native ESM support
- 🔄 **Hot Module Replacement** for test files
- 📊 **Built-in coverage** reporting
- 🎯 **TypeScript support** out of the box
- 🔍 **Snapshot testing** capabilities
- ⚡ **Parallel execution** for performance

### Key Components Tested

- **Template Parser** - ZK directives, ECS bindings, Vue-style directives
- **HTML Transformer** - Template rendering, context evaluation, security
- **Component SDK** - Controller lifecycle, state management, ECS integration
- **Vite Plugin** - .zk file processing, island discovery, HMR
- **Integration Workflows** - Complete SFC pipeline from parsing to runtime

## Test Architecture

```
tests/
├── benchmarks/           # Performance and load tests
├── e2e/                 # End-to-end workflow tests
├── islands/             # Island component integration tests
├── modules/             # Core module unit tests
│   └── Rendering/       # Template parsing and transformation
├── plugins/             # Vite plugin tests
├── sdk/                 # Component SDK tests
├── utils/               # Test utilities and helpers
├── setup.ts             # Global test setup
└── fixtures/            # Test data and mock files
```

### Test Coverage Areas

| Component | Coverage Target | Current |
|-----------|----------------|---------|
| Template Parser | 90% | ✅ |
| HTML Transformer | 85% | ✅ |
| Component SDK | 80% | ✅ |
| Vite Plugin | 75% | ✅ |
| Integration | 70% | ✅ |

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test type
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:benchmark

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode (no watch, with reports)
npm run test:ci
```

### Advanced Options

```bash
# Run tests with custom timeout
npm test -- --timeout 30000

# Run tests matching pattern
npm test -- --grep "template parser"

# Update snapshots
npm test -- --update-snapshots

# Verbose output
npm test -- --verbose

# Bail on first failure
npm test -- --bail
```

## Test Types

### 1. Unit Tests

**Location**: `tests/modules/`  
**Purpose**: Test individual components in isolation  
**Pattern**: `*.test.ts`

```typescript
// Example: Template Parser unit test
describe('ZenithTemplateParser', () => {
  it('should parse ZK directives correctly', () => {
    const parser = new ZenithTemplateParser();
    const result = parser.parse('<div zk-trust="local">Content</div>');
    
    expect(result.zkDirectives?.zkTrust).toBe('local');
  });
});
```

### 2. Integration Tests

**Location**: `tests/islands/`  
**Purpose**: Test component interactions and workflows  
**Pattern**: `*.integration.test.ts`

```typescript
// Example: CounterIsland integration test
describe('CounterIsland Integration', () => {
  it('should complete full SFC workflow', async () => {
    // Parse .zk file structure
    const parsed = parser.parse(zkTemplate);
    
    // Create component instance
    const controller = createCounterController(props, context);
    
    // Render template
    const html = await transformer.transform(parsed);
    
    expect(html).toContain('Counter Island');
  });
});
```

### 3. End-to-End Tests

**Location**: `tests/e2e/`  
**Purpose**: Test complete system workflows  
**Pattern**: `*.e2e.test.ts`

```typescript
// Example: Complete SFC pipeline test
describe('SFC System E2E', () => {
  it('should process .zk files through complete pipeline', async () => {
    // Plugin discovers files
    await plugin.buildStart();
    
    // Transform .zk to JS
    const transformed = await plugin.transform(zkContent);
    
    // Verify registry generation
    expect(registryContent).toContain('CounterIsland');
  });
});
```

### 4. Performance Tests

**Location**: `tests/benchmarks/`  
**Purpose**: Measure performance characteristics  
**Pattern**: `*.benchmark.test.ts`

```typescript
// Example: Performance benchmark
describe('Template Parser Performance', () => {
  it('should parse 1000 templates under 100ms', () => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      parser.parse(simpleTemplate);
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

## Writing Tests

### Test Structure

Follow the **AAA Pattern** (Arrange, Act, Assert):

```typescript
describe('Component', () => {
  describe('Method', () => {
    it('should do something when condition', () => {
      // Arrange - Set up test data and mocks
      const input = 'test data';
      const expected = 'expected result';
      
      // Act - Execute the code under test
      const result = component.method(input);
      
      // Assert - Verify the results
      expect(result).toBe(expected);
    });
  });
});
```

### Using Test Utilities

```typescript
import {
  createMockECSManager,
  createMockZenithKernel,
  TestDataGenerator
} from '@tests/utils/test-helpers';

describe('Component Test', () => {
  beforeEach(() => {
    // Setup mocks using utilities
    const ecsManager = createMockECSManager({
      entityCount: 10,
      components: { Counter: { value: 0 } }
    });
    
    const kernel = createMockZenithKernel({ ecsManager });
    setZenithReference(kernel);
  });
  
  it('should work with mock data', () => {
    const template = TestDataGenerator.zkTemplate({
      zkDirectives: { 'zk-trust': 'verified' }
    });
    
    // Test with generated data
  });
});
```

### Testing .zk Files

```typescript
describe('ZK File Processing', () => {
  it('should parse .zk file structure', () => {
    const zkContent = TestDataGenerator.zkFile({
      template: '<div>{{ count }}</div>',
      script: 'export default { count: 0 };',
      style: '.test { color: blue; }'
    });
    
    const { template, script, style } = parseZKFile(zkContent);
    
    expect(template).toContain('{{ count }}');
    expect(script).toContain('export default');
    expect(style).toContain('color: blue');
  });
});
```

### Testing Async Operations

```typescript
describe('Async Operations', () => {
  it('should handle async transformations', async () => {
    const template = parser.parse('<div>{{ asyncValue }}</div>');
    const context = {
      asyncValue: Promise.resolve('loaded')
    };
    
    const result = await transformer.transform(template);
    expect(result).toContain('loaded');
  });
  
  it('should timeout on slow operations', async () => {
    const slowPromise = new Promise(resolve => 
      setTimeout(resolve, 5000)
    );
    
    await expect(
      withTimeout(slowPromise, 1000)
    ).rejects.toThrow('timeout');
  });
});
```

### Testing Error Conditions

```typescript
describe('Error Handling', () => {
  it('should handle parsing errors gracefully', () => {
    const invalidTemplate = '<div unclosed';
    
    expect(() => parser.parse(invalidTemplate)).not.toThrow();
    
    const result = parser.parseWithRecovery(invalidTemplate);
    expect(result.errors).toBeDefined();
  });
  
  it('should render error placeholders', async () => {
    const template = parser.parse('<div>{{ invalidFunction() }}</div>');
    const transformer = new ZenithHtmlTransformer({}, {
      fallbackToPlaceholder: true
    });
    
    const result = await transformer.transform(template);
    expect(result).toContain('render-error-placeholder');
  });
});
```

## Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain the scenario
- **Follow naming conventions**: `should [action] when [condition]`
- **Keep tests focused** - one assertion per test when possible

### 2. Mocking Strategy

```typescript
// ✅ Good: Use test utilities for consistent mocks
const ecsManager = createMockECSManager();

// ❌ Avoid: Manual mocking every time
const ecsManager = {
  getAllEntities: vi.fn(() => []),
  getComponent: vi.fn(() => null)
  // ... manual setup
};
```

### 3. Data Management

```typescript
// ✅ Good: Use test data generators
const template = TestDataGenerator.complexTemplate(10);
const context = TestDataGenerator.componentContext();

// ❌ Avoid: Hardcoded test data
const template = '<div>hardcoded content</div>';
```

### 4. Async Testing

```typescript
// ✅ Good: Proper async/await usage
it('should handle async operations', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// ❌ Avoid: Missing await
it('should handle async operations', () => {
  const promise = asyncOperation();
  expect(promise).toBeDefined(); // Testing the promise, not the result
});
```

### 5. Performance Testing

```typescript
// ✅ Good: Meaningful performance assertions
it('should parse complex templates efficiently', () => {
  const iterations = 1000;
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    parser.parse(complexTemplate);
  }
  
  const avgTime = (performance.now() - start) / iterations;
  expect(avgTime).toBeLessThan(1); // Less than 1ms per parse
});
```

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- **Pull Requests** - All test types
- **Main Branch** - Full test suite + coverage
- **Release Tags** - Complete validation

### Coverage Requirements

- **Minimum 80%** overall coverage
- **90%** for critical components (parser, transformer)
- **Incremental coverage** - new code must be tested

### Performance Monitoring

- **Benchmark tests** run on every PR
- **Performance regression** detection
- **Memory usage** monitoring

## Troubleshooting

### Common Issues

#### Tests Timing Out

```bash
# Increase timeout globally
npm test -- --timeout 30000

# Or per test
it('slow test', async () => {
  // test code
}, { timeout: 30000 });
```

#### Mock Not Working

```typescript
// Ensure mocks are reset
beforeEach(() => {
  vi.clearAllMocks();
});

// Check mock setup
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
```

#### Coverage Not Accurate

```bash
# Clear coverage cache
npm run test:coverage -- --coverage.clean

# Check file patterns
npm run test:coverage -- --coverage.include="src/**/*.ts"
```

#### Memory Leaks in Tests

```typescript
// Clean up resources
afterEach(() => {
  vi.clearAllTimers();
  cleanup(); // Custom cleanup function
});
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=zenith:* npm test

# Verbose console output
VITEST_CONSOLE_VERBOSE=true npm test

# Node debugging
node --inspect-brk node_modules/.bin/vitest
```

### Performance Issues

```bash
# Disable parallel execution
npm test -- --no-threads

# Reduce worker count
npm test -- --pool.threads.maxThreads=2

# Profile test execution
npm test -- --reporter=verbose --benchmark
```

## Test Data and Fixtures

### Sample .zk Files

Located in `tests/fixtures/`:

- `simple-counter.zk` - Basic counter component
- `complex-dashboard.zk` - Multi-widget dashboard
- `ecommerce-product.zk` - Product listing component
- `invalid-syntax.zk` - Malformed for error testing

### Mock Data Sets

- **Small** (10 entities) - Unit tests
- **Medium** (100 entities) - Integration tests  
- **Large** (1000+ entities) - Performance tests

## Contributing

### Adding New Tests

1. **Choose appropriate test type** (unit/integration/e2e/benchmark)
2. **Use existing utilities** and patterns
3. **Follow naming conventions**
4. **Add meaningful assertions**
5. **Update coverage thresholds** if needed

### Test Review Checklist

- [ ] Tests cover happy path and error cases
- [ ] Async operations properly awaited
- [ ] Mocks properly configured and cleaned up
- [ ] Performance assertions where relevant
- [ ] Documentation updated if needed

---

For more information, see:
- [Vitest Documentation](https://vitest.dev/)
- [ZenithKernel SFC Guide](../README.md)
- [Component SDK Reference](../packages/zenith-sdk/README.md)
