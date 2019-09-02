import {IProxy} from "./proxyBase";

export type SessionMsgHandler<TMessage> = (session: Session<TMessage>, message: TMessage) => void;

export class Session<TMessage> {

    heartbeat_at: number;

    constructor(
        public readonly identity: string,
        public readonly proxy: IProxy,
        public readonly ttlMs: number = 0,
    ) {
        this.heartbeat();
    }

    expired(now?: number) {
        return this.ttlMs <= 0 || this.heartbeat_at + this.ttlMs > (now || Date.now());
    }

    heartbeat() {
        this.heartbeat_at = Date.now();
    }

    send(msg: TMessage) {
        this.proxy.send(this.identity, msg);
    }

    disconnect() {
        console.log(`ws disconnect: ${this.identity}`);
        this.proxy.shutdown(this.identity);
    }
}
