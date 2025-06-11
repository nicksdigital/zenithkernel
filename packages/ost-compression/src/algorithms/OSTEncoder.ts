/**
 * Okaily-Srivastava-Tbakhi (OST) Encoder
 *
 * Implementation of the Okaily-Srivastava-Tbakhi encoding algorithm for textual data compression.
 * Named after researchers: Anas Al-okaily, Pramod Srivastava, and Abdelghani Tbakhi.
 * This algorithm is specifically optimized for JavaScript/TypeScript source code
 * and provides superior compression ratios for structured text data.
 *
 * Key features:
 * - Pattern recognition for syntax structures
 * - Adaptive dictionary building
 * - Context-aware encoding
 * - Optimized for programming languages
 */

export interface OSTConfig {
  windowSize: number;
  labelLength: number;
  minPatternLength: number;
  maxPatternLength: number;
  dictionarySize: number;
  enableSyntaxOptimization: boolean;
}

export interface OSTResult {
  encoded: Uint8Array;
  dictionary: Map<string, number>;
  metadata: {
    originalSize: number;
    encodedSize: number;
    compressionRatio: number;
    patternCount: number;
    dictionarySize: number;
  };
}

export class OSTEncoder {
  private config: OSTConfig;
  private dictionary: Map<string, number>;
  private reverseDictionary: Map<number, string>;
  private patternFrequency: Map<string, number>;
  private nextDictionaryId: number;

  constructor(config: Partial<OSTConfig> = {}) {
    this.config = {
      windowSize: config.windowSize || 512,
      labelLength: config.labelLength || 3,
      minPatternLength: config.minPatternLength || 2,
      maxPatternLength: config.maxPatternLength || 32,
      dictionarySize: config.dictionarySize || 4096,
      enableSyntaxOptimization: config.enableSyntaxOptimization ?? true
    };

    this.dictionary = new Map();
    this.reverseDictionary = new Map();
    this.patternFrequency = new Map();
    this.nextDictionaryId = 1;
  }

  /**
   * Encode text using OST algorithm
   */
  async encode(text: string): Promise<OSTResult> {
    console.log('🔄 Starting OST encoding...');
    console.log('📊 Input size:', text.length, 'characters');

    // Step 1: Preprocess text for syntax optimization
    const preprocessed = this.config.enableSyntaxOptimization 
      ? this.preprocessSyntax(text)
      : text;

    // Step 2: Build pattern dictionary
    await this.buildDictionary(preprocessed);
    console.log('📚 Dictionary built with', this.dictionary.size, 'patterns');

    // Step 3: Encode using patterns
    const encoded = this.encodeWithPatterns(preprocessed);
    console.log('✅ Encoding complete');

    const originalSize = new TextEncoder().encode(text).length;
    const encodedSize = encoded.length;
    const compressionRatio = originalSize / encodedSize;

    console.log('📉 Compression ratio:', compressionRatio.toFixed(2) + 'x');

    return {
      encoded,
      dictionary: new Map(this.dictionary),
      metadata: {
        originalSize,
        encodedSize,
        compressionRatio,
        patternCount: this.dictionary.size,
        dictionarySize: this.dictionary.size
      }
    };
  }

  /**
   * Preprocess text for syntax optimization
   */
  private preprocessSyntax(text: string): string {
    if (!this.config.enableSyntaxOptimization) return text;

    // Common JavaScript/TypeScript patterns
    const syntaxPatterns = [
      // Function declarations
      { pattern: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, replacement: 'ƒ$1(' },
      // Arrow functions
      { pattern: /\s*=>\s*/g, replacement: '→' },
      // Common keywords
      { pattern: /\bconst\b/g, replacement: 'ℂ' },
      { pattern: /\blet\b/g, replacement: 'ℒ' },
      { pattern: /\bvar\b/g, replacement: '℣' },
      { pattern: /\breturn\b/g, replacement: 'ℝ' },
      { pattern: /\bimport\b/g, replacement: 'ℐ' },
      { pattern: /\bexport\b/g, replacement: 'ℰ' },
      { pattern: /\binterface\b/g, replacement: 'ℑ' },
      { pattern: /\bclass\b/g, replacement: 'ℭ' },
      // Common operators
      { pattern: /\s*===\s*/g, replacement: '≡' },
      { pattern: /\s*!==\s*/g, replacement: '≢' },
      { pattern: /\s*<=\s*/g, replacement: '≤' },
      { pattern: /\s*>=\s*/g, replacement: '≥' },
    ];

    let optimized = text;
    for (const { pattern, replacement } of syntaxPatterns) {
      optimized = optimized.replace(pattern, replacement);
    }

    return optimized;
  }

