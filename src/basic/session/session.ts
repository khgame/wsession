import {IProxy} from "./proxy";

export type SessionMsgHandler<TMessage> = (session: Session<TMessage>, message: TMessage) => void;

export class Session<TMessage> {

    constructor(public readonly identity: string, public readonly proxy: IProxy) {
    }

    send(msg: TMessage) {
        this.proxy.send(this.identity, msg);
    }

}

export class SessionFactory<TMessage> {

    sessionMap: { [identity: string]: Session<TMessage> } = {};

    constructor(
        public readonly validateToken: (token: string) => Promise<string>,
        public readonly eventHandler: SessionMsgHandler<TMessage>
    ) {

    }

    add(identity: string, proxy: IProxy) {
        this.sessionMap[identity] = new Session<TMessage>(identity, proxy);
    }

    remove(identity: string) {
        delete this.sessionMap[identity];
    }

    onMsg(identity: string, msg: TMessage) {
        this.eventHandler(this.sessionMap[identity], msg);
    }

    send(identity: string, msg: TMessage) {
        return this.sessionMap[identity].proxy.send(identity, msg); // todo: assert
    }
}
