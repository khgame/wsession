import {Socket} from "socket.io";
import {SessionFactory} from "./session";
import {IProxy, PROXY_EVENTS} from "./const";

export class RemoteProxy<TMessage> implements IProxy {

    public static remoteProxyMap: { [id: string]: RemoteProxy<any> } = {};

    public static create<TMessage>(socket: Socket,
                                   connectInfo: { id: string, identities?: string[] },
                                   sessions: SessionFactory<TMessage>) {
        return new RemoteProxy<TMessage>(socket, connectInfo.id, connectInfo.identities || [], sessions);
    }

    constructor(
        public readonly socket: Socket,
        public readonly id: string,
        public readonly identities: string[],
        public readonly sessions: SessionFactory<TMessage>) {

        if (RemoteProxy.remoteProxyMap[id]) {
            const oldProxy = RemoteProxy.remoteProxyMap[id];
            oldProxy.identities.forEach(
                identity => this.sessions.del(identity)
            );
            // todo: remove old proxy and sync identify list
        }
        RemoteProxy.remoteProxyMap[id] = this;
        this.identities.forEach(identity => this.sessions.add(identity, this));

        // 接受 proxy server 传来的消息
        socket.on(PROXY_EVENTS.PROXY_ON_LOGIN, (token: string) => this.onLogin(token, socket));
        socket.on(PROXY_EVENTS.PROXY_ON_LOGOUT, this.onLogOut.bind(this));
        socket.on(PROXY_EVENTS.PROXY_ON_MSG, (identity: string, msg: any) => {
            this.sessions.heartbeat(identity);
            this.onMsg(identity, msg);
        });
    }

    async onLogin(token: string, socket: Socket) {
        const identity = await this.sessions.validateToken(token);

        if (!identity) {
            this.socket.emit(PROXY_EVENTS.PROXY_LOGIN_RESULT, {token, identity, result: "FAILED"});
            return;
        }

        if (this.identities.indexOf(identity) < 0) {
            this.identities.push(identity);
            this.sessions.add(identity, this); // todo: deal with removing from other proxy
        }

        socket.emit(PROXY_EVENTS.PROXY_LOGIN_RESULT, {token, identity, result: "SUCCESS"});
    }

    onLogOut(identity: string) {
        return this.sessions.del(identity);
    }

    onMsg(identity: string, msg: any) {
        return this.sessions.onMsg(identity, msg);
    }

    send(identity: string, msg: any) {
        return this.socket.emit(PROXY_EVENTS.PROXY_SEND, identity, msg);
    }

    broadcast(msg: any) {
        return this.socket.emit(PROXY_EVENTS.PROXY_BROADCAST, msg);
    }

    shutdown(identity: string) {
        return this.socket.emit(PROXY_EVENTS.PROXY_SHUTDOWN, identity);
    }
}
