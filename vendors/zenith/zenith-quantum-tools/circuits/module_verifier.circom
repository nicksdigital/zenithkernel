pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/eddsaposeidon.circom";

template ModuleVerifier() {
    // Public inputs
    signal input pubKey[2];
    signal input poseidonHash;

    // Private inputs
    signal input metadata[8];
    signal input R8[2];
    signal input S;

    component hash = Poseidon(8);
    for (var i = 0; i < 8; i++) {
        hash.inputs[i] <== metadata[i];
    }

    poseidonHash === hash.out;

    component sig = EdDSAPoseidonVerifier();
    sig.enabled <== 1;
    sig.Ax <== pubKey[0];
    sig.Ay <== pubKey[1];
    sig.R8x <== R8[0];
    sig.R8y <== R8[1];
    sig.S <== S;
    sig.M <== hash.out;
}

component main = ModuleVerifier();
