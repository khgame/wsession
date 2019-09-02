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
    MSG = "message",
    DISCONNECT = "disconnect",
    SC_LOGIN = "login",
}

