/**
 * ZenithKernel Codec Package
 * 
 * High-performance codecs and compression algorithms for the ZenithKernel framework.
 * These codecs are designed for efficient serialization and deserialization of data
 * between the client and server, with a focus on performance and minimal payload size.
 */

// Import codec modules
import * as HydraOSTCodec from './HydraOSTCodec';
import * as OSTCompression from './OSTCompression';
import * as OSTPackReader from './OSTPackReader';
import * as OSTpack from './OSTpack';
import * as ParallelOSTCompressor from './ParallelOSTCompressor';

// Export as namespaces to avoid ambiguity
export {
  HydraOSTCodec,
  OSTCompression,
  OSTPackReader,
  OSTpack,
  ParallelOSTCompressor
};

// Export common types with explicit naming
export type {
  HydraCodecConfig,
  CompressionMetrics
} from './HydraOSTCodec';

export type {
  CompressionMethod,
  CompressedData
} from './OSTCompression';

// Export commonly used constants
export { COMPRESSION_METHODS } from './OSTCompression';
export { DefaultHydraCodec } from './HydraOSTCodec';

/**
 * Codec Package Version
 */
export const CODEC_VERSION = '0.1.0';
