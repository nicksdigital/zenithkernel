import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateZKProofFromChunk, verifyZKProofForChunk, batchGenerateZKProofs } from '../../src/protocol/qzkpClient';

// Mock quantum-zkp-sdk
vi.mock('quantum-zkp-sdk', () => ({
  runQuantumPipeline: vi.fn().mockResolvedValue({
    leader: { id: 'mock-leader', data: 'mock-leader-data' },
    keygen: { key: 'mock-key', timestamp: Date.now() },
    consensus: { result: 'mock-consensus', votes: 4 },
    consensusValid: true,
    zk: {
      proof: 'mock-proof',
      publicSignals: ['mock-signal-1', 'mock-signal-2'],
      valid: true
    }
  }),
  verifyProof: vi.fn().mockResolvedValue(true)
}));

describe('qzkpClient', () => {
  const testChunk = new TextEncoder().encode('test data');
  const testChunkId = 'test-chunk-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateZKProofFromChunk', () => {
    it('should generate a ZK proof for a data chunk', async () => {
      const result = await generateZKProofFromChunk(testChunk, testChunkId);
      
      expect(result).toHaveProperty('leader');
      expect(result).toHaveProperty('keygen');
      expect(result).toHaveProperty('consensus');
      expect(result).toHaveProperty('consensusValid');
      expect(result).toHaveProperty('zk');
      expect(result.consensusValid).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const quantum = await import('quantum-zkp-sdk');
      vi.mocked(quantum.runQuantumPipeline).mockRejectedValueOnce(new Error('Mock error'));

      await expect(generateZKProofFromChunk(testChunk, testChunkId))
        .rejects.toThrow('Failed to generate ZK proof: Mock error');
    });
  });

  describe('verifyZKProofForChunk', () => {
    it('should verify a valid ZK proof', async () => {
      const mockProof = 'mock-proof';
      const mockPublicSignals = ['signal1', 'signal2'];

      const result = await verifyZKProofForChunk(testChunk, mockProof, mockPublicSignals);
      expect(result).toBe(true);
    });

    it('should handle invalid proofs', async () => {
      const quantum = await import('quantum-zkp-sdk');
      vi.mocked(quantum.verifyProof).mockResolvedValueOnce(false);

      const mockProof = 'invalid-proof';
      const mockPublicSignals = ['signal1', 'signal2'];

      await expect(verifyZKProofForChunk(testChunk, mockProof, mockPublicSignals))
        .rejects.toThrow('Invalid ZK proof');
    });

    it('should handle verification errors', async () => {
      const quantum = await import('quantum-zkp-sdk');
      vi.mocked(quantum.verifyProof).mockRejectedValueOnce(new Error('Verification error'));

      const mockProof = 'mock-proof';
      const mockPublicSignals = ['signal1', 'signal2'];

      await expect(verifyZKProofForChunk(testChunk, mockProof, mockPublicSignals))
        .rejects.toThrow('Failed to verify ZK proof: Verification error');
    });
  });

  describe('batchGenerateZKProofs', () => {
    it('should generate proofs for multiple chunks', async () => {
      const chunks = [
        new TextEncoder().encode('chunk1'),
        new TextEncoder().encode('chunk2'),
        new TextEncoder().encode('chunk3')
      ];
      const chunkIds = ['id1', 'id2', 'id3'];

      const results = await batchGenerateZKProofs(chunks, chunkIds);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('leader');
        expect(result).toHaveProperty('keygen');
        expect(result).toHaveProperty('consensus');
        expect(result).toHaveProperty('consensusValid');
        expect(result).toHaveProperty('zk');
      });
    });

    it('should throw error when chunks and IDs length mismatch', async () => {
      const chunks = [new TextEncoder().encode('chunk1')];
      const chunkIds = ['id1', 'id2'];

      await expect(batchGenerateZKProofs(chunks, chunkIds))
        .rejects.toThrow('Number of chunks must match number of chunk IDs');
    });

    it('should handle partial failures in batch processing', async () => {
      const quantum = await import('quantum-zkp-sdk');
      vi.mocked(quantum.runQuantumPipeline)
        .mockResolvedValueOnce({
          leader: { id: 'leader1' },
          keygen: { key: 'key1' },
          consensus: { result: 'consensus1' },
          consensusValid: true,
          zk: { proof: 'proof1', publicSignals: ['signal1'], valid: true }
        })
        .mockRejectedValueOnce(new Error('Failed for chunk 2'));

      const chunks = [
        new TextEncoder().encode('chunk1'),
        new TextEncoder().encode('chunk2')
      ];
      const chunkIds = ['id1', 'id2'];

      await expect(batchGenerateZKProofs(chunks, chunkIds))
        .rejects.toThrow('Failed to generate ZK proof: Failed for chunk 2');
    });
  });
});
