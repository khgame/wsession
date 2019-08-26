import {Socket} from "socket.io";

export interface IProxy {
    onLogin(token: string, socket: Socket): Promise<void>;

    onLogOut(identity: string): void;

    onMsg(identity: string, msg: any): void;

    send(identity: string, msg: any): void;

    broadcast(msg: any): void;

    shutdown(identity: string): void;
}

export enum PROXY_EVENTS {
    PROXY_ON_LOGIN = "prx:login",
    PROXY_ON_LOGOUT = "prx:logout",
    PROXY_ON_MSG = "prx:msg",

    PROXY_LOGIN_RESULT = "prx:login_result",
    PROXY_SEND = "prx:send",
    PROXY_BROADCAST = "prx:broadcast",
    PROXY_SHUTDOWN = "prx:shutdown",
}

export enum CLIENT_EVENTS {
    CS_MSG = "message",
    CS_DISCONNECT = "disconnect",

    SC_LOGIN = "login",
}

