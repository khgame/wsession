import {MiTable} from "kht";

export class ParamMeta {

    static paramTable: MiTable<Function, string, ParamMeta[]> = new MiTable<Function, string, ParamMeta[]>();

    public static find(targetClass: Function, methodName: string): ParamMeta[] {
        return this.paramTable.hGet(targetClass, methodName) || [];
    }

    static create(prototype: Object,
                  methodName: string,
                  index: number,
                  key: string,
                  isCtx: boolean = false) {
        const paramMeta = new ParamMeta(prototype, index, key, isCtx);
        if (this.paramTable.hHas(paramMeta.targetClass, methodName)) {
            this.paramTable.hGet(paramMeta.targetClass, methodName).push(paramMeta);
        } else {
            this.paramTable.hSet(paramMeta.targetClass, methodName, [paramMeta]);
        }
    }

    public targetClass: Function;

    constructor(
        public prototype: Object,
        public index: number,
        public key: string,
        public isContext: boolean = false
    ) {
        this.targetClass = prototype.constructor;
    }


}
