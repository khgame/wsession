import {Socket} from "socket.io";

export interface IProxy {
    onLogin(token: string, socket: Socket): Promise<void>;

    onLogOut(identity: string): void;

    onMsg(identity: string, msg: any): void;

    send(identity: string, msg: any): void;

    broadcast(msg: any): void;

    shutdown(identity: string): void;
}
