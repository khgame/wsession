import {Server, Socket} from "socket.io";
import {LRUNode} from "./linkedList/linkedListNode";


export class UserSession extends LRUNode<UserSession> {

    lastHeartBeat: number;

    constructor(
        protected readonly io: Server,
        public readonly socketId: string,
        public readonly uid: string,
    ) {
        super();
        this.heartBeat();
    }

    public get socket(): Socket {
        return this.io.sockets.sockets[this.socketId];
    }

    public get survive(): boolean {
        return this.io && this.io.sockets && this.io.sockets.sockets.hasOwnProperty(this.socketId);
    }

    public emit(event: string | symbol, ...args: any[]): boolean {
        if (!this.survive) {
            throw new Error("cannot emit event to a dead session.");
        }
        return this.socket.emit(event, ...args);
    }

    public heartBeat(): this {
        this.lastHeartBeat = Date.now();
        return this;
    }


}
