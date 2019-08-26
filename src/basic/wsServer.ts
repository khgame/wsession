import * as http from "http";
import {Socket, Server} from "socket.io";

import {UserSessionFactory} from "./userSessionFactory";
import {SessionMsgHandler, UserSession} from "./userSession";
import {ILRUOption} from "./chain/lru";
import {CError} from "@khgame/err";

type Port = number;

export enum EVENT_NAMES {
    LOGIN = "login",
    MSG = "message",
    DISSCONNECT = "disconnect"
}

export interface IWsOptions {
    lru?: ILRUOption;
    msg_queue_length?: number;
}

/**
 * Handler the main procedure of server-side WebSocket
 * Maintainer of user session
 *
 * WSServer [1]==[1] UserSessionFaction [1]==[n] UserSession
 *
 * todo: server side project using https://github.com/websockets/ws
 */
export class WSServer<TMessage> {

    protected sessions: UserSessionFactory<TMessage>;
    protected io: Server;

    constructor(server: http.Server | Port,
                public readonly validateToken: (token: string) => Promise<string | undefined>,
                public readonly eventHandler: SessionMsgHandler<TMessage>,
                public readonly opt?: IWsOptions) {
        this.initial(server, opt);
    }

    private mockIdSeq = 0;


    protected initial(server: http.Server | Port, opt?: IWsOptions) {
        if (!require) {
            throw new Error("Cannot load WSServer. Try to install all required dependencies: socket.io, socket-controllers");
        }

        try {
            this.io = require("socket.io")(server);
            this.sessions = new UserSessionFactory(this.io, opt ? opt.lru || {} : {});
        } catch (e) {
            throw new Error("socket.io package was not found installed. Try to install it: npm install socket.io --save");
        }

        this.io.on("connection", async (socket: Socket) => {
            console.log(`ws connected, socket id : ${socket.id}`);
            return await this.onConn(socket, socket.handshake.query, opt);
        });

        return this.io;
    }

    protected async onProxyConn(socket: Socket, proxyName: string, opt?: IWsOptions ){

    }

    protected async onUserConn(socket: Socket, proxyName: string, opt?: IWsOptions ){

    }

    protected async onConn(socket: Socket, query: any, opt?: IWsOptions) {

        let identity: string;
        /** proxy login */
        if (query.proxy) {
            identity = query.proxy.name;
        }
        /** user login */
        else if (query.token) {
            const token = query.token; // get this from your login server.
            identity = await this.validateToken(token);

            if (!identity) {
                socket.emit(EVENT_NAMES.LOGIN, "FAILED");
                identity = `mock_identity_${this.mockIdSeq++}`;
            }
        } else {
            throw new Error(`onConn failed: invalid query => ${query}`);
        }

        let sessionCreated = this.sessions.create(socket, identity, this.eventHandler, opt ? opt.msg_queue_length : -1);

        if (!sessionCreated) { // todo
            socket.disconnect();
            console.error(`try create session of identity ${identity} failed`);
            return;
        }

        const session = this.sessions.get(identity);

        socket.emit(EVENT_NAMES.LOGIN, "SUCCESS");

        socket.on(EVENT_NAMES.MSG, (...messages: any[]) => {
            session.onMessage(messages);
            this.sessions.heartBeat(identity);
            // this.sessions.get(identity).emit("heartbeat"); // todo: test client behavior
        });

        socket.on(EVENT_NAMES.DISSCONNECT, (message: string) => {
            this.sessions.remove(identity);
        });

        // socket.on("proxy", (message: string) => {
        //     this.sessions.remove(identity);
        // });

        console.log(`ws connected, socket id: ${socket.id}, identity: ${identity}, query: ${query}`);

    }



    // todo: wsServer 的 emit 到底发给谁? uid -> proxy
    public emit(uid: string, message: any): this {
        const session = this.sessions.get(uid);
        if (!session) {
            console.error(`try emit message to uid ${uid}, but the session are not found`);
        }
        session.emit(EVENT_NAMES.MSG, message); // todo: ???
        return this;
    }

    public emitToUsers(uids: string[], message: any): this {
        (uids || []).forEach(uid => this.emit(uid, message));
        return this;
    }

    public emitToAll(message: any): this {
        this.io.emit(EVENT_NAMES.MSG, message);
        return this;
    }

    public getConnectCount() {
        return this.sessions.getConnectCount();
    }

    // private checkStatus() {
    //     this.sessions.evictInactive();
    // }
}
