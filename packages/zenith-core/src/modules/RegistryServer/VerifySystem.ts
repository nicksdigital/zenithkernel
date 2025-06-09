import { verifyZKP } from "./zkp";
import { getNonce, invalidateNonce } from "./ChallengeSystem";
import type {VerifySystemInterface} from "./RegistryServer"
import { ExposeRest } from "@decorators/ExposeRest";
import { SystemComponent } from "@decorators/SystemComponent";
import { BaseSystem } from "@core/BaseSystem";

export async function handleVerifyRequest(kernel:any, msg:any): Promise<boolean | void> {
    const { publicKey, challenge, proof, replyTo } = msg.payload;
    const expected = getNonce(publicKey);

    if (expected !== challenge) {
        kernel.send(replyTo, { type: "auth/verify/fail", payload: "Invalid challenge" });
        return false;
    }

    const valid = await verifyZKP(publicKey, challenge, proof);
    if (valid) {
        invalidateNonce(publicKey);
        kernel.send(replyTo, {
            type: "auth/verify/success",
            payload: { token: "zenith-token-" + publicKey.slice(0, 12) }
        });
        return true;
    } else {
        kernel.send(replyTo, { type: "auth/verify/fail", payload: "Invalid proof" });
    }
}


export class VerifySystem  extends BaseSystem implements VerifySystemInterface {
    onLoad?(): void {
      
    }
    onUnload?(): void {
       
    }
    update(): void {
       
    }
    constructor(private kernel: any) {
        super(kernel.ecs);
        if (!kernel) {
            throw new Error("Kernel is required to initialize VerifySystem");
        }
        this.kernel = kernel;
        this.kernel.registerMessageHandler("auth/verify/request", this.handleMessage.bind(this));
    }

    verifyProof(publicKey: string, challenge: string, proof: string): Promise<boolean> {
        return verifyZKP(publicKey, challenge, proof);
    }

    async handleMessage(msg: any) {
        if (msg.type === "auth/verify/request") {
            await handleVerifyRequest(this.kernel, msg);
        } else {
            console.warn("Unknown message type in VerifySystem:", msg.type);
        }
    }
}
export function createVerifySystem(kernel: any): VerifySystem {
    return new VerifySystem(kernel);
}
export function getVerifySystem(kernel: any): VerifySystem {
    const system = kernel.getSystem("VerifySystem");
    if (!system) {
        throw new Error("VerifySystem not found in kernel");
    }
    return system as VerifySystem;
}
export function registerVerifySystem(kernel: any) {
    if (!kernel.hasSystem("VerifySystem")) {
        const system = createVerifySystem(kernel);
        kernel.registerSystem("VerifySystem", system);
    }
    return getVerifySystem(kernel);
}