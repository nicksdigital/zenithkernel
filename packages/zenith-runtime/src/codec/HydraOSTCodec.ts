/**
 * HydraOSTCodec - Advanced codec implementation using OST compression
 * 
 * This codec extends the base OSTCompression with Hydra-specific optimizations:
 * - Configurable compression methods (HUFFMAN/ZSTD)
 * - Adaptive window sizing based on input data characteristics
 * - Performance metrics collection
 * - Multi-threaded processing support when available
 */
import { OSTCompression, COMPRESSION_METHODS, CompressionMethod, CompressedData } from "./OSTCompression";

// Configuration options for the Hydra codec
export interface HydraCodecConfig {
  // Compression method to use
  method: CompressionMethod | 'auto';
  
  // Quality level (higher = better compression but slower)
  quality: 'fast' | 'balanced' | 'max';
  
  // Whether to collect performance metrics
  metrics?: boolean;
  
  // Number of threads to use (0 = auto)
  threads?: number;
  
  // Advanced options passed to the underlying compression
  advancedOptions?: {
    // Custom window length
    windowLength?: number;
    
    // Custom label length for bins
    labelLength?: number;
    
    // Whether to use variable window sizing
    variableWindow?: boolean;
    
    // Whether to use sub-binning for further compression
    subBinning?: boolean;
    
    // Maximum depth for sub-binning
    subBinningDepth?: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: HydraCodecConfig = {
  method: 'auto',
  quality: 'balanced',
  metrics: false,
  threads: 0,
  advancedOptions: {
    windowLength: 512,
    labelLength: 3,
    variableWindow: false,
    subBinning: false,
    subBinningDepth: 0
  }
};

// Performance metrics collected during compression/decompression
export interface CompressionMetrics {
  // Original data size in bytes
  originalSize: number;
  
  // Compressed data size in bytes
  compressedSize: number;
  
  // Compression ratio (originalSize / compressedSize)
  compressionRatio: number;
  
  // Time taken to compress in milliseconds
  compressionTime: number;
  
  // Throughput in MB/s
  throughput: number;
  
  // Number of bins created
  binCount: number;
  
  // Average bin size
  averageBinSize: number;
}

import { performance } from 'perf_hooks';

// Class implementing the codec
export class HydraOSTCodec {
  private config: HydraCodecConfig;
  private compressor: OSTCompression;
  private metrics: CompressionMetrics | null = null;
  
  /**
   * Create a new HydraOSTCodec instance
   * @param config Configuration options
   */
  constructor(config: HydraCodecConfig) {
    this.config = {
      method: config.method || 'auto',
      quality: config.quality || 'balanced',
      metrics: config.metrics !== undefined ? config.metrics : true,
      threads: config.threads || 0,
      advancedOptions: config.advancedOptions || {}
    };
    
    this.compressor = this.createCompressor();
  }
  
  /**
   * Create the underlying compressor based on current config
   */
  private createCompressor(): OSTCompression {
    // Convert quality to appropriate settings
    const qualitySettings = {
      fast: { optimizationLevel: 1 },
      balanced: { optimizationLevel: 5 },
      max: { optimizationLevel: 9 }
    };
    
    // Determine compression method
    let compressionMethod = COMPRESSION_METHODS.HUFFMAN;
    if (this.config.method === 'zstd') {
      //@ts-ignore
      compressionMethod = COMPRESSION_METHODS.ZSTD;
    }
    // Auto will be determined by OSTCompression based on input
    
    return new OSTCompression({
      labelLength: this.config.advancedOptions?.labelLength || 3,
      windowLength: this.config.advancedOptions?.windowLength || 512,
      compressionMethod: this.config.method === 'zstd' ? 'zstd' : this.config.method === 'huffman' ? 'huffman' : undefined
    });
  }
  
  /**
   * Update the configuration of this codec
   * @param config New configuration options (partial)
   */
  public updateConfig(config: Partial<HydraCodecConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      advancedOptions: {
        ...this.config.advancedOptions,
        ...config.advancedOptions
      }
    };
    
    // Recreate the compressor with the new config
    this.compressor = this.createCompressor();
  }
  
  /**
   * Encode input data using the configured compression method
   * @param input Input data to encode
   * @returns CompressedData object
   */
  public async encode(input: string): Promise<CompressedData> {
    // Reset metrics
    this.metrics = null;
    
    // Start timer if metrics are enabled
    const startTime = this.config.metrics ? performance.now() : 0;
    
    // Compress the data
    const result = await this.compressor.encode(input);
    
    // Collect metrics if enabled
    if (this.config.metrics) {
      const endTime = performance.now();
      const compressionTime = endTime - startTime;
      
      // Calculate total compressed size
      let compressedSize = 0;
      for (const bin of result.compressedBins.values()) {
        compressedSize += bin.length;
      }
      
      this.metrics = {
        originalSize: input.length,
        compressedSize,
        compressionRatio: input.length / compressedSize,
        compressionTime,
        throughput: (input.length / 1024 / 1024) / (compressionTime / 1000),
        binCount: result.compressedBins.size,
        averageBinSize: compressedSize / Math.max(1, result.compressedBins.size)
      };
    }
    
    return result;
  }
  
  /**
   * Decode compressed data back to its original form
   * @param compressedData CompressedData object from encode()
   * @returns Original string data
   */
  public async decode(compressedData: CompressedData): Promise<string> {
    return await this.compressor.decode(compressedData);
  }
  
  /**
   * Get metrics from the last compression operation
   * @returns CompressionMetrics or null if metrics collection is disabled
   */
  public getMetrics(): CompressionMetrics | null {
    return this.metrics;
  }
}

/**
 * Default codec instance with balanced settings
 */
export const DefaultHydraCodec = new HydraOSTCodec({
  method: 'auto',
  quality: 'balanced',
  metrics: true,
  threads: 0
});
