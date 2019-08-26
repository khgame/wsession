import {Socket} from "socket.io";
import {SessionFactory} from "../basic";
import {IProxy, PROXY_EVENTS} from "./const";

let proxy_id = 1;

export class RemoteProxy<TMessage> implements IProxy {

    id: number;

    public static create<TMessage>(socket: Socket,
                                   sessions: SessionFactory<TMessage>) {
        return new RemoteProxy<TMessage>(socket, sessions);
    }

    constructor(
        public readonly socket: Socket,
        public readonly sessions: SessionFactory<TMessage>) {

        this.id = proxy_id++;

        // 接受 proxy server 传来的消息
        socket.on(PROXY_EVENTS.PROXY_ON_LOGIN, (token: string) => this.onLogin(token, socket));
        socket.on(PROXY_EVENTS.PROXY_ON_LOGOUT, this.onLogOut.bind(this));
        socket.on(PROXY_EVENTS.PROXY_ON_MSG, this.onMsg.bind(this));
    }

    async onLogin(token: string, socket: Socket) {
        const identity = await this.sessions.validateToken(token);

        if (!identity) {
            this.socket.emit(PROXY_EVENTS.PROXY_LOGIN_RESULT, {identity, result: "FAILED"});
            return;
        }

        this.sessions.add(identity, this);

        socket.emit(PROXY_EVENTS.PROXY_LOGIN_RESULT, {identity, result: "SUCCESS"});
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
