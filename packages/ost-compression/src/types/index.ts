/**
 * Types and interfaces for OST Compression
 */

/**
 * Supported compression methods
 */
export type CompressionMethod = 'huffman' | 'zstd' | 'raw' | 'hybrid' | 'ost';

/**
 * Compression configuration
 */
export interface CompressionConfig {
  method?: CompressionMethod;
  labelLength?: number;
  windowLength?: number;
  enableOptimizations?: boolean;
  preserveComments?: boolean;
  minifyIdentifiers?: boolean;
  treeshaking?: boolean;
}

/**
 * Compression result
 */
export interface CompressionResult {
  compressedBins: Map<string, Uint8Array>;
  metadata: CompressionMetadata;
}

/**
 * Compression metadata
 */
export interface CompressionMetadata {
  config: Required<CompressionConfig>;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  timestamp: string;
  version: string;
  algorithm: CompressionMethod;
  tokens: number;
}

/**
 * Decompression result
 */
export interface DecompressionResult {
  source: string;
  metadata: CompressionMetadata;
}

/**
 * Token information
 */
export interface Token {
  type: TokenType;
  value: string;
  position: number;
  length: number;
}

/**
 * Token types
 */
export type TokenType = 
  | 'keyword'
  | 'identifier'
  | 'literal'
  | 'operator'
  | 'punctuation'
  | 'comment'
  | 'whitespace'
  | 'string'
  | 'number'
  | 'regex';

/**
 * Codec interface
 */
export interface Codec {
  compress(data: string, options?: any): Promise<CodecResult>;
  decompress(data: Uint8Array, options?: any): Promise<string>;
}

/**
 * Codec result
 */
export interface CodecResult {
  data: Uint8Array;
  dictionary?: Uint8Array;
  metadata?: any;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  size: number;
  tokens: number;
  complexity: number;
  estimatedRatio: number;
  recommendations: string[];
}

/**
 * Optimization options
 */
export interface OptimizationOptions {
  minifyIdentifiers: boolean;
  removeComments: boolean;
  treeshaking: boolean;
  deadCodeElimination: boolean;
  constantFolding: boolean;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  method: CompressionMethod;
  sourceSize: number;
  compressedSize: number;
  ratio: number;
  compressionTime: number;
  decompressionTime: number;
  memoryUsage: number;
}

/**
 * Statistics
 */
export interface CompressionStats {
  sourceSize: number;
  estimatedCompressedSize: number;
  estimatedRatio: number;
  tokenCount: number;
  uniqueTokens: number;
  complexity: number;
}
