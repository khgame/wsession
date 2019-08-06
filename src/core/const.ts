
export enum MsgStatus {
    ok = "ok",
    error = "error"
}

export interface IError {
    code: number;
    msg: string;
}

export interface IMsg {
    code: number;
    seq?: number;
    status?: MsgStatus;
    data?: any;
    error?: IError;
    timestamp?: number;
}
