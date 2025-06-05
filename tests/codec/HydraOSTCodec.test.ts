/**
 * HydraOSTCodec Tests
 *
 * This file contains tests for the OST compression implementation used in Hydra components,
 * covering functionality, performance, and edge cases.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { OSTCompression, COMPRESSION_METHODS, type CompressedData } from '../../runtime/codec/OSTCompression';
import { readFileSync } from 'fs';
import { join } from 'path';

// Define an interface for metrics based on observed code
interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  throughput: number;
  binCount: number;
  averageBinSize: number;
}

// Test fixtures
const FIXTURES = {
  small: 'Hello, world! This is a small test string.',
  medium: 'a'.repeat(1000) + 'b'.repeat(1000) + 'c'.repeat(1000),
  large: readFileSync(join(__dirname, '../../package.json'), 'utf-8'),
  repeating: 'abcdefghijklmnopqrstuvwxyz'.repeat(100),
  binary: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).toString(),
  empty: '',
  special: '☕🚀💻📚🔥🌈'
};

describe('HydraOSTCodec', () => {
  let codec: OSTCompression;

  beforeEach(() => {
    // Create a fresh codec instance before each test
    codec = new OSTCompression({
      labelLength: 3,
      windowLength: 512,
      compressionMethod: COMPRESSION_METHODS.HUFFMAN,
      collectMetrics: true
    });
  });

  describe('Basic functionality', () => {
    it('should encode and decode simple strings correctly', async () => {
      const original = FIXTURES.small;
      const encoded = await codec.encode(original);
      const decoded = await codec.decode(encoded);

      expect(decoded).toBe(original);
    });

    it('should handle empty strings', async () => {
      const original = FIXTURES.empty;
      const encoded = await codec.encode(original);
      const decoded = await codec.decode(encoded);

      expect(decoded).toBe(original);
    });

    it('should handle special characters and emojis', async () => {
      const original = FIXTURES.special;
      const encoded = await codec.encode(original);
      const decoded = await codec.decode(encoded);

      expect(decoded).toBe(original);
    });

    it('should handle binary data', async () => {
      const original = FIXTURES.binary;
      const encoded = await codec.encode(original);
      const decoded = await codec.decode(encoded);

      expect(decoded).toBe(original);
    });
  });

  describe('Compression methods', () => {
    it('should compress using huffman method', async () => {
      const huffmanCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: true
      });

      const original = FIXTURES.medium;
      const encoded = await huffmanCodec.encode(original);
      const decoded = await huffmanCodec.decode(encoded);

      expect(decoded).toBe(original);

      // Verify we're getting compression with Huffman
      const metrics = encoded.metadata.metrics as CompressionMetrics;
      expect(metrics).toBeDefined();
      expect(metrics.compressionRatio).toBeGreaterThan(1);
    });

    it('should compress using zstd method', async () => {
      const zstdCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.ZSTD,
        collectMetrics: true
      });

      const original = FIXTURES.medium;
      const encoded = await zstdCodec.encode(original);
      const decoded = await zstdCodec.decode(encoded);

      expect(decoded).toBe(original);

      // Verify we're getting compression with zstd
      const metrics = encoded.metadata.metrics as CompressionMetrics;
      expect(metrics).toBeDefined();
      expect(metrics.compressionRatio).toBeGreaterThan(1);
    });

    it('should support raw (no compression) method', async () => {
      const rawCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.RAW,
        collectMetrics: true
      });

      // Test with highly repetitive data
      const repeatingData = FIXTURES.repeating;
      const encoded = await rawCodec.encode(repeatingData);
      const decoded = await rawCodec.decode(encoded);

      expect(decoded).toBe(repeatingData);

      // Verify metrics are collected
      const metrics = encoded.metadata.metrics as CompressionMetrics;
      expect(metrics).toBeDefined();
      // Raw mode shouldn't compress
      expect(metrics.compressionRatio).toBeCloseTo(1, 0.1);
    });
  });

  describe('Configuration options', () => {
    it('should respect window length configuration', async () => {
      const smallWindowCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 64, // Smaller window
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: true
      });

      const largeWindowCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 1024, // Larger window
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: true
      });

      const original = FIXTURES.large;

      // Test both codecs
      const encodedSmall = await smallWindowCodec.encode(original);
      const encodedLarge = await largeWindowCodec.encode(original);

      // Decode both versions
      const decodedSmall = await smallWindowCodec.decode(encodedSmall);
      const decodedLarge = await largeWindowCodec.decode(encodedLarge);

      // Both should decode correctly
      expect(decodedSmall).toBe(original);
      expect(decodedLarge).toBe(original);

      // Get metrics
      const metricsSmall = encodedSmall.metadata.metrics as CompressionMetrics;
      const metricsLarge = encodedLarge.metadata.metrics as CompressionMetrics;

      // Expect different bin counts due to window size difference
      expect(metricsSmall.binCount).not.toBe(metricsLarge.binCount);
    });

    it('should respect label length configuration', async () => {
      const shortLabelCodec = new OSTCompression({
        labelLength: 2, // Shorter labels
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: true
      });

      const longLabelCodec = new OSTCompression({
        labelLength: 4, // Longer labels
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: true
      });

      const original = FIXTURES.medium;

      // Test both codecs
      const encodedShort = await shortLabelCodec.encode(original);
      const encodedLong = await longLabelCodec.encode(original);

      // Both should decode correctly
      const decodedShort = await shortLabelCodec.decode(encodedShort);
      const decodedLong = await longLabelCodec.decode(encodedLong);

      expect(decodedShort).toBe(original);
      expect(decodedLong).toBe(original);
    });
  });

  describe('Performance and metrics', () => {
    it('should collect compression metrics when enabled', async () => {
      const metricsCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: true
      });

      const noMetricsCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: false
      });

      const original = FIXTURES.large;

      // Test with metrics
      const encodedWithMetrics = await metricsCodec.encode(original);
      const metrics = encodedWithMetrics.metadata.metrics as CompressionMetrics;

      // Test without metrics
      const encodedNoMetrics = await noMetricsCodec.encode(original);

      // Verify metrics collection
      expect(metrics).toBeDefined();
      expect(metrics.originalSize).toBeGreaterThan(0);
      expect(metrics.compressedSize).toBeGreaterThan(0);
      expect(metrics.compressionRatio).toBeGreaterThan(0);
      expect(metrics.compressionTime).toBeGreaterThan(0);

      // Verify no metrics were collected when disabled
      expect(encodedNoMetrics.metadata.metrics).toBeUndefined();
    });

    it('should achieve reasonable compression ratios for repetitive data', async () => {
      const original = 'a'.repeat(10000); // Highly compressible
      const encoded = await codec.encode(original);
      const decoded = await codec.decode(encoded);

      expect(decoded).toBe(original);

      const metrics = encoded.metadata.metrics as CompressionMetrics;
      expect(metrics).toBeDefined();
      // Highly repetitive data should compress very well
      expect(metrics.compressionRatio).toBeGreaterThan(5);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very large inputs', async () => {
      // Create a moderately large input (to keep the test fast)
      const largeInput = 'a'.repeat(100000) + 'b'.repeat(100000);

      // This should not throw
      const encoded = await codec.encode(largeInput);
      const decoded = await codec.decode(encoded);

      expect(decoded).toBe(largeInput);
    });

    it('should handle random data that compresses poorly', async () => {
      // Generate pseudo-random data that's hard to compress
      const randomData = Array.from(
        { length: 1000 },
        () => Math.random().toString(36).substring(2)
      ).join('');

      const encoded = await codec.encode(randomData);
      const decoded = await codec.decode(encoded);

      expect(decoded).toBe(randomData);

      // Random data shouldn't compress well
      const metrics = encoded.metadata.metrics as CompressionMetrics;
      expect(metrics).toBeDefined();
      // Compression ratio should be close to 1 for random data
      expect(metrics.compressionRatio).toBeLessThan(2);
    });
  });

  /**
   * Basic benchmarking for OSTCompression
   */
  describe('OSTCompression Benchmarks', () => {
    // Skip these tests in CI environments to avoid long-running tests
    it.skipIf(process.env.CI === 'true')('should benchmark different compression methods', async () => {
      const testData = FIXTURES.large;

      // Create codecs with different configurations
      const huffmanCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.HUFFMAN,
        collectMetrics: true
      });

      const zstdCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.ZSTD,
        collectMetrics: true
      });

      const rawCodec = new OSTCompression({
        labelLength: 3,
        windowLength: 512,
        compressionMethod: COMPRESSION_METHODS.RAW,
        collectMetrics: true
      });

      // Run encodings and collect metrics
      const huffmanResult = await huffmanCodec.encode(testData);
      const zstdResult = await zstdCodec.encode(testData);
      const rawResult = await rawCodec.encode(testData);

      // Get metrics
      const huffmanMetrics = huffmanResult.metadata.metrics as CompressionMetrics;
      const zstdMetrics = zstdResult.metadata.metrics as CompressionMetrics;
      const rawMetrics = rawResult.metadata.metrics as CompressionMetrics;

      // Verify all methods can decode correctly
      expect(await huffmanCodec.decode(huffmanResult)).toBe(testData);
      expect(await zstdCodec.decode(zstdResult)).toBe(testData);
      expect(await rawCodec.decode(rawResult)).toBe(testData);

      // Print summary
      console.log('\nCompression Method Comparison:');
      console.log(`- Huffman: ratio=${huffmanMetrics.compressionRatio.toFixed(2)}, time=${huffmanMetrics.compressionTime.toFixed(2)}ms`);
      console.log(`- ZSTD: ratio=${zstdMetrics.compressionRatio.toFixed(2)}, time=${zstdMetrics.compressionTime.toFixed(2)}ms`);
      console.log(`- Raw: ratio=${rawMetrics.compressionRatio.toFixed(2)}, time=${rawMetrics.compressionTime.toFixed(2)}ms`);
    }, 10000); // 10 second timeout for this benchmark
  });
});