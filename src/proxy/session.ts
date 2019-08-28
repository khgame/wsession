import {IProxy} from "./index";

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

    get expired() {
        return this.ttlMs <= 0 || this.heartbeat_at + this.ttlMs > Date.now();
    }

    heartbeat() {
        this.heartbeat_at = Date.now();
    }

    send(msg: TMessage) {
        this.proxy.send(this.identity, msg);
    }


}

export class SessionFactory<TMessage> {

    sessionMap: { [identity: string]: Session<TMessage> } = {};

    constructor(
        public readonly validateToken: (token: string) => Promise<string>,
        public readonly onMsgHandler: SessionMsgHandler<TMessage>,
        public readonly onLogoutHandler: (identity: string) => Promise<void>,
    ) {

    }

    get(identity: string) {
        const session = this.sessionMap[identity];
        if (!session) {
            console.error(`cannot find session of identity ${identity}`);
        }
        return session;
    }

    add(identity: string, proxy: IProxy) {
        this.sessionMap[identity] = new Session<TMessage>(identity, proxy);
    }

    async del(identity: string): Promise<any> {
        const session = this.sessionMap[identity];
        if (!session) {
            return;
        }
        delete this.sessionMap[identity];
        if (this.onLogoutHandler) {
            return await Promise.resolve(this.onLogoutHandler(session.identity));
        } else {
            return true;
        }
    }

    onMsg(identity: string, msg: TMessage) {
        this.onMsgHandler(this.get(identity), msg);
    }

    send(identity: string, msg: TMessage) {
        const session = this.get(identity);
        if (!session) {
            return;
        }
        return session.proxy.send(identity, msg); // todo: assert
    }

    heartbeat(identity: string) {
        const session = this.get(identity);
        if (!session) {
            return;
        }
        session.heartbeat();
    }
}
