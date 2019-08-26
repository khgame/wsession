import {SessionMsgHandler, UserSession} from "./userSession";
import {Server, Socket} from "socket.io";
import {ILRUOption, LRULst} from "./chain/lru";

export class UserSessionFactory<TMessage> {

    protected sessionMap: { [uid: string]: UserSession<TMessage> } = {};

    protected sessionLRU: LRULst;

    constructor(
        public readonly io: Server,
        public readonly opt: ILRUOption) {

        this.sessionLRU = new LRULst(
            (session: UserSession<TMessage>) => {
                delete this.sessionMap[session.uid];
                session.kill();
            }, {
                ...opt,
                ... {
                    ttl_ms: 12000, // ms
                }
            }
        );
    }

    has(uid: string) {
        return this.sessionMap.hasOwnProperty(uid);
    }

    get(uid: string): UserSession<TMessage> {
        return this.sessionMap[uid];
    }

    create(socket: Socket,
           uid: string,
           handler: SessionMsgHandler<TMessage>,
           max_queue_length: number = -1
    ): boolean { // todo: lb ?
        this.remove(uid);
        const session = this.sessionMap[uid] = new UserSession(this, socket.id, uid, handler, false, socket.handshake.address, max_queue_length);
        this.sessionLRU.push(session);
        return true; // when new session come in, evictInactive
    }

    public remove(uid: string): boolean {
        const session = this.get(uid);
        if (!session) {
            return false;
        }
        this.sessionLRU.del(session);
        return true;
    }

    public heartBeat(uid: string) {
        const session = this.get(uid);
        if (!session) {
            return false;
        }
        return this.sessionLRU.heartBeat(session); // when session heart beats, evictInactive
    }

    public getConnectCount(){
        return Object.keys(this.sessionMap).length;
    }

}
