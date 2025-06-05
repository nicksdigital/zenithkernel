import { Message } from "../types";
import {MessagingSystem} from "@core/MessagingSystem";
import {ECSManager} from "@core/ECSManager";

export class Messenger {
    private queues = new Map<string, Message[]>();




    register(id: string) {
        this.queues.set(id, []);
    }

    unregister(id: string) {
        this.queues.delete(id);
    }

    send(targetId: string, message: Message) {
        const queue = this.queues.get(targetId);
        if (queue) queue.push(message);
    }

    receive(id: string): Message[] {
        const queue = this.queues.get(id);
        return queue ? queue.splice(0, queue.length) : [];
    }
}
