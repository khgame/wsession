import {UserSession} from "./userSession";
import {Server} from "socket.io";
import {LRUList} from "./lru";

export class UserSessionFactory {

    protected sessionMap: { [uid: string]: UserSession } = {};
    protected sessionLRU: LRUList<UserSession>;

    constructor(
        protected readonly io: Server,
        public readonly ttl_ms: number) {

        this.sessionLRU = new LRUList<UserSession>(
            (session: UserSession) => {
                if (session.survive) {
                    session.socket.disconnect();
                }
                delete this.sessionMap[session.uid];
            }, {
                ttl_ms: ttl_ms
            }
        );
    }

    has(uid: string) {
        return this.sessionMap.hasOwnProperty(uid);
    }

    get(uid: string): UserSession {
        return this.sessionMap[uid];
    }

    create(socketId: string, uid: string): boolean {
        if (this.has(uid)) { // remove the old session
            this.remove(uid);
        }
        const session = this.sessionMap[uid] = new UserSession(this.io, socketId, uid);

        this.sessionLRU.append(session);
        return true; // when new session come in, evictInactive
    }

    public remove(uid: string): boolean {
        const session = this.get(uid);
        if (!session) {
            return false;
        }
        this.sessionLRU.remove(session);
        return true;
    }

    public heartBeat(uid: string) {
        const session = this.get(uid);
        if (!session) {
            return false;
        }
        return this.sessionLRU.heartBeat(session); // when session heart beats, evictInactive
    }

}
