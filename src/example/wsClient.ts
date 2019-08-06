export class WSClient {

    protected _connected: boolean;
    public get connected() {
        return this._connected;
    }

    constructor(
        private url: string,
        private header: any,
        private socket?: any
    ) {
        this.initial();

    }

    protected initial() {
        if (!require) {
            throw new Error("Cannot load WSServer. Try to install all required dependencies: socket.io, socket-controllers");
        }

        try {
            this.socket = require("socket.io-client")(this.url, this.header);
            this.socket.on("connect", () => {
                this._connected = true;
            });
            this.socket.on("disconnect", () => {
                this._connected = false;
            });
        } catch (e) {
            throw new Error("socket.io package was not found installed. Try to install it: npm install socket.io --save");
        }
    }

    public on(event: string, callback: Function) {
        this.socket.on(event, callback);
    }

    public emit(event: string, message: any) {
        this.socket.emit(event, message);
    }

    public removeEvent(event: string) {
        this.socket.removeAllListeners(event);
    }
}

// TODO: add function
const d = new WSClient("http://localhost:9999", {query: {token: "hehe"}});
console.log("send 1");
d.emit("message", {code: 1, seq: 1});
console.log("send 2");
d.emit("message", {code: 2, seq: 2});
console.log("send 3");
d.emit("message", {code: 3, seq: 3, data: {arg1: "HelloWorld!"}});
console.log("send 4");
d.emit("message", {code: 4, seq: 4, data: {m: "this is a data"}});
console.log("expect 14");
d.on("message", (msg: any) => console.log("rsp", msg))
console.log("send 5");
d.emit("message", {code: 5, seq: 4, data: {m: "this is a data"}});
console.log("expect 20");
console.log("success");
