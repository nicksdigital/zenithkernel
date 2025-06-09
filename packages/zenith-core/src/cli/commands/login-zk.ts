import { readFileSync } from "fs";
import os from "os";
import { signMessage } from "../utils/quantum-sign";

export async function loginZK() {
    const publicKey = readFileSync("./vendors/zenith/python-tools/dilithium_public.key", "hex");

    // Get challenge from registry
    const res = await fetch("http://localhost:3030/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey })
    });



    const { nonce } = await res.json()

    // Sign challenge using Dilithium
    const signature = await signMessage(nonce);

    const verifyRes = await fetch("http://localhost:3030/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, challenge: nonce, proof: signature })
    });


    const result = await verifyRes.json();

    console.log("🔐 Login result:", result.token);
}
