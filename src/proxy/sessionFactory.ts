import {Session} from "./session";
import {IProxy} from "./proxyBase";
/**
 * session factory known nothing about proxy, it only using session
 */
export class SessionFactory<TMessage> {

    protected sessionMap: { [identity: string]: Session<TMessage> } = {};

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

    expire(identity: string) {
        const session = this.get(identity);
        session.disconnect();
    }
}
