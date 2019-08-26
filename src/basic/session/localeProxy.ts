import {Server, Socket} from "socket.io";
import {SessionFactory} from "./session";
import {IProxy} from "./proxy";
import {CLIENT_EVENTS} from "./events";



export class LocaleProxy<TMessage> implements IProxy {

    constructor(
        public readonly io: Server,
        public readonly sessions: SessionFactory<TMessage>) {
    }

    sockets: { [identity: string]: Socket } = {};

    async onLogin(token: string, socket: Socket): Promise<void> {
        const identity = await this.sessions.validateToken(token);

        if (!identity) {
            socket.emit(CLIENT_EVENTS.SC_LOGIN, "FAILED");
            return;
        }

        socket.on(CLIENT_EVENTS.CS_MSG, (msg: TMessage) => this.onMsg(identity, msg));
        socket.on(CLIENT_EVENTS.CS_DISCONNECT, () => this.onLogOut(identity)); // todo: can u do this?

        this.sockets[identity] = socket;
        this.sessions.add(identity, this);

        socket.emit(CLIENT_EVENTS.SC_LOGIN, "SUCCESS");
    }

    onLogOut(identity: string): void {
        this.shutdown(identity);
        return this.sessions.remove(identity);
    }

    onMsg(identity: string, msg: any): void {
        return this.sessions.onMsg(identity, msg);
    }

    send(identity: string, msg: any) {
        this.sockets[identity].emit(CLIENT_EVENTS.CS_MSG, msg);
        return true;
    }

    broadcast(msg: any) {
        this.io.emit(CLIENT_EVENTS.CS_MSG, msg);
        return true;
    }

    shutdown(identity: string) {
        this.sockets[identity].disconnect();
        delete this.sockets[identity];
    }


}
