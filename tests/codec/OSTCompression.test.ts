/**
 * OSTCompression Tests
 * 
 * This file contains tests for the OST compression implementation,
 * covering functionality, performance, and edge cases.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OSTCompression, COMPRESSION_METHODS, type CompressedData } from '../../runtime/codec/OSTCompression';
import { readFileSync } from 'fs';
import { join } from 'path';

// Interface for compression metrics
interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  throughput: number;
  binCount: number;
  averageBinSize: number;
}

// Test fixtures for different data scenarios
const FIXTURES = {
  small: 'Hello, world! This is a small test string.',
  medium: 'a'.repeat(1000) + 'b'.repeat(1000) + 'c'.repeat(1000),
  large: readFileSync(join(__dirname, '../../package.json'), 'utf-8'),
  repeating: 'abcdefghijklmnopqrstuvwxyz'.repeat(100),
  binary: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).toString(),
  empty: '',
  special: '☕🚀💻📚🔥🌈'
};

describe('OSTCompression', () => {
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
      
      // Verify we're getting compression with ZSTD
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
      
      // Verify that the labels are of different lengths
      const shortLabels = Array.from(encodedShort.compressedBins.keys());
      const longLabels = Array.from(encodedLong.compressedBins.keys());
      
      if (shortLabels.length > 0 && longLabels.length > 0) {
        // Check a sample label length
        expect(shortLabels[0].split(' ')[0].length).toBe(2);
        expect(longLabels[0].split(' ')[0].length).toBe(4);
      }
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
    
    it('should be able to process data in reasonable time', async () => {
      const original = FIXTURES.large;
      
      const startTime = performance.now();
      const encoded = await codec.encode(original);
      const encodeTime = performance.now() - startTime;
      
      const decodeStartTime = performance.now();
      const decoded = await codec.decode(encoded);
      const decodeTime = performance.now() - decodeStartTime;
      
      expect(decoded).toBe(original);
      
      // Compression should be relatively fast for reasonably sized inputs
      expect(encodeTime).toBeLessThan(1000); // Less than 1 second
      expect(decodeTime).toBeLessThan(1000); // Less than 1 second
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
    
    it('should handle mixed content types', async () => {
      // Mix of text, numbers, special chars, and repetitive sections
      const mixedContent = 'normal text ' + 
                          '12345 ' + 
                          '!@#$%^&*() ' + 
                          'aaaaaaaa ' + 
                          JSON.stringify({a: 1, b: 2, c: [1,2,3]});
      
      const encoded = await codec.encode(mixedContent);
      const decoded = await codec.decode(encoded);
      
      expect(decoded).toBe(mixedContent);
    });
    
    it('should throw appropriate errors for invalid inputs', async () => {
      // Test with null input
      await expect(
        // @ts-expect-error - Testing invalid input
        codec.encode(null)
      ).rejects.toThrow();
      
      // Test with undefined input
      await expect(
        // @ts-expect-error - Testing invalid input
        codec.encode(undefined)
      ).rejects.toThrow();
    });
  });
});
