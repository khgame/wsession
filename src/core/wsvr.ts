import {Server} from "http";
import {WSServer, UserSession} from "../basic";
import {WSMeta} from "./meta/wsMeta";
import {HandlerMeta} from "./meta/handlerMeta";
import {CAssert, CError} from "@khgame/err";
import {IMsg, MSG_STATUS} from "./const";
import {WSContext, Runtime} from "./runtime";

/**
 * Provides standard of message sending
 */
export class WSvr {

    runtime: Runtime;

    assert = new CAssert();

    wsServer: WSServer<IMsg>;

    constructor(
        public readonly server: Server,
        public readonly targetConstructors: Function[],
        public readonly fnValidateToken: (token: string) => Promise<string | undefined>
    ) {
        this.wsServer = new WSServer(server, fnValidateToken, this.dispatch.bind(this));

        targetConstructors
            .map(c => WSMeta.find(c))
            .filter(c => c)
            .map(tmi => HandlerMeta.list(tmi.targetClass))
            .reduce((prev: HandlerMeta[], mms: HandlerMeta[]) => prev.concat(mms), [])
            .forEach(this.runtime.addHandler.bind(this.runtime));
    }

    public sendMsg(uid: string, code: number, data: any) {
        const rep: IMsg = {
            code, data, status: MSG_STATUS.ok, timestamp: Date.now()
        };
        this.wsServer.emit(uid, rep);
    }

    public sendMsgToAll(code: number, data: any) {
        const rep: IMsg = {
            code, data, status: MSG_STATUS.ok, timestamp: Date.now()
        };
        this.wsServer.emitToAll(rep);
    }

    public async dispatch(session: UserSession<any>, msg: IMsg) {
        try {
            const ctx = new WSContext(
                session, msg, this.sendMsg.bind(this)
            );
            return await this.runtime.call(ctx, msg);
        } catch (e) {
            throw new CError(-1, e);
        }
    }

}
