/**
 * Run the ECSManager benchmarks
 *
 * This script compiles and runs the ECSManager benchmarks
 */

import { execSync } from 'child_process';
import path from 'path';

// Compile the TypeScript files
console.log('Compiling TypeScript files...');
try {
  execSync('npx tsc src/core/__tests__/ECSManager.benchmark.ts --outDir dist/benchmarks --esModuleInterop --target ES2020 --module CommonJS', {
    stdio: 'inherit'
  });
  console.log('Compilation successful!\n');
} catch (error) {
  console.error('Compilation failed:', error);
  process.exit(1);
}

// Run the benchmark
console.log('Running benchmarks...');
try {
  execSync('node dist/benchmarks/src/core/__tests__/ECSManager.benchmark.js', {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Benchmark execution failed:', error);
  process.exit(1);
}
