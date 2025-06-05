export async function verifyZKP(publicKey: string, challenge: string, proof: string): Promise<boolean> {
    const proc = Bun.spawn([
        "python3",
        "./src/modules/RegistryServer/qzkp-verify.py",
        challenge,
        publicKey,
        proof
    ], {
        stdout: "pipe",
        stderr: "inherit"
    });

    const output = await new Response(proc.stdout).text();
    return output.trim() === "OK";
}
