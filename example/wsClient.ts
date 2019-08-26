import {forCondition, forMs} from "kht";

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

let seq = 1;
let rspSeq = 0;

// TODO: add function
const client1 = new WSClient("http://localhost:9999", {query: {token: "c1"}});
console.log("send 1");
client1.emit("message", {code: 1, seq: seq++});
console.log("send 2");
client1.emit("message", {code: 2, seq: seq++});
console.log("send 3");
client1.emit("message", {code: 3, seq: seq++, data: {arg1: "HelloWorld!"}});
console.log("send 4");
client1.emit("message", {code: 4, seq: seq++, data: {m: "this is a data"}});
console.log("expect 14");
client1.on("message", (msg: any) => console.log("rsp", msg));
console.log("send 5");
client1.emit("message", {code: 5, seq: seq++, data: {m: "this is a data"}});

console.log("send 6");
client1.emit("message", {code: 6, seq: seq++, data: {m: "this is a data"}});
console.log("send 7");
client1.emit("message", {code: 7, seq: seq++, data: {m: "this is a data"}});
console.log("send 8");
client1.emit("message", {code: 8, seq: seq++, data: {m: "this is a data"}});

console.log("expect 20");
console.log("=== success");


const client2 = new WSClient("http://localhost:10000", {query: {token: "c2"}});
console.log("send 1");
client2.emit("message", {code: 1, seq: seq++});
console.log("send 2");
client2.emit("message", {code: 2, seq: seq++});
console.log("send 3");
client2.emit("message", {code: 3, seq: seq++, data: {arg1: "HelloWorld!"}});
console.log("send 4");
client2.emit("message", {code: 4, seq: seq++, data: {m: "this is a data"}});
console.log("expect 14");
client2.on("message", (msg: any) => console.log("rsp", msg));
console.log("send 5");
client2.emit("message", {code: 5, seq: seq++, data: {m: "this is a data"}});

console.log("send 6");
client2.emit("message", {code: 6, seq: seq++, data: {m: "this is a data"}});
console.log("send 7");
client2.emit("message", {code: 7, seq: seq++, data: {m: "this is a data"}});
console.log("send 8");
client2.emit("message", {code: 8, seq: seq++, data: {m: "this is a data"}});

console.log("expect 20");
console.log("=== success");

const client3 = new WSClient("http://localhost:9999", {query: {token: "c3"}});
const client4 = new WSClient("http://localhost:10000", {query: {token: "c4"}});

let data1: any = {m: "this is a data"};
let data2: any = {};
for (let i = 0; i < 100; i++) {
    data2[Math.random().toFixed(20).toString()] = Math.random().toFixed(20).toString();
}
let data3: any = {};
for (let i = 0; i < 1000; i++) {
    data3[Math.random().toFixed(20).toString()] = Math.random().toFixed(20).toString();
}
let data4: any = {};
for (let i = 0; i < 1000; i++) {
    data4[Math.random().toFixed(20).toString()] = Buffer.from(Math.random().toFixed(20).toString());
}


async function benchmark(client: WSClient) {
    await forMs(1000);
    console.log("benchmark started", seq);
    rspSeq = seq;
    let start = Date.now();
    client.on("message", (msg: any) => {
        rspSeq++;
    });
    for (let i = 0; i < 10000; i++) {
        client.emit("message", {code: 101, seq: seq++, data: data1});
    }
    console.log("t1 sent");
    await forCondition(() => rspSeq === seq);
    const t1 = Date.now() - start;
    console.log("t1", t1);
    for (let i = 0; i < 1000; i++) {
        client.emit("message", {code: 101, seq: seq++, data: data2});
    }
    console.log("t2 sent");
    await forCondition(() => rspSeq === seq);
    const t2 = Date.now() - start;
    console.log("t2", t2);


    for (let i = 0; i < 1000; i++) {
        client.emit("message", {code: 101, seq: seq++, data: data3});
    }
    console.log("t3 sent");
    await forCondition(() => rspSeq === seq);
    const t3 = Date.now() - start;
    console.log("t3", t3);

    for (let i = 0; i < 100; i++) {
        client.emit("message", {code: 101, seq: seq++, data: data4});
    }
    console.log("t4 sent");
    await forCondition(() => rspSeq === seq);
    const t4 = Date.now() - start;
    console.log("t4", t4);

    return [t1, t2, t3, t4];
}


(async function () {
    let delta = await benchmark(client3);
    console.log("benchmark1 finished", delta);
    delta = await benchmark(client4);
    console.log("benchmark2 finished", delta);
})();