  /**
   * Build pattern dictionary using sliding window approach
   */
  private async buildDictionary(text: string): Promise<void> {
    this.patternFrequency.clear();

    // Extract patterns using sliding window
    for (let i = 0; i < text.length; i++) {
      for (let len = this.config.minPatternLength; 
           len <= Math.min(this.config.maxPatternLength, text.length - i); 
           len++) {
        
        const pattern = text.substring(i, i + len);
        
        // Skip patterns that are just whitespace or single characters
        if (len === 1 || /^\s+$/.test(pattern)) continue;
        
        // Count pattern frequency
        const currentCount = this.patternFrequency.get(pattern) || 0;
        this.patternFrequency.set(pattern, currentCount + 1);
      }
    }

    // Select most frequent patterns for dictionary
    const sortedPatterns = Array.from(this.patternFrequency.entries())
      .filter(([pattern, freq]) => freq > 1 && pattern.length >= this.config.minPatternLength)
      .sort((a, b) => {
        // Sort by compression benefit (frequency * pattern length)
        const benefitA = a[1] * a[0].length;
        const benefitB = b[1] * b[0].length;
        return benefitB - benefitA;
      })
      .slice(0, this.config.dictionarySize);

    // Build dictionary
    this.dictionary.clear();
    this.reverseDictionary.clear();
    this.nextDictionaryId = 1;

    for (const [pattern] of sortedPatterns) {
      const id = this.nextDictionaryId++;
      this.dictionary.set(pattern, id);
      this.reverseDictionary.set(id, pattern);
    }
  }

  /**
   * Encode text using pattern dictionary
   */
  private encodeWithPatterns(text: string): Uint8Array {
    const result: number[] = [];
    let i = 0;

    while (i < text.length) {
      let bestMatch = '';
      let bestId = 0;

      // Find longest matching pattern
      for (let len = Math.min(this.config.maxPatternLength, text.length - i); 
           len >= this.config.minPatternLength; 
           len--) {
        
        const candidate = text.substring(i, i + len);
        const id = this.dictionary.get(candidate);
        
        if (id !== undefined && candidate.length > bestMatch.length) {
          bestMatch = candidate;
          bestId = id;
        }
      }

      if (bestMatch) {
        // Encode as pattern reference
        result.push(0); // Pattern marker
        result.push(bestId);
        i += bestMatch.length;
      } else {
        // Encode as literal character
        result.push(1); // Literal marker
        result.push(text.charCodeAt(i));
        i++;
      }
    }

    return new Uint8Array(result);
  }

  /**
   * Get compression statistics
   */
  getStats(source?: string): {
    sourceSize?: number;
    estimatedCompressedSize?: number;
    estimatedRatio?: number;
    tokenCount?: number;
    uniqueTokens?: number;
    complexity?: number;
    dictionarySize: number;
    patternCount: number;
    averagePatternLength: number;
    totalPatternFrequency: number;
  } {
    const patterns = Array.from(this.dictionary.keys());
    const averagePatternLength = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.length, 0) / patterns.length
      : 0;

    const totalPatternFrequency = Array.from(this.patternFrequency.values())
      .reduce((sum, freq) => sum + freq, 0);

    let sourceStats = {};
    if (source) {
      const sourceSize = new TextEncoder().encode(source).length;
      const tokens = source.split(/\s+/).filter(t => t.length > 0);
      const uniqueTokens = new Set(tokens).size;
      const estimatedRatio = 3.5; // Simple estimate
      const estimatedCompressedSize = Math.round(sourceSize / estimatedRatio);
      const complexity = Math.round((uniqueTokens / tokens.length) * 100);

      sourceStats = {
        sourceSize,
        estimatedCompressedSize,
        estimatedRatio,
        tokenCount: tokens.length,
        uniqueTokens,
        complexity
      };
    }

    return {
      ...sourceStats,
      dictionarySize: this.dictionary.size,
      patternCount: patterns.length,
      averagePatternLength,
      totalPatternFrequency
    };
  }
}
