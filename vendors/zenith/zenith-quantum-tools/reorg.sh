#!/bin/bash

# === Create structure ===
mkdir -p circuits/module_verifier
mkdir -p circuits/quantum_state_verifier
mkdir -p artifacts/ptau
mkdir -p artifacts/zkeys
mkdir -p artifacts/proofs
mkdir -p logs
mkdir -p scripts
mkdir -p inputs
mkdir -p outputs

# === Move circuit files ===
mv module_verifier.r1cs module_verifier.sym module_verifier.wasm circuits/module_verifier/ 2>/dev/null
mv quantum_state_verifier.r1cs quantum_state_verifier.sym quantum_state_verifier.wasm circuits/quantum_state_verifier/ 2>/dev/null

# === Move ZKey files ===
mv *verifier_0000.zkey *verifier.zkey artifacts/zkeys/ 2>/dev/null

# === Move PTAU files ===
mv pot*.ptau artifacts/ptau/ 2>/dev/null

# === Move proof-related files ===
mv proof.json public.json witness.wtns witness.json artifacts/proofs/ 2>/dev/null

# === Move inputs/outputs ===
mv input.json inputs/ 2>/dev/null

# === Move logs ===
mv *.log logs/ 2>/dev/null

# === Leave TypeScript and config files in root ===
echo "✅ Zenith directory reorganized successfully."
