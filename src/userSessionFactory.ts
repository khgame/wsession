import {SessionMsgHandler, UserSession} from "./userSession";
import {Server} from "socket.io";
import {LRULst} from "./chain/lru";

export class UserSessionFactory<TMessage> {

    protected sessionMap: { [uid: string]: UserSession<TMessage> } = {};
    protected sessionLRU: LRULst<UserSession<TMessage>>;

    constructor(
        protected readonly io: Server,
        public readonly ttl_ms: number) {

        this.sessionLRU = new LRULst<UserSession<TMessage>>(
            (session: UserSession<TMessage>) => {
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

    get(uid: string): UserSession<TMessage> {
        return this.sessionMap[uid];
    }

    create(socketId: string,
           uid: string,
           handler: SessionMsgHandler<TMessage>
    ): boolean { // todo: lb ?
        this.remove(uid);
        const session = this.sessionMap[uid] = new UserSession(this.io, socketId, uid, handler);
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
