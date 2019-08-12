import {IWSOption} from "../decorator";
import {InjectMeta} from "./injectMeta";

export class WSMeta {

    static targetTable: Map<Function, WSMeta> = new Map<Function, WSMeta>();

    static create(
        targetClass: Function,
        option?: IWSOption,
    ) {
        const targetMeta = new WSMeta(targetClass, option);
        this.targetTable.set(targetClass, targetMeta);
    }

    static setInstance<T>(instance: Object, targetClass?: Function) {
        targetClass = targetClass || instance.constructor;
        return this.find(targetClass).instance = instance;
    }

    static removeInstance<T>(instance: Object, targetClass?: Function) {
        targetClass = targetClass || instance.constructor;
        this.find(targetClass).instance = null;
    }

    static find(targetClass: Function): WSMeta {
        return this.targetTable.get(targetClass);
    }

    static exist(targetClass: Function) {
        return this.targetTable.has(targetClass);
    }

    constructor(
        public targetClass: Function,
        protected readonly option?: IWSOption,
    ) {
    }

    private _instance: Object;

    get instance() {
        if (!this._instance) {
            this.instance = (this.option && this.option.getInstance && this.option.getInstance())
                || new (this.targetClass as any)();
        }
        return this._instance;
    }

    set instance(inst: Object | null) {
        if (null === inst) {
            this._instance = null; // todo: trigger events
            return;
        }

        if (inst.constructor !== this.targetClass) {
            throw new Error(`set instance error: the given instance must be a ${this.targetClass}.`);
        }

        InjectMeta.find(this.targetClass).forEach(injectMeta => {
            const correspondingWsMeta = WSMeta.find(injectMeta.targetClass);
            if (!(inst as any)[injectMeta.propertyName] && !!correspondingWsMeta) {
                (inst as any)[injectMeta.propertyName] = WSMeta.find(injectMeta.fieldConstructor).instance;
            }
        });
        // todo: Solve circular reference problems
        // todo: trigger events

        this._instance = inst;
    }

}

