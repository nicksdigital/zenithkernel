
import sys
import json
from qzkp import Prover

def main():
    if len(sys.argv) != 3:
        print("Usage: qzkp-wrapper.py <challenge> <private_key>", file=sys.stderr)
        sys.exit(1)

    challenge = sys.argv[1]
    private_key = sys.argv[2]

    prover = Prover(private_key)
    proof = prover.create_proof(challenge)

    print(json.dumps(proof))

if __name__ == "__main__":
    main()
