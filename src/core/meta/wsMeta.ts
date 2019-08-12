export class WSMeta {

    static injectTable: Map<Function, any> = new Map<Function, any>();

    static targetTable: Map<Function, WSMeta> = new Map<Function, WSMeta>();

    static create(
        targetClass: Function,
        option?: any,
    ) {
        const targetMeta = new WSMeta(targetClass, option);
        this.targetTable.set(targetClass, targetMeta);
    }

    static inject<T>(instance: Object, targetClass?: Function) {
        return this.injectTable.set(targetClass ? targetClass : instance.constructor, instance);
    }

    static uninject<T>(instance: Object, targetClass?: Function) {
        if (this.injectTable.get(targetClass ? targetClass : instance.constructor) === instance) {
            this.injectTable.delete(targetClass);
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
        option?: any,
    ) {
    }

    private _instance: any;

    get instance() {
        if (!this._instance) {
            this._instance = WSMeta.injectTable.get(this.targetClass) || new (this.targetClass as any)();
        }
        return this._instance;
    }

}

