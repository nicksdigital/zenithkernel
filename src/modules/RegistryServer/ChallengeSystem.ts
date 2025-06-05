// @ts-ignore

import { BaseSystem } from "@core/BaseSystem";
import { ECSManager } from "@core/ECSManager";
import { Message } from "@core/MessagingSystem";
import { randomBytes } from "crypto";

const issued = new Map<string, string>();

export function handleChallengeRequest(kernel:any, msg: Message) {
    const { publicKey } = msg.payload;
    const nonce = randomBytes(32).toString("hex");


    issued.set(publicKey, nonce);


    kernel.send(msg.payload.replyTo, {
        type: "auth/challenge/response",
        payload: { nonce }
    });
}

export function getNonce(publicKey: string): string | undefined {
    return issued.get(publicKey);
}

export function invalidateNonce(publicKey: string) {
    issued.delete(publicKey);
}

export class ChallengeSystem extends BaseSystem{
    onLoad?(): void {
        
    }
    onUnload?(): void {
      
    }
    update(): void {
      
    }
    private kernel: any;

    constructor(ecs: ECSManager) {
        super(ecs);
        if (!ecs) {
            throw new Error("ECSManager is required to initialize ChallengeSystem");
        }
        this.kernel = ecs.kernel
        this.kernel.registerMessageHandler("auth/challenge/request", this.handleMessage.bind(this));
    }

    async handleMessage(msg: Message) {
        if (msg.type === "auth/challenge/request") {
            handleChallengeRequest(this.kernel, msg);
        } else {
            console.warn("Unknown message type in ChallengeSystem:", msg.type);
        }
    }
}