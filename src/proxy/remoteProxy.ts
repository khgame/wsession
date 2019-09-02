import {Socket} from "socket.io";
import {CLIENT_EVENTS, PROXY_EVENTS} from "./const";
import {SessionFactory} from "./sessionFactory";
import {SessionMsgHandler} from "./session";
import {ProxyBase} from "./proxyBase";

export class RemoteProxy<TMessage> extends ProxyBase<TMessage> {

    public static remoteProxyMap: { [id: string]: RemoteProxy<any> } = {};

    public static create<TMessage>(
        socket: Socket,
        connectInfo: { id: string, identities?: string[] },
        sessions: SessionFactory<TMessage>,
        onMsgHandler: SessionMsgHandler<TMessage>,
        onLogoutHandler: (identity: string) => Promise<void>,
        validateToken: (token: string) => Promise<string | undefined>
    ) {
        console.log("create remote proxy with connection info:", connectInfo);
        return new RemoteProxy<TMessage>(
            socket,
            connectInfo.id,
            connectInfo.identities || [], sessions,
            onMsgHandler,
            onLogoutHandler,
            validateToken);
    }

    constructor(
        public readonly socket: Socket,
        public readonly id: string,
        public readonly identities: string[],
        public readonly sessions: SessionFactory<TMessage>,
        onMsgHandler: SessionMsgHandler<TMessage>,
        onLogoutHandler: (identity: string) => Promise<void>,
        public readonly validateToken: (token: string) => Promise<string | undefined>
    ) {
        super(onMsgHandler, onLogoutHandler);

        if (RemoteProxy.remoteProxyMap[id]) { // todo: mutex here
            const oldProxy = RemoteProxy.remoteProxyMap[id];
            oldProxy.identities.forEach( // todo: refine this, decline the deletes of identities, cuz that will trigger the onLogoutHandler of the server
                identity => this.onClientLogout(identity)
            );
            // todo: remove old proxy and sync identify list
        }
        RemoteProxy.remoteProxyMap[id] = this;
        this.identities.forEach(identity => {
            this.sessions.add(identity, this);
            console.log(`ws client connected, socket-id: ${socket.id}, token: -batch-, proxy ${this.id} | ${this.socket.id}`);
        });

        // 接受 proxy server 传来的消息
        socket.on(PROXY_EVENTS.PROXY_ON_LOGIN, (token: string) => this.onClientLogin(token, socket));
        socket.on(PROXY_EVENTS.PROXY_ON_LOGOUT, this.onClientLogout.bind(this));
        socket.on(PROXY_EVENTS.PROXY_ON_MSG, (identity: string, msg: any) => {
            this.sessions.heartbeat(identity);
            this.onClientMsgIn(identity, msg);
        });

        socket.on(CLIENT_EVENTS.DISCONNECT, async () => {
            console.log(`proxy ${this.id} | ${this.socket.id} disconnected.`);
            for (const i in this.identities) { // todo: mutex here
                const identity = this.identities[i];
                try {
                    this.onClientLogout(identity); // todo: if the proxy is reconnected now ?
                } catch (ex) {
                    console.warn(`delete ${identity} of proxy ${this.id} | ${this.socket.id} error: ${ex}`);
                }
            }
            delete RemoteProxy.remoteProxyMap[id];
            console.log(`proxy ${this.id} removed.`);
        });
    }

    async onClientLogin(token: string, socket: Socket) {
        const identity = await this.validateToken(token);

        if (!identity) {
            this.socket.emit(PROXY_EVENTS.PROXY_LOGIN_RESULT, {token, identity, result: "FAILED"});
            return;
        }

        if (this.identities.indexOf(identity) < 0) {
            this.identities.push(identity);
            this.sessions.add(identity, this); // todo: deal with removing from other proxy
            console.log(`ws client connected, socket-id: ${socket.id}, token: ${token}, proxy ${this.id} | ${this.socket.id}`);
        }

        socket.emit(PROXY_EVENTS.PROXY_LOGIN_RESULT, {token, identity, result: "SUCCESS"});

    }

    send(identity: string, msg: any) {
        return this.socket.emit(PROXY_EVENTS.PROXY_SEND, identity, msg);
    }

    broadcast(msg: any) {
        return this.socket.emit(PROXY_EVENTS.PROXY_BROADCAST, msg);
    }

    shutdown(identity: string) {
        return this.socket.emit(PROXY_EVENTS.PROXY_SHUTDOWN, identity); // send this to proxy, can then proxy must response PROXY_ON_LOGOUT
    }
}
