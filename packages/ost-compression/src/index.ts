/**
 * @zenithcore/ost-compression - Okaily-Srivastava-Tbakhi (OST) Encoding Algorithm
 *
 * Implementation of the Okaily-Srivastava-Tbakhi (OST) encoding algorithm
 * for textual data compression, specifically optimized for JavaScript/TypeScript
 * source code and ZenithKernel bundles.
 *
 * Named after researchers: Anas Al-okaily, Pramod Srivastava, and Abdelghani Tbakhi
 * Based on research: "A Novel Encoding Algorithm for Textual Data Compression"
 */

// Core compression classes
export { OSTCompression } from './core/OSTCompression';
export { OSTDecompression } from './core/OSTDecompression';
export { OSTAnalyzer } from './core/OSTAnalyzer';
export { OSTEncoder } from './algorithms/OSTEncoder';
export { OSTDecoder } from './algorithms/OSTDecoder';

// Import for internal use
import { OSTAnalyzer } from './core/OSTAnalyzer';

// Compression algorithms
export * from './algorithms';

// Codecs and utilities
export * from './codecs';
export * from './utils';

// Types and interfaces
export * from './types';

/**
 * Package version
 */
export const VERSION = '0.1.0';

/**
 * Package name
 */
export const PACKAGE_NAME = '@zenithcore/ost-compression';

/**
 * Supported compression methods
 */
export const COMPRESSION_METHODS = ['huffman', 'zstd', 'raw', 'hybrid'] as const;

/**
 * Default compression configuration
 */
export const DEFAULT_CONFIG = {
  method: 'ost' as const,
  labelLength: 3,
  windowLength: 512,
  enableOptimizations: true,
  preserveComments: false,
  minifyIdentifiers: true,
  treeshaking: true
};

/**
 * Quick compression utility
 */
export async function compress(
  source: string,
  options: Partial<typeof DEFAULT_CONFIG> = {}
): Promise<{
  compressed: Uint8Array;
  metadata: any;
  ratio: number;
}> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const { OSTEncoder } = await import('./algorithms/OSTEncoder');
  const encoder = new OSTEncoder({
    windowSize: config.windowLength,
    labelLength: config.labelLength,
    minPatternLength: 2,
    maxPatternLength: 32,
    dictionarySize: 4096,
    enableSyntaxOptimization: config.enableOptimizations
  });

  const result = await encoder.encode(source);

  return {
    compressed: result.encoded,
    metadata: result.metadata,
    ratio: result.metadata.compressionRatio
  };
}

/**
 * Quick decompression utility
 */
export async function decompress(
  compressed: Uint8Array,
  metadata: any
): Promise<string> {
  const { OSTDecoder } = await import('./algorithms/OSTDecoder');
  const decoder = new OSTDecoder();
  const ostResult = {
    encoded: compressed,
    dictionary: new Map(),
    metadata
  };
  return await decoder.decode(ostResult);
}

/**
 * Analyze source code for compression potential
 */
export function analyze(source: string): {
  size: number;
  tokens: number;
  complexity: number;
  estimatedRatio: number;
  recommendations: string[];
} {
  const analyzer = new OSTAnalyzer();
  return analyzer.analyze(source);
}
