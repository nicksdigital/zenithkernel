/**
 * Raw Codec (No Compression) - STUB
 */

import { Codec, CodecResult } from '../types';

export class RawCodec implements Codec {
  async compress(data: string, options?: any): Promise<CodecResult> {
    console.log('🔄 Raw codec (no compression)');
    const compressed = new TextEncoder().encode(data);
    
    return {
      data: compressed,
      metadata: {
        algorithm: 'raw',
        originalSize: data.length,
        compressedSize: compressed.length
      }
    };
  }

  async decompress(data: Uint8Array, options?: any): Promise<string> {
    console.log('🔄 Raw codec decompression');
    return new TextDecoder().decode(data);
  }
}
