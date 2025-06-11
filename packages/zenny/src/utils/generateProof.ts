export async function generateZKProof(challenge: string, privateKey: string): Promise<string> {
    const proc = Bun.spawn(["python3", "./cli/qzkp-wrapper.py", challenge, privateKey], {
        stdout: "pipe",
        stderr: "inherit"
    });

    const output = await new Response(proc.stdout).text();

    try {
        const proof = JSON.parse(output.trim());
        return proof;
    } catch (e) {
        throw new Error("Failed to generate or parse ZK proof");
    }
}
