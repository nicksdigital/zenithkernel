import express from "express";
import { ZenithKernel } from "@core/ZenithKernel";


export function startHttpBridge(kernel: ZenithKernel) {
    const app = express();
    app.use(express.json());


    app.post("/auth/challenge", (req:any, res:any) => {
        const publicKey = req.body.publicKey;

        const clientId = "http-client-" + Date.now();

        kernel.send("RegistryServer", {
            type: "auth/challenge",
            payload: { publicKey, replyTo: clientId }
        });

        kernel.update();

        const x:any = kernel.receive(clientId);


        if (!x[0] || !x[0].payload) {
            return res.status(500).json({ error: "No response from RegistryServer" });
        }



        res.json(x[0].payload);
    });

    app.post("/auth/verify", async (req:any, res:any) => {
        const { publicKey, challenge, proof } = req.body;
        const clientId = "http-client-" + Date.now();

        kernel.send("RegistryServer", {
            type: "auth/verify",
            payload: { publicKey, challenge, proof, replyTo: clientId }
        });

        kernel.update();
        // @ts-ignore
        const [resp] = kernel.receive(clientId);

        if (!resp || !resp.payload) {
            return res.status(401).json({ error: "Invalid or no response from RegistryServer" });
        }



        res.json(resp.payload);
    });


    app.listen(3030, () => {
        console.log("🌐 Zenith HTTP bridge listening on http://localhost:3030");
    });
}
