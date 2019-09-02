import {Session} from "./session";
import {IProxy} from "./proxyBase";
import {forMs} from "kht";

/**
 * session factory known nothing about proxy, it only using session
 */
export class SessionFactory<TMessage> {

    protected sessionMap: { [identity: string]: Session<TMessage> } = {};

    constructor(public readonly sessionTTLMs: number = 0) {
    }

    get(identity: string) {
        const session: Session<TMessage> = this.sessionMap[identity];
        if (!session) {
            console.error(`cannot find session of identity ${identity}`);
        }
        return session;
    }

    add(identity: string, proxy: IProxy) {
        this.sessionMap[identity] = new Session<TMessage>(identity, proxy, this.sessionTTLMs);
    }

    del(identity: string): boolean {
        const session = this.sessionMap[identity];
        if (!session) {
            return false;
        }
        delete this.sessionMap[identity];
        return true;
    }

    heartbeat(identity: string) {
        const session = this.get(identity);
        if (!session) {
            return;
        }
        session.heartbeat();
    }

    get identities() {
        return Object.keys(this.sessionMap);
    }

    async checkExpire() { // todo: using lru
        const identities = this.identities;
        const now = Date.now();
        for (let i = 0; i < identities.length; i++) {
            const identity = identities[i];
            const session = this.get(identity);
            if (!session || !session.expired(now)) {
                continue;
            }
            session.disconnect();
            await forMs(10);
        }
    }

}
