import {Socket} from "socket.io";
import {SessionFactory} from "./sessionFactory";
import {SessionMsgHandler} from "./session";

/**
 * determine how a communication between server and client are handled by sessions
 */
export interface IProxy {
    onClientLogin(token: string, socket: Socket): Promise<void>;

    onClientLogout(identity: string): void;

    onClientMsgIn(identity: string, msg: any): void;

    send(identity: string, msg: any): void;

    broadcast(msg: any): void;

    shutdown(identity: string): void;
}

export abstract class ProxyBase<TMessage> implements IProxy {

    public abstract sessions: SessionFactory<TMessage>;

    constructor(
        public readonly onMsgHandler: SessionMsgHandler<TMessage>,
        public readonly onLogoutHandler: (identity: string) => Promise<void>){
    }

    /**
     * trigger this when client has disconnected
     * @param {string} identity
     * @return {Promise<any>}
     */
    async onClientLogout(identity: string) {
        if (!this.sessions.del(identity)) {
            return false;
        }
        if (this.onLogoutHandler) {
            return await Promise.resolve(this.onLogoutHandler(identity));
        } else {
            return true;
        }
    }

    /**
     * trigger this when message from client are received
     * @param {string} identity
     * @param msg
     */
    onClientMsgIn(identity: string, msg: any): void {
        const session = this.sessions.get(identity);
        // todo: assert
        return this.onMsgHandler(session, msg);
    }

    public async abstract onClientLogin(token: string, socket: SocketIO.Socket): Promise<void>;

    public abstract broadcast(msg: any): void;

    public abstract send(identity: string, msg: any): void;

    public abstract shutdown(identity: string): void;

}
