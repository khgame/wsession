
export interface IError {
    code: number;
    msg: string;
}

export interface IMsg {
    code: number;
    seq?: number;
    status?: "ok" | "error";
    data?: any;
    error?: IError;
    timestamp?: number;
}
