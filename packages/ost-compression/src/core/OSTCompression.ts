/**
 * OSTCompression - Core compression engine for Optimized Syntax Trees
 * 
 * This class implements advanced compression algorithms specifically designed
 * for JavaScript/TypeScript source code and syntax trees.
 */

import { CompressionConfig, CompressionResult, CompressionMethod } from '../types';
import { OSTEncoder, OSTConfig } from '../algorithms/OSTEncoder';
import { OSTDecoder } from '../algorithms/OSTDecoder';
import { SyntaxTreeOptimizer, TokenAnalyzer } from '../utils';

export class OSTCompression {
  private encoder: OSTEncoder;

  constructor(config: CompressionConfig = {}) {
    const ostConfig: OSTConfig = {
      windowSize: config.windowLength || 512,
      labelLength: config.labelLength || 3,
      minPatternLength: 2,
      maxPatternLength: 32,
      dictionarySize: 4096,
      enableSyntaxOptimization: config.enableOptimizations ?? true
    };

    this.encoder = new OSTEncoder(ostConfig);
  }

  /**
   * Encode source code using OST compression
   */
  async encode(source: string): Promise<CompressionResult> {
    const result = await this.encoder.encode(source);

    return {
      compressedBins: new Map([['main', result.encoded]]),
      metadata: {
        config: {
          method: 'ost' as CompressionMethod,
          labelLength: 3,
          windowLength: 512,
          enableOptimizations: true,
          preserveComments: false,
          minifyIdentifiers: true,
          treeshaking: true
        },
        originalSize: result.metadata.originalSize,
        compressedSize: result.metadata.encodedSize,
        ratio: result.metadata.compressionRatio,
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        algorithm: 'ost' as CompressionMethod,
        tokens: result.metadata.patternCount
      }
    };
  }



  /**
   * Get compression statistics for source
   */
  async getStats(source: string): Promise<{
    sourceSize: number;
    estimatedCompressedSize: number;
    estimatedRatio: number;
    tokenCount: number;
    uniqueTokens: number;
    complexity: number;
  }> {
    const stats = this.encoder.getStats(source);
    return {
      sourceSize: stats.sourceSize || 0,
      estimatedCompressedSize: stats.estimatedCompressedSize || 0,
      estimatedRatio: stats.estimatedRatio || 1,
      tokenCount: stats.tokenCount || 0,
      uniqueTokens: stats.uniqueTokens || 0,
      complexity: stats.complexity || 0
    };
  }
}
