import sys
from dilithium_py.ml_dsa import ML_DSA_44

if len(sys.argv) != 3:
    print("Usage: sign.py <message> <private_key_file>", file=sys.stderr)
    sys.exit(1)

msg = sys.argv[1].encode()
with open(sys.argv[2], "rb") as f:
    sk = f.read()

sig = ML_DSA_44.sign(sk, msg)
print(sig.hex())
