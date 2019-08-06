import {UserSession} from "../userSession";
import {IError, IMsg, MsgStatus} from "./const";
import {CError} from "@khgame/err";

export class WSContext {

    constructor(
        public session: UserSession<IMsg>,
        public notice: (uid: string, msg: string) => void,
        public msg: IMsg
    ) {
    }

    public get uid() : string {
        return this.session.uid;
    }

    public response(code: number, data: any, status?: MsgStatus, error?: IError) {
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
        this.response(code, data, MsgStatus.ok);
    }

    public rspERR(code: number, error: IError) {
        this.response(code, undefined, MsgStatus.error, error);
    }

    public async doFunc(func: () => Promise<any>,
                        codeSC: number,
                        cbSuccess?: () => Promise<any> | any) {
        try {
            const returnVal = await func();
            this.rspOK(codeSC, returnVal);
            if (cbSuccess) {
                await Promise.resolve(cbSuccess());
            }
            return true;
        } catch (error) {
            let code: any = 500;
            if (error instanceof CError) {
                code = error.code;
            } else if (error.hasOwnProperty("statusCode")) {
                code = error.statusCode;
            }

            const msgCode = Number(error.message || error);
            const msg = isNaN(msgCode) ? (error.message || error) : msgCode;

            this.rspERR(codeSC, {code, msg});
            return false;
        }
    }
}
