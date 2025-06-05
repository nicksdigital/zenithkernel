#!/bin/bash

set -e

CIRCUIT="quantum_state_verifier"
PTAU="pot12_final.ptau"
ZKEY0="${CIRCUIT}_0000.zkey"
ZKEY="${CIRCUIT}.zkey"
INPUT="input.json"
WITNESS="witness.wtns"
WASM="quantum_state_verifier_js/${CIRCUIT}.wasm"

echo "🧹 Cleaning previous builds..."
rm -rf *.r1cs *.wasm *.sym *.zkey *.wtns *.json ${CIRCUIT}_js

echo "🔧 Compiling circuit..."
circom ${CIRCUIT}.circom --r1cs --wasm --sym --output .

echo "🔐 Setting up Phase 2..."
snarkjs groth16 setup ${CIRCUIT}.r1cs ${PTAU} ${ZKEY0}
snarkjs zkey contribute ${ZKEY0} ${ZKEY} --name="nick"

echo "📤 Exporting verification key..."
snarkjs zkey export verificationkey ${ZKEY} verification_key.json

echo "📥 Creating input.json..."
cat > ${INPUT} <<EOF
{
  "real": [707106781, 707106781, 0, 0, 0, 0, 0, 0],
  "imag": [0, 0, 0, 0, 0, 0, 0, 0]
}
EOF

echo "🧠 Calculating witness..."
snarkjs wtns calculate ${WASM} ${INPUT} ${WITNESS}

echo "🔎 Exporting witness to JSON..."
snarkjs wtns export json ${WITNESS} witness.json

NORM=$(jq -r '.[1]' witness.json)
echo "🧾 Using norm from witness: $NORM"
echo "[ \"$NORM\" ]" > public.json

echo "📜 Generating proof..."
snarkjs groth16 prove ${ZKEY} ${WITNESS} proof.json public.json


echo "✅ Verifying proof..."
snarkjs groth16 verify verification_key.json public.json proof.json
