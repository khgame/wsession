import {UserSession} from "../../basic/index";
import {IError, IMsg, MSG_STATUS} from "../const";
import {Session} from "../../basic/proxy";

export type Notice = (uid: string, code: number, msg: any) => void;

export class WSContext {

    constructor(
        public session: Session<any>,
        public msg: IMsg,
        public notice: Notice,
    ) {
    }

    public get uid() : string {
        return this.session.identity;
    }

    public response(code: number, data: any, status?: MSG_STATUS, error?: IError) {
        const rep: IMsg = {
            code,
            seq: this.msg.seq,
            context: this.msg.context,
            data,
            status,
            error,
            timestamp: Date.now()
        };
        this.session.send(rep);
    }

    public rspOK(code: number, data: any) {
        this.response(code, data, MSG_STATUS.ok);
    }

    public rspERR(code: number, error: IError) {
        this.response(code, undefined, MSG_STATUS.error, error);
    }
}
