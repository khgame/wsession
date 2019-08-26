import * as http from "http";
import {Socket, Server} from "socket.io";
import {RemoteProxy} from "./remoteProxy";
import {SessionFactory, SessionMsgHandler} from "./session";
import {LocaleProxy} from "./localeProxy";
import {IProxy} from "./proxy";

type Port = number;

/**
 * Handler the main procedure of server-side WebSocket
 * Maintainer of user session
 *
 * WSServer [1]==[1] UserSessionFaction [1]==[n] UserSession
 *
 * todo: server side project using https://github.com/websockets/ws
 */
export class ProxyHub<TMessage> {

    protected io: Server;

    protected proxies: IProxy[] = [];

    protected sessions: SessionFactory<TMessage>;

    constructor(server: http.Server | Port,
                public readonly validateToken: (token: string) => Promise<string | undefined>,
                public readonly eventHandler: SessionMsgHandler<TMessage>) {
        this.initial(server);
    }

    protected initial(server: http.Server | Port) {
        if (!require) {
            throw new Error("Cannot load WSServer. Try to install all required dependencies: socket.io, socket-controllers");
        }

        try {
            this.io = require("socket.io")(server);
            this.sessions = new SessionFactory(
                this.validateToken,
                this.eventHandler
            );
        } catch (e) {
            throw new Error("socket.io package was not found installed. Try to install it: npm install socket.io --save");
        }

        /** create locale proxy */
        const lProxy = new LocaleProxy(this.io, this.sessions);
        this.proxies.push(lProxy);

        this.io.on("connection", async (socket: Socket) => {
            const query = socket.handshake.query;
            if (!query) {
                console.error(`create connection failed: bag query`);
            }

            if (query.proxy) {
                const rProxy = RemoteProxy.create(socket, this.sessions);
                this.proxies.push(rProxy);
                console.log(`ws proxy connected, socket id : ${socket.id}, remote proxy: ${rProxy.id}`);
                return;
            }

            await lProxy.onLogin(query.token, socket);
            console.log(`ws proxy connected, socket id : ${socket.id}, locale proxy`);


        });


        // todo: maintain proxy

        return this.io;
    }

    public emit(uid: string, message: any): this {
        this.sessions.send(uid, message);
        return this;
    }

    public emitToAll(msg: any): this {
        this.proxies.forEach((p: IProxy) => p.broadcast(msg));
        return this;
    }
}
