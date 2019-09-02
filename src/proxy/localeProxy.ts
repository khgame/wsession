import {Server, Socket} from "socket.io";
import {CLIENT_EVENTS} from "./const";
import {SessionFactory} from "./sessionFactory";
import {SessionMsgHandler} from "./session";
import {ProxyBase} from "./proxyBase";

/**
 *
 */
export class LocaleProxy<TMessage> extends ProxyBase<TMessage> {

    constructor(
        public readonly io: Server,
        public readonly sessions: SessionFactory<TMessage>,
        onMsgHandler: SessionMsgHandler<TMessage>,
        onLogoutHandler: (identity: string) => Promise<void>,
        public readonly validateToken: (token: string) => Promise<string | undefined>
        ) {
        super(onMsgHandler, onLogoutHandler);
    }

    sockets: { [identity: string]: Socket } = {};

    async onClientLogin(token: string, socket: Socket): Promise<void> {
        const identity = await this.validateToken(token);

        if (!identity) {
            socket.emit(CLIENT_EVENTS.SC_LOGIN, "FAILED");
            return;
        }

        socket.on(CLIENT_EVENTS.MSG, (msg: TMessage) => {
            this.sessions.heartbeat(identity);
            this.onClientMsgIn(identity, msg);
        });
        socket.on(CLIENT_EVENTS.DISCONNECT, async () => this.onClientLogout(identity)); // todo: can u do this?

        this.sockets[identity] = socket;
        this.sessions.add(identity, this);

        socket.emit(CLIENT_EVENTS.SC_LOGIN, "SUCCESS");
    }

    send(identity: string, msg: any) {
        this.sockets[identity].emit(CLIENT_EVENTS.MSG, msg);
        return true;
    }

    broadcast(msg: any) {
        this.io.emit(CLIENT_EVENTS.MSG, msg);
        return true;
    }

    shutdown(identity: string) {
        this.sockets[identity].disconnect();
        delete this.sockets[identity];
    }


}
