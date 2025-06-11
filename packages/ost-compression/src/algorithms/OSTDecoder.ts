/**
 * Okaily-Srivastava-Tbakhi (OST) Decoder
 *
 * Decoder for the Okaily-Srivastava-Tbakhi encoding algorithm, capable of restoring
 * the original text from OST-encoded data and dictionary.
 * Named after researchers: Anas Al-okaily, Pramod Srivastava, and Abdelghani Tbakhi.
 */

import { OSTResult } from './OSTEncoder';

export class OSTDecoder {
  private dictionary: Map<number, string>;

  constructor() {
    this.dictionary = new Map();
  }

  /**
   * Decode OST-encoded data back to original text
   */
  async decode(ostResult: OSTResult): Promise<string> {
    console.log('🔄 Starting OST decoding...');
    console.log('📊 Encoded size:', ostResult.encoded.length, 'bytes');

    // Build reverse dictionary
    this.buildReverseDictionary(ostResult.dictionary);

    // Decode the data
    const decoded = this.decodeWithPatterns(ostResult.encoded);

    // Restore syntax if it was optimized
    const restored = this.restoreSyntax(decoded);

    console.log('✅ Decoding complete');
    console.log('📈 Restored size:', restored.length, 'characters');

    return restored;
  }

  /**
   * Build reverse dictionary from pattern dictionary
   */
  private buildReverseDictionary(patternDictionary: Map<string, number>): void {
    this.dictionary.clear();
    
    for (const [pattern, id] of patternDictionary.entries()) {
      this.dictionary.set(id, pattern);
    }
    
    console.log('📚 Reverse dictionary built with', this.dictionary.size, 'patterns');
  }

  /**
   * Decode data using pattern dictionary
   */
  private decodeWithPatterns(encoded: Uint8Array): string {
    const result: string[] = [];
    let i = 0;

    while (i < encoded.length) {
      const marker = encoded[i++];
      
      if (marker === 0) {
        // Pattern reference
        if (i >= encoded.length) break;
        
        const patternId = encoded[i++];
        const pattern = this.dictionary.get(patternId);
        
        if (pattern !== undefined) {
          result.push(pattern);
        } else {
          console.warn('⚠️ Unknown pattern ID:', patternId);
        }
      } else if (marker === 1) {
        // Literal character
        if (i >= encoded.length) break;
        
        const charCode = encoded[i++];
        result.push(String.fromCharCode(charCode));
      } else {
        console.warn('⚠️ Unknown marker:', marker);
        i++; // Skip unknown marker
      }
    }

    return result.join('');
  }

  /**
   * Restore syntax optimizations
   */
  private restoreSyntax(text: string): string {
    // Reverse the syntax optimizations applied during encoding
    const syntaxRestorations = [
      // Function declarations
      { pattern: /ƒ([a-zA-Z_$][a-zA-Z0-9_$]*)\(/g, replacement: 'function $1(' },
      // Arrow functions
      { pattern: /→/g, replacement: ' => ' },
      // Common keywords
      { pattern: /ℂ/g, replacement: 'const' },
      { pattern: /ℒ/g, replacement: 'let' },
      { pattern: /℣/g, replacement: 'var' },
      { pattern: /ℝ/g, replacement: 'return' },
      { pattern: /ℐ/g, replacement: 'import' },
      { pattern: /ℰ/g, replacement: 'export' },
      { pattern: /ℑ/g, replacement: 'interface' },
      { pattern: /ℭ/g, replacement: 'class' },
      // Common operators
      { pattern: /≡/g, replacement: ' === ' },
      { pattern: /≢/g, replacement: ' !== ' },
      { pattern: /≤/g, replacement: ' <= ' },
      { pattern: /≥/g, replacement: ' >= ' },
    ];

    let restored = text;
    for (const { pattern, replacement } of syntaxRestorations) {
      restored = restored.replace(pattern, replacement);
    }

    return restored;
  }

  /**
   * Validate decoded result against metadata
   */
  validateDecoding(decoded: string, metadata: OSTResult['metadata']): boolean {
    const decodedSize = new TextEncoder().encode(decoded).length;
    const expectedSize = metadata.originalSize;
    
    if (decodedSize !== expectedSize) {
      console.warn('⚠️ Size mismatch:', {
        decoded: decodedSize,
        expected: expectedSize
      });
      return false;
    }
    
    return true;
  }
}
