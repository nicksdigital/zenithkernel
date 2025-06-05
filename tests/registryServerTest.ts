import { ZenithKernel } from "@core/ZenithKernel";
// @ts-ignore
import { RegistryServer } from "@modules/RegistryServer";
import { readFileSync } from "fs";
// @ts-ignore
import { generateZKProof } from "@utils/generateProof";

async function testZKLogin() {
    const kernel = new ZenithKernel();
    kernel.registerModule({ id: "RegistryServer", onLoad: () => {}, onUnload: () => {} });

    // Simulate login flow
    const publicKey = readFileSync(".zenith/public.key", "utf8");
    const privateKey = readFileSync(".zenith/private.key", "utf8");
    const clientId = "TestClient";

    // Step 1: request challenge
    kernel.send("RegistryServer", {
        type: "auth/challenge",
        payload: { publicKey, replyTo: clientId }
    });

    kernel.update(); // run RegistryServer system

    const [challengeResponse] = kernel.receive(clientId);
    const challenge = challengeResponse.payload.nonce;

    // Step 2: generate ZKP proof
    const proof = await generateZKProof(challenge, privateKey);

    // Step 3: submit proof
    kernel.send("RegistryServer", {
        type: "auth/verify",
        payload: { publicKey, challenge, proof, replyTo: clientId }
    });

    kernel.update(); // run again

    const [verifyResponse] = kernel.receive(clientId);
    console.log("🔐 Verify Result:", verifyResponse);
}

testZKLogin().catch(console.error);
