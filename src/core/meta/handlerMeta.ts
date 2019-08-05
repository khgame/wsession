import {MiTable} from "kht/lib";
import {ParamMeta} from "./paramMeta";

export class HandlerMeta {

    static codeTable: MiTable<Function, string, HandlerMeta> = new MiTable<Function, string, HandlerMeta>();

    public static find(targetClass: Function, methodName: string): HandlerMeta | undefined {
        return this.codeTable.hGet(targetClass, methodName);
    }

    public static list(targetClass: Function): HandlerMeta[] {
        return this.codeTable.hGetValues(targetClass);
    }

    static create(prototype: Object,
                  methodName: string,
                  code: number,
                  rspCode?: number) {
        const meta = new HandlerMeta(prototype, methodName, code, rspCode);
        this.codeTable.hSet(meta.targetClass, methodName, meta);
        return meta;
    }

    public targetClass: Function;

    constructor(
        public prototype: Object,
        public methodName: string,
        public code: number,
        public rspCode?: number
    ) {
        this.targetClass = prototype.constructor;
    }

    getParamMetas(): ParamMeta[] {
        return ParamMeta.find(this.targetClass, this.methodName) || [];
    }

}
