export class WSMeta {

    static targetTable: Map<Function, WSMeta> = new Map<Function, WSMeta>();

    static create(
        targetClass: Function,
        option?: any,
    ) {
        const targetMeta = new WSMeta(targetClass, option);
        this.targetTable.set(targetClass, targetMeta);
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
            this._instance = new (this.targetClass as any)();
        }
        return this._instance;
    };

}

