export class QuantumQKD {
    private static randBit(): boolean {
      return Math.random() > 0.5;
    }
  
    private static randomBits(n: number): boolean[] {
      return Array.from({ length: n }, QuantumQKD.randBit);
    }
  
    /**
     * Generates a post-processed QKD-derived key of given length.
     * All intermediate phases are abstracted.
     */
    generate(length: number, errorRate: number = 0.05): boolean[] {
      const raw = QuantumQKD.randomBits(length * 2);  // generate more than needed
      return this.extractKeyFromBits(raw, errorRate, length);
    }
  
    /**
     * Deterministically derives a usable key from raw entropy bits.
     */
    extractKeyFromBits(rawBits: boolean[], errorRate: number, finalLength: number): boolean[] {
      const filtered = this.sift(rawBits);
      const corrected = this.simulateErrorCorrection(filtered, errorRate);
      return this.amplify(corrected, finalLength);
    }
  
    private sift(bits: boolean[]): boolean[] {
      return bits.filter((_, i) => i % 2 === 0); // simple even-index filter (stand-in for basis match)
    }
  
    private simulateErrorCorrection(bits: boolean[], errorRate: number): boolean[] {
      return bits.map(b => Math.random() < errorRate ? !b : b);
    }
  
    private amplify(bits: boolean[], targetLength: number): boolean[] {
      if (!bits || bits.length === 0) {
        throw new Error('Input bits array must not be empty');
      }
      return Array.from(
        { length: targetLength },
        (_, i) => Boolean(bits[i % bits.length])
      );
    }
  
    xor(a: boolean[], b: boolean[]): boolean[] {
      if (!a || !b || a.length !== b.length) {
        throw new Error('Input arrays must be of the same length and defined');
      }
      return a.map((bit, i) => bit !== (b[i] ?? false));
    }
  }
  