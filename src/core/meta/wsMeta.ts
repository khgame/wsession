import {IWSOption} from "../decorator";
import {InjectMeta} from "./injectMeta";

export class WSMeta {

    static instanceTable: Map<Function, any> = new Map<Function, any>();

    static targetTable: Map<Function, WSMeta> = new Map<Function, WSMeta>();

    static create(
        targetClass: Function,
        option?: IWSOption,
    ) {
        const targetMeta = new WSMeta(targetClass, option);
        this.targetTable.set(targetClass, targetMeta);
    }

    static inject<T>(instance: Object, targetClass?: Function) {
        return this.instanceTable.set(targetClass ? targetClass : instance.constructor, instance);
    }

    static uninject<T>(instance: Object, targetClass?: Function) {
        if (this.instanceTable.get(targetClass ? targetClass : instance.constructor) === instance) {
            this.instanceTable.delete(targetClass);
        }
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

    private _instance: any;

    get instance() {
        if (!this._instance) {
            this._instance = WSMeta.instanceTable.get(this.targetClass)
                || (this.option && this.option.getInstance && this.option.getInstance())
                || new (this.targetClass as any)();

            InjectMeta.find(this.targetClass).forEach(injectMeta => {
                const correspondingWsMeta = WSMeta.find(injectMeta.targetClass);
                if (!this._instance[injectMeta.propertyName] && !!correspondingWsMeta) {
                    this._instance[injectMeta.propertyName] = WSMeta.find(injectMeta.fieldConstructor).instance;
                }
            });

            // todo: Solve circular reference problems
        }
        return this._instance;
    }

}

