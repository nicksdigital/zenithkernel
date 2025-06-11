import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import os from "os";
import crypto from "crypto";
import { blake3 } from "@noble/hashes/blake3";

export async function login(_: any, flags: string[]) {
    const keyFlag = flags.find((f: string) => f === "--public-key");
    const keyIndex = flags.indexOf("--public-key");
    const pubPath = keyFlag && flags[keyIndex + 1];

    if (!pubPath || !existsSync(pubPath)) {
        console.error("❌ Usage: zenith login --public-key <file>");
        return;
    }

    const publicKey = readFileSync(pubPath, "utf8");
    const dir = join(os.homedir(), ".zenith");
    const privPath = join(dir, "private.key");

    if (!existsSync(dir)) mkdirSync(dir);

    // Derive private key material from public key seed (dev-purpose only — replace with secure keygen in prod)
    const seed = blake3(Buffer.from(publicKey));
    const keyPair = crypto.generateKeyPairSync("ec", {
        namedCurve: "P-256",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" }
    });

    writeFileSync(join(dir, "config.json"), JSON.stringify({
        registry: "https://registry.zenith.dev",
        publicKeyPath: pubPath
    }, null, 2));

    writeFileSync(privPath, keyPair.privateKey);
    writeFileSync(join(dir, "public.key"), keyPair.publicKey);

    console.log("🔐 Zenith key pair saved.");
}
