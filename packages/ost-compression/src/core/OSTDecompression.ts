/**
 * OST Decompression - STUB
 */

import { CompressionConfig } from '../types';

export class OSTDecompression {
  constructor(private config: CompressionConfig) {}
  
  async decode(data: Uint8Array, metadata: any): Promise<string> {
    console.log('🔄 OST decompression (stub)');
    return new TextDecoder().decode(data);
  }
}
