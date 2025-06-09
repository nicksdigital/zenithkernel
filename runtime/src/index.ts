/**
 * ZenithKernel Runtime
 * 
 * Low-level runtime implementation for ZenithKernel framework
 * including high-performance codecs, compression algorithms, and hydration utilities.
 */

// Import and re-export codec functionality using namespaces
import * as HydraOSTCodec from '../codec/HydraOSTCodec';
import * as OSTCompression from '../codec/OSTCompression';
import * as OSTPackReader from '../codec/OSTPackReader';
import * as OSTpack from '../codec/OSTpack';
import * as ParallelOSTCompressor from '../codec/ParallelOSTCompressor';

// Import hydra runtime
import * as Hydra from '../hydra';

// Export namespaces
export {
  HydraOSTCodec,
  OSTCompression,
  OSTPackReader,
  OSTpack,
  ParallelOSTCompressor,
  Hydra
};

// Export common types directly
export type {
  HydraCodecConfig,
  CompressionMetrics
} from '../codec/HydraOSTCodec';

export type {
  CompressionMethod,
  CompressedData
} from '../codec/OSTCompression';

/**
 * Runtime Version
 */
export const VERSION = '0.1.0';
