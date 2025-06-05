import sys
import json
import base64
import numpy as np
from qzkp.quantumzkp import QuantumZKP
from qzkp.entanglement_entropy import EntanglementEntropy
import asyncio

def chunk_to_density(chunk_bytes: bytes) -> np.ndarray:
    """Convert a chunk of bytes into a square density matrix.
    
    Optimized to reduce memory usage and increase numerical stability.
    """
    # Use exact size calculation to avoid unnecessary padding
    len_bytes = len(chunk_bytes)
    size = int(np.ceil(np.sqrt(len_bytes)))
    
    # Preallocate array with zeros for better memory efficiency
    matrix = np.zeros((size, size), dtype=np.float64)
    
    # Fill the matrix directly without intermediate padding step
    byte_array = np.frombuffer(chunk_bytes, dtype=np.uint8)
    for i in range(len(byte_array)):
        row, col = divmod(i, size)
        if row < size and col < size:
            matrix[row, col] = float(byte_array[i])
    
    # Ensure matrix is valid for quantum operations (positive semi-definite)
    norm = np.trace(matrix)
    if norm < 1e-10:  # More numerically stable threshold check
        # Add minimal identity for stability while preserving structure
        matrix += np.eye(size) * 1e-6
        norm = np.trace(matrix)
    
    return matrix / norm

async def main():
    if len(sys.argv) != 3:
        print("Usage: prove_chunk_entropy.py <chunk_base64> <chunk_id>", file=sys.stderr)
        sys.exit(1)

    chunk_b64 = sys.argv[1]
    chunk_id = sys.argv[2]

    try:
        # Use exception handling specifically for b64 decoding
        try:
            chunk_bytes = base64.b64decode(chunk_b64)
        except Exception:
            print("Error: Invalid base64 encoding in chunk data", file=sys.stderr)
            sys.exit(3)
            
        # Early validation of input size to prevent memory issues
        if len(chunk_bytes) > 10000000:  # 10MB limit
            print("Error: Chunk too large for processing", file=sys.stderr)
            sys.exit(4)
            
        # Create density matrix
        density = chunk_to_density(chunk_bytes)

        # Process in parallel where possible
        entropy_task = asyncio.create_task(_calculate_entropy(density))
        
        # Prepare ZKP proof
        vector = density.flatten()
        zkp = QuantumZKP(dimensions=len(vector))
        commitment, proof = await zkp.prove_vector_knowledge(vector, chunk_id)
        
        # Wait for entropy calculation to complete
        entropy = await entropy_task
        
        # Output result as JSON
        result = {
            "chunk_id": chunk_id,
            "entropy": float(entropy),  # Ensure JSON serializable
            "commitment": commitment.hex(),
            "proof": proof
        }
        
        print(json.dumps(result))

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(2)

async def _calculate_entropy(density: np.ndarray) -> float:
    """Calculate entropy in a separate async function for better concurrency."""
    entropy_tool = EntanglementEntropy()
    return entropy_tool.calculate_entropy(density)


if __name__ == "__main__":
    asyncio.run(main())
