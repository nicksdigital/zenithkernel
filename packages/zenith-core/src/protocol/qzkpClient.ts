import * as quantum from 'quantum-zkp-sdk';

/**
 * Calculates the entropy of a data chunk
 * @param chunk The data chunk as a Uint8Array
 * @returns Entropy value between 0 and 1
 */
function calculateEntropy(chunk: Uint8Array): number {
    // Count occurrences of each byte value
    const counts = new Array(256).fill(0);
    for (const byte of chunk) {
        counts[byte]++;
    }

    // Calculate entropy using Shannon's formula
    let entropy = 0;
    const length = chunk.length;

    for (const count of counts) {
        if (count === 0) continue;
        const probability = count / length;
        entropy -= probability * Math.log2(probability);
    }

    // Normalize to 0-1 range (max entropy for bytes is 8)
    return entropy / 8;
}



/**
 * Generates a zero-knowledge proof for a data chunk
 * @param chunk The data chunk as a Uint8Array
 * @param chunkId A unique identifier for the chunk
 * @returns Promise resolving to the proof object
 */
/**
 * Proof result interface
 */
export interface QZKProofResult {
    proof: any;
    publicSignals: any;
    zk?:any;
}

/**
 * Generates a zero-knowledge proof for a data chunk
 * @param chunk The data chunk as a Uint8Array
 * @param chunkId A unique identifier for the chunk
 * @returns Promise resolving to the proof object
 */
export async function generateZKProofFromChunk(chunk: Uint8Array, chunkId: string): Promise<any> {
    try {


         const {
             leader,
             keygen,
             consensus,
             consensusValid,
             zk
        }  = await quantum.runQuantumPipeline(chunk, 4);

        return {leader,keygen,consensus,consensusValid,zk};

    } catch (error:any) {
        throw new Error(`Failed to generate ZK proof: ${error.message}`);
    }
}

/**
 * Verifies a zero-knowledge proof for a data chunk
 * @param chunk The data chunk as a Uint8Array
 * @param proofResult The proof result to verify
 * @returns Promise resolving to a boolean indicating if the proof is valid
 */
export async function verifyZKProofForChunk(chunk: Uint8Array, proof:any, publicSignals:any): Promise<boolean> {
    try {

        // Verify the proof
      const valid = await quantum.verifyProof(proof, publicSignals, './verification_key.json')
        if (!valid) {
            throw new Error('Invalid ZK proof');
        }

        return true;
    } catch (error) {
        // @ts-ignore
        throw new Error(`Failed to verify ZK proof: ${error.message}`);
    }
}

/**
 * Batch processes multiple chunks to generate proofs
 * @param chunks Array of data chunks
 * @param chunkIds Array of chunk identifiers
 * @returns Promise resolving to an array of proof results
 */
export async function batchGenerateZKProofs(
    chunks: Uint8Array[],
    chunkIds: string[]
): Promise<any[]> {
    if (chunks.length !== chunkIds.length) {
        throw new Error('Number of chunks must match number of chunk IDs');
    }

    // Process chunks in parallel
    const promises = chunks.map((chunk, index) =>
        generateZKProofFromChunk(chunk, chunkIds[index])
    );

    return Promise.all(promises);
}
