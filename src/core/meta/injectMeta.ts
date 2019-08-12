import {MiTable} from "kht";

export class InjectMeta {

    static injectTable: Map<Function, InjectMeta[]> = new Map<Function, InjectMeta[]>();

    public static find(targetClass: Function): InjectMeta[] {
        return this.injectTable.get(targetClass) || [];
    }

    static create(prototype: Object, propertyName: string, fieldConstructor: Function) {
        const injectMeta = new InjectMeta(prototype, propertyName, fieldConstructor);
        if (this.injectTable.has(injectMeta.targetClass)) {
            this.injectTable.get(injectMeta.targetClass).push(injectMeta);
        } else {
            this.injectTable.set(injectMeta.targetClass, [injectMeta]);
        }
    }

    public targetClass: Function;

    constructor(
        public readonly prototype: Object,
        public readonly propertyName: string,
        public readonly fieldConstructor: Function
    ) {
        this.targetClass = prototype.constructor;
    }




}
