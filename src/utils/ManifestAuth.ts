import { blake3 } from "@noble/hashes/blake3";
import { utf8ToBytes } from "@noble/hashes/utils";

export function hashManifestFields(manifest: object): Uint8Array {
    // @ts-ignore
    const input = JSON.stringify({
        // @ts-ignore
        id: manifest["id"],
        // @ts-ignore
        version: manifest["version"],
        // @ts-ignore
        blake3: manifest["blake3"],
        // @ts-ignore
        context: manifest["context"],
        // @ts-ignore
        permissions: manifest["permissions"],
        // @ts-ignore
        issuer: manifest["issuer"]
    });

    return blake3(utf8ToBytes(input));
}

export async function verifySignature(manifest: any, publicKey: Uint8Array): Promise<boolean> {
    const hash = hashManifestFields(manifest);
    const signature = Uint8Array.from(Buffer.from(manifest.signature, "hex"));
    return await crypto.subtle.verify(
        {name: "ECDSA", hash: {name: "SHA-256"}},
        publicKey as unknown as CryptoKey,
        signature,
        hash
    );
}
