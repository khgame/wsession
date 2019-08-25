import {UserSession} from "../basic";
import {IError, IMsg, MSG_STATUS} from "./const";

export type Notice = (uid: string, code: number, msg: any) => void;

export class WSContext {

    constructor(
        public session: UserSession<IMsg>,
        public msg: IMsg,
        public notice: Notice,
    ) {
    }

    public get uid() : string {
        return this.session.uid;
    }

    public response(code: number, data: any, status?: MSG_STATUS, error?: IError) {
        const rep: IMsg = {
            code,
            seq: this.msg.seq,
            data,
            status,
            error,
            timestamp: Date.now()
        };
        this.session.emit("message", rep);
    }

    public rspOK(code: number, data: any) {
        this.response(code, data, MSG_STATUS.ok);
    }

    public rspERR(code: number, error: IError) {
        this.response(code, undefined, MSG_STATUS.error, error);
    }
}
