pragma circom 2.1.6;

template QuantumStateVerifier(N) {
    signal input real[N];
    signal input imag[N];
    signal output norm;

    signal partial[N + 1];
    partial[0] <== 0;

    signal r2[N];
    signal i2[N];

    for (var i = 0; i < N; i++) {
        r2[i] <== real[i] * real[i];
        i2[i] <== imag[i] * imag[i];
        partial[i + 1] <== partial[i] + r2[i] + i2[i];
    }

    norm <== partial[N];
}

component main = QuantumStateVerifier(8);
