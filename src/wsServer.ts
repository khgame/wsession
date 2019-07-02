import * as http from "http";
import {Socket, Server} from "socket.io";

import {UserSessionFactory} from "./userSessionFactory";

type Port = number;

export class WSServer<TMessage> {

    protected sessions: UserSessionFactory<TMessage>;
    protected io: Server;

    constructor(server: http.Server | Port,
                public readonly validateToken: (token: string) => Promise<string | undefined>,
                public readonly eventHandler: (socket: Socket, uid: string, message: string) => void,
                public readonly heartbeatTimeOut: number = 180000) {
        this.initial(server);
    }

    private mockIdSeq = 0;

    protected initial(server: http.Server | Port) {
        if (!require) {
            throw new Error("Cannot load WSServer. Try to install all required dependencies: socket.io, socket-controllers");
        }

        try {
            this.io = require("socket.io")(server);
            this.sessions = new UserSessionFactory(this.io, this.heartbeatTimeOut);
        } catch (e) {
            throw new Error("socket.io package was not found installed. Try to install it: npm install socket.io --save");
        }

        this.io.on("connection", async (socket: Socket) => {
            console.log(`ws connected, socket id : ${socket.id}`);

            const token = socket.handshake.query.token; // get this from your login server.

            let uid = await this.validateToken(token);

            if (!uid) {
                socket.emit("login", "FAILED");
                uid = `mock_uid_${this.mockIdSeq++}`;
            }

            if (!this.sessions.create(socket.id, uid,null)) { // todo
                socket.disconnect();
                console.error(`try create session of uid ${uid} failed`);
                return;
            }
            const session = this.sessions.get(uid);
            socket.emit("login", "SUCCESS");

            socket.on("message", (...messages: any[]) => {
                session.onMessage(messages);
                this.sessions.heartBeat(uid);
                // this.sessions.get(uid).emit("heartbeat"); // todo: test client behavior
            });

            socket.on("disconnect", (message: string) => {
                this.sessions.remove(uid);
            });

            console.log(`ws connected, socket id : ${socket.id}`);
        });

        return this.io;
    }

    public emit(uid: string, message: any): this {
        const session = this.sessions.get(uid);
        if (!session) {
            console.error(`try emit message to uid ${uid}, but the session are not found`);
        }
        if (session.survive) {
            console.error(`try emit message to uid ${uid}, but the session are not survive`);
        }
        session.emit("message", message); // todo: ???
        return this;
    }

    public emitToUsers(uids: string[], message: any): this {
        (uids || []).forEach(uid => this.emit(uid, message));
        return this;
    }

    public emitToAll(message: any): this {
        this.io.emit(message);
        return this;
    }

    // private checkStatus() {
    //     this.sessions.evictInactive();
    // }
}
