const basePath = "./vendors/zenith/python-tools/";

export async function signMessage(message: string): Promise<string> {
    const proc = Bun.spawn([
        "python3",
        "./vendors/zenith/python-tools/sign.py",
        message,
        "./vendors/zenith/python-tools/dilithium_private.key"
    ], {
        stdout: "pipe",
        stderr: "inherit"
    });

    const output = await new Response(proc.stdout).text();
    return output.trim();
}


export async function verifyMessage(message: string, signature: string): Promise<boolean> {
    const proc = Bun.spawn([
        "python3",
        "./vendors/zenith/python-tools/verify.py",
        message,
        signature,
        "./vendors/zenith/python-tools/dilithium_public.key"
    ], {
        stdout: "pipe",
        stderr: "inherit"
    });

    const result = await new Response(proc.stdout).text();
    return result.trim() === "OK";
}
