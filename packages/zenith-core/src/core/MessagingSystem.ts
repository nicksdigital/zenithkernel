import { BaseSystem } from "./BaseSystem";
// @ts-ignore
import { Message } from "@types";

export abstract class MessagingSystem extends BaseSystem {
    abstract readonly channelId: string;

    protected onMessage(_msg: Message): void {}

    update(): void {
        const messages:Message[] | undefined = this.ecs.kernel.receive(this.channelId);

        // @ts-ignore
        for (const msg of messages) this.onMessage(msg);
    }

    protected send(target: string, msg: Message) {
        console.log("Sending", msg);
        this.ecs.kernel.send(target, msg);
    }
}
