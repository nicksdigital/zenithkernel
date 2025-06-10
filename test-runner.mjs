#!/usr/bin/env node

/**
 * ZenithKernel SFC Test Runner
 * 
 * Comprehensive test runner for the Single File Component system
 * Supports different test types, environments, and reporting options
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const TEST_TYPES = {
  unit: 'tests/**/*.test.ts',
  integration: 'tests/**/*.integration.test.ts',
  e2e: 'tests/e2e/**/*.test.ts',
  benchmark: 'tests/benchmarks/**/*.benchmark.test.ts'
};

const COVERAGE_THRESHOLDS = {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80
};

class TestRunner {
  constructor() {
    this.args = process.argv.slice(2);
    this.options = this.parseArgs();
  }

  parseArgs() {
    const options = {
      type: 'all',
      watch: false,
      coverage: false,
      verbose: false,
      ci: process.env.CI === 'true',
      reporter: 'default',
      timeout: 10000,
      parallel: true,
      bail: false,
      updateSnapshots: false
    };

    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];
      
      switch (arg) {
        case '--type':
        case '-t':
          options.type = this.args[++i] || 'all';
          break;
        
        case '--watch':
        case '-w':
          options.watch = true;
          break;
        
        case '--coverage':
        case '-c':
          options.coverage = true;
          break;
        
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        
        case '--ci':
          options.ci = true;
          break;
        
        case '--reporter':
        case '-r':
          options.reporter = this.args[++i] || 'default';
          break;
        
        case '--timeout':
          options.timeout = parseInt(this.args[++i]) || 10000;
          break;
        
        case '--no-parallel':
          options.parallel = false;
          break;
        
        case '--bail':
        case '-b':
          options.bail = true;
          break;
        
        case '--update-snapshots':
        case '-u':
          options.updateSnapshots = true;
          break;
        
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
        
        default:
          if (arg.startsWith('--')) {
            console.warn(`Unknown option: ${arg}`);
          }
      }
    }

    return options;
  }

  showHelp() {
    console.log(`
ZenithKernel SFC Test Runner

USAGE:
  npm run test [options]
  yarn test [options]

OPTIONS:
  -t, --type <type>        Test type to run (unit|integration|e2e|benchmark|all) [default: all]
  -w, --watch             Watch mode - re-run tests on file changes
  -c, --coverage          Generate coverage report
  -v, --verbose           Verbose output
  --ci                    CI mode - optimized for continuous integration
  -r, --reporter <type>   Reporter type (default|verbose|json|junit)
  --timeout <ms>          Test timeout in milliseconds [default: 10000]
  --no-parallel          Disable parallel test execution
  -b, --bail              Stop on first test failure
  -u, --update-snapshots  Update test snapshots
  -h, --help              Show this help message

EXAMPLES:
  npm run test                           # Run all tests
  npm run test -- --type unit           # Run only unit tests
  npm run test -- --watch --coverage    # Watch mode with coverage
  npm run test -- --type e2e --ci       # E2E tests in CI mode
  npm run test -- --type benchmark      # Run performance benchmarks

TEST TYPES:
  unit         - Unit tests for individual components
  integration  - Integration tests for component interactions
  e2e          - End-to-end tests for complete workflows
  benchmark    - Performance and benchmark tests
  all          - All test types (default)

COVERAGE:
  The test runner generates coverage reports in multiple formats:
  - Console output (during test run)
  - HTML report (coverage/index.html)
  - LCOV format (coverage/lcov.info)
  - JSON format (coverage/coverage.json)

ENVIRONMENT VARIABLES:
  CI=true                 - Enable CI mode
  VITEST_CONSOLE_VERBOSE  - Show console output in tests
  DEBUG=zenith:*          - Enable debug logging
    `);
  }

  async run() {
    console.log('🚀 ZenithKernel SFC Test Runner');
    console.log('================================\n');

    // Pre-flight checks
    await this.preflightChecks();

    // Build test command
    const {command, env} = this.buildCommand();

    console.log('Command:', command);
    
    // Run tests
    console.log(`Running tests: ${command.join(' ')}\n`);
    
    try {
      await this.executeCommand(command);
      
      if (this.options.coverage) {
        await this.generateCoverageReport();
      }
      
      console.log('\n✅ Tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Tests failed!');
      console.error(error.message);
      process.exit(1);
    }
  }

  async preflightChecks() {
    console.log('🔍 Running pre-flight checks...');

    // Check if vitest is installed
    try {
      execSync('npx vitest --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Vitest is not installed. Run: npm install -D vitest');
    }

    // Check if test files exist
    const testDir = path.join(__dirname, 'tests');
    if (!fs.existsSync(testDir)) {
      throw new Error('Tests directory not found');
    }

    // Validate test type
    if (this.options.type !== 'all' && !TEST_TYPES[this.options.type]) {
      throw new Error(`Invalid test type: ${this.options.type}`);
    }

    // Create necessary directories
    const directories = ['test-results', 'coverage'];
    directories.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    console.log('✅ Pre-flight checks passed\n');
  }

  buildCommand() {
    const command = ['npx', 'vitest'];

    // Test patterns
    if (this.options.type === 'all') {
      command.push('tests');
    } else {
      command.push(TEST_TYPES[this.options.type]);
    }

    // Watch mode
    if (this.options.watch && !this.options.ci) {
      command.push('--watch');
    } else {
      command.push('--run');
    }

    // Coverage
    if (this.options.coverage) {
      command.push('--coverage');
    }

    // Reporter
    if (this.options.ci) {
      command.push('--reporter=json', '--reporter=junit');
    } else if (this.options.verbose) {
      command.push('--reporter=verbose');
    }

    // Parallel execution
    if (!this.options.parallel) {
      command.push('--no-threads');
    }

    // Bail on first failure
    if (this.options.bail) {
      command.push('--bail=1');
    }

    // Update snapshots
    if (this.options.updateSnapshots) {
      command.push('--update');
    }

    // Timeout
    command.push(`--testTimeout=${this.options.timeout}`);

    // Environment variables
    const env = { ...process.env };
    
    if (this.options.verbose) {
      env.VITEST_CONSOLE_VERBOSE = 'true';
    }
    
    if (this.options.ci) {
      env.CI = 'true';
    }

    return { command, env };
  }

  async executeCommand({ command, env }) {
    return new Promise((resolve, reject) => {
      const child = spawn(command[0], command.slice(1), {
        stdio: 'inherit',
        env,
        cwd: __dirname
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start test process: ${error.message}`));
      });
    });
  }

  async generateCoverageReport() {
    console.log('\n📊 Generating coverage report...');

    const coverageDir = path.join(__dirname, 'coverage');
    
    if (fs.existsSync(coverageDir)) {
      const htmlReport = path.join(coverageDir, 'index.html');
      const lcovReport = path.join(coverageDir, 'lcov.info');
      
      console.log(`Coverage HTML report: file://${htmlReport}`);
      
      if (fs.existsSync(lcovReport)) {
        console.log(`Coverage LCOV report: ${lcovReport}`);
      }

      // Check coverage thresholds
      const jsonReport = path.join(coverageDir, 'coverage-final.json');
      if (fs.existsSync(jsonReport)) {
        this.checkCoverageThresholds(jsonReport);
      }
    }
  }

  checkCoverageThresholds(reportPath) {
    try {
      const coverage = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const summary = this.calculateCoverageSummary(coverage);

      console.log('\n📈 Coverage Summary:');
      console.log(`  Branches: ${summary.branches.toFixed(1)}%`);
      console.log(`  Functions: ${summary.functions.toFixed(1)}%`);
      console.log(`  Lines: ${summary.lines.toFixed(1)}%`);
      console.log(`  Statements: ${summary.statements.toFixed(1)}%`);

      const failing = [];
      Object.entries(COVERAGE_THRESHOLDS).forEach(([key, threshold]) => {
        if (summary[key] < threshold) {
          failing.push(`${key}: ${summary[key].toFixed(1)}% < ${threshold}%`);
        }
      });

      if (failing.length > 0) {
        console.log('\n⚠️  Coverage thresholds not met:');
        failing.forEach(fail => console.log(`  ${fail}`));
      } else {
        console.log('\n✅ All coverage thresholds met!');
      }

    } catch (error) {
      console.warn('Could not parse coverage report:', error.message);
    }
  }

  calculateCoverageSummary(coverage) {
    const totals = {
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      lines: { covered: 0, total: 0 },
      statements: { covered: 0, total: 0 }
    };

    Object.values(coverage).forEach(file => {
      if (file.b) {
        Object.values(file.b).forEach(branch => {
          totals.branches.total += branch.length;
          totals.branches.covered += branch.filter(hit => hit > 0).length;
        });
      }
      
      if (file.f) {
        Object.values(file.f).forEach(func => {
          totals.functions.total += 1;
          totals.functions.covered += func > 0 ? 1 : 0;
        });
      }
      
      if (file.s) {
        Object.values(file.s).forEach(stmt => {
          totals.statements.total += 1;
          totals.statements.covered += stmt > 0 ? 1 : 0;
        });
      }
    });

    return {
      branches: totals.branches.total > 0 ? (totals.branches.covered / totals.branches.total) * 100 : 100,
      functions: totals.functions.total > 0 ? (totals.functions.covered / totals.functions.total) * 100 : 100,
      lines: totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 100,
      statements: totals.statements.total > 0 ? (totals.statements.covered / totals.statements.total) * 100 : 100
    };
  }
}

// Run the test runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default TestRunner;
