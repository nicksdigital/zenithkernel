#!/usr/bin/bash
set -e

CIRCUIT="circuits/module_verifier"
PTAU="pot14_final.ptau"

echo "🧹 Cleaning previous builds..."
rm -f ${CIRCUIT}.r1cs ${CIRCUIT}.wasm ${CIRCUIT}.zkey ${CIRCUIT}_0000.zkey circuits/verification_key.json

echo "🔧 Compiling Circom circuit..."
circom ${CIRCUIT}.circom --r1cs --wasm --sym -l node_modules

echo "🔐 Setting up ZK proving system..."
cp -rf *.r1cs module_verifier_js/*.wasm *.sym ${CIRCUIT}/
snarkjs groth16 setup circuits/module_verifier.r1cs ${PTAU} module_verifier_0000.zkey
snarkjs zkey contribute module_verifier_0000.zkey module_verifier.zkey --name="ModuleVerifier Contributor"

echo "📤 Exporting verification key..."
snarkjs zkey export verificationkey module_verifier.zkey circuits/verification_key.json

echo "✅ Setup complete."
