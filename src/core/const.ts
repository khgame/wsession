
export enum MSG_STATUS {
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
    status?: MSG_STATUS;
    data?: any;
    error?: IError;
    context?: any;
    timestamp?: number;
}
