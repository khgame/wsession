import * as http from "http";
import {Socket, Server} from "socket.io";
import {RemoteProxy} from "./remoteProxy";
import {SessionMsgHandler} from "./session";
import {SessionFactory} from "./sessionFactory";
import {LocaleProxy} from "./localeProxy";
import {IProxy} from "./proxyBase";

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
                public readonly onMsgHander: SessionMsgHandler<TMessage>,
                public readonly onLogoutHander: (identity: string) => Promise<void>
    ) {
        this.initial(server);
    }

    protected initial(server: http.Server | Port) {
        if (!require) {
            throw new Error("Cannot load WSServer. Try to install all required dependencies: socket.io, socket-controllers");
        }

        try {
            this.io = require("socket.io")(server);
            this.sessions = new SessionFactory();
        } catch (e) {
            throw new Error("socket.io package was not found installed. Try to install it: npm install socket.io --save");
        }

        /** create locale proxy */
        const lProxy = new LocaleProxy(
            this.io,
            this.sessions,
            this.onMsgHander,
            this.onLogoutHander,
            this.validateToken
        );
        this.proxies.push(lProxy);

        this.io.on("connection", async (socket: Socket) => {
            const query = socket.handshake.query;
            if (!query) {
                console.error(`create connection failed: bad query`);
            }

            if (query.proxy) {
                const rProxy = RemoteProxy.create(
                    socket,
                    JSON.parse(query.proxy),
                    this.sessions,
                    this.onMsgHander,
                    this.onLogoutHander,
                    this.validateToken
                );
                this.proxies.push(rProxy);
                console.log(`ws proxy connected, socket-id: ${socket.id}, proxy-id: ${rProxy.id}, identities: ${rProxy.identities}`);
                return;
            }

            await lProxy.onClientLogin(query.token, socket);
            console.log(`ws client connected, socket-id: ${socket.id}, token: ${query.token}, proxy local`);


        });
        // todo: maintain proxy

        return this.io;
    }

    public emit(uid: string, message: any): boolean {
        const session = this.sessions.get(uid);
        if (!session) {
            return false;
        }
        session.send(message);
        return true;
    }

    public emitToAll(msg: any): this {
        this.proxies.forEach((p: IProxy) => p.broadcast(msg));
        return this;
    }
}
