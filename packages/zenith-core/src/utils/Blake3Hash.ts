// utils/Blake3Hash.ts

import { blake3 } from '@noble/hashes/blake3';
import { utf8ToBytes } from '@noble/hashes/utils';

/**
 * Computes a BLAKE3 keyed hash with a derived key based on a context string.
 * This replicates BLAKE3's context + key model using manual derivation.
 *
 * @param input - The data to hash (WASM module, etc.)
 * @param key - A 32-byte master key (Uint8Array)
 * @param context - A domain-specific context string (e.g. "ZenithKernel module verification")
 * @returns Hex string of the BLAKE3 digest
 */
export function computeBLAKE3Keyed(
    input: Uint8Array,
    key: Uint8Array,
    context: string
): string {
    if (key.length !== 32) throw new Error("Key must be 32 bytes");

    // Derive a context-specific key by hashing context + key
    const contextKeyInput = new Uint8Array([
        ...utf8ToBytes(context),
        ...key
    ]);
    const derivedKey = blake3(contextKeyInput).slice(0, 32);

    // Hash the input using the derived key
    const hash = blake3.create({ key: derivedKey });
    hash.update(input);
    return Buffer.from(hash.digest()).toString("hex");
}
