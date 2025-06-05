import sys
from dilithium_py import ML_DSA_44

if len(sys.argv) != 4:
    print("Usage: verify.py <message> <signature_hex> <public_key_file>", file=sys.stderr)
    sys.exit(1)

msg = sys.argv[1].encode()
sig = bytes.fromhex(sys.argv[2])

with open(sys.argv[3], "rb") as f:
    pk = f.read()

if ML_DSA_44.verify(pk, msg, sig):
    print("OK")
else:
    print("FAIL")
    sys.exit(1)
