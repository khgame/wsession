import {createServer, Server} from "http";
import {Socket} from "socket.io";
import {EVENT_NAMES} from "../src/basic/wsServer";

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


        const sockets : any = {};

        try {
            this.socket = require("socket.io-client")("http://localhost:9999", { query: { proxy: true }});
            this.on("connect", () => {
                this._connected = true;
            });
            this.on("disconnect", () => {
                this._connected = false;
            });
            this.on("prx:login_result", ({ identity, result }) => {
                if (result === "SUCCESS") {
                    sockets[identity].emit(EVENT_NAMES.LOGIN, "SUCCESS");
                }
            });
            this.on("prx:send", (identity, msg) => {
                // console.log("service send", identity, msg);//, "-", sockets[identity], "-");
                sockets[identity].emit(EVENT_NAMES.MSG, msg);
            });
            this.on("prx:broadcast", (msg) => {
                console.log("service broadcast", msg);
            });
            this.on("prx:shutdown", (identity) => {
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

            socket.on(EVENT_NAMES.MSG, (...messages: any[]) => {
                // console.log("msg", messages)
                this.emit("prx:msg", identity, ...messages);
            });

            socket.on(EVENT_NAMES.DISSCONNECT, (...messages: any[]) => {
                this.emit("prx:logout", identity, ...messages);
            });

            // socket.on("proxy", (message: string) => {
            //     this.sessions.remove(identity);
            // });

            console.log(`client conncted: ${socket.id}, identity: ${identity}`);

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
