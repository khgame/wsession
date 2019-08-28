import {createServer, Server} from "http";
import {Socket} from "socket.io";
import {Error} from "tslint/lib/error";
import {CLIENT_EVENTS} from "../src/proxy";

export class WSProxy {

    protected _connected: boolean;
    public get connected() {
        return this._connected;
    }

    protected server: Server;
    protected io: Server;
    protected socket: Socket;

    constructor() {
        this.initial();
    }

    public async initial() { // 9999 => 10000

        this.server = createServer((...args: any[]) => {
        });
        await new Promise((resolve, reject) => this.server.listen("10000", resolve));

        if (!require) {
            throw new Error("Cannot load WSServer. Try to install all required dependencies: socket.io, socket-controllers");
        }


        const sockets: any = {};

        try {
            this.socket = require("socket.io-client")("http://localhost:9999", { // todo: get identities when reconnect
                    query: {
                        proxy: JSON.stringify({id: "123", identities: Object.keys(sockets)}),
                    }
                });
            this.on("connect", () => {
                console.log("connect ...");
                this._connected = true;
            });
            this.on("disconnect", () => {
                console.log("disconnect ...");
                this._connected = false;
            });
            this.on("prx:login_result", ({identity, result}) => {
                if (result === "SUCCESS") {
                    sockets[identity].emit(CLIENT_EVENTS.SC_LOGIN, "SUCCESS");
                }
            });
            this.on("prx:send", (identity, msg) => {
                // console.log("service send", identity, msg);//, "-", sockets[identity], "-");
                sockets[identity].emit(CLIENT_EVENTS.CS_MSG, msg);
            });
            this.on("prx:broadcast", (msg) => {
                console.log("service broadcast", msg);
            });
            this.on("prx:shutdown", (identity) => { // todo: test shutdown => logout
                console.log("service shutdown", identity);
            });
        } catch (e) {
            throw new Error("socket.io package was not found installed. Try to install it: npm install socket.io --save");
        }


        // ===== svr

        try {
            this.io = require("socket.io")(this.server);
        } catch (e) {
            throw new Error("socket.io package was not found installed. Try to install it: npm install socket.io --save");
        }

        this.io.on("connection", async (socket: Socket) => {
            const identity = socket.handshake.query.token;

            this.emit("prx:login", identity);

            // if(sockets[identity]) { // replace
            //     throw new Error(`socket of identity ${identity} are already exist`);
            // }
            sockets[identity] = socket;

            socket.on(CLIENT_EVENTS.CS_MSG, (...messages: any[]) => {
                // console.log("msg", messages)
                this.emit("prx:msg", identity, ...messages);
            });

            socket.on(CLIENT_EVENTS.CS_DISCONNECT, (...messages: any[]) => {
                this.emit("prx:logout", identity, ...messages);
            });

            // socket.on("proxy", (message: string) => {
            //     this.sessions.remove(identity);
            // });

            console.log(`client connected: ${socket.id}, identity: ${identity}`);

        });

        console.log("initialed");


        return this;
    }

    public on(event: string, callback: (...args: any[]) => void) {
        this.socket.on(event, callback);
    }

    public emit(event: string, ...args: any[]) {
        this.socket.emit(event, ...args);
    }

    public removeEvent(event: string) {
        this.socket.removeAllListeners(event);
    }
}

const proxy = new WSProxy();
