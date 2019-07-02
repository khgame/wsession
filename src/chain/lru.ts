import {Chain, Node} from "./basic";

export interface ILRUOption {
    ttl_ms?: number; // ms
    max_length?: number;
}

export class LRUNode<T> extends Node {
    public latestActTimestamp: number;

    constructor() {
        super();
        this.pulse();
    }

    public pulse(): this {
        this.latestActTimestamp = Date.now();
        return this;
    }
}

export class LRULst<T> extends Chain {

    constructor(
        public readonly onRemove: (node: LRUNode<T>) => void,
        public readonly opt: ILRUOption = {}) {
        super();
    }

    public popHead(){
        return this.remove(this.head as LRUNode<T>);
    }

    public remove(node: LRUNode<T>): Node {
        super.remove(node);
        this.onRemove(node);
        return node;
    }

    public append(node: LRUNode<T>): Node {
        super.append(node);

        node.pulse(); // update time
        if (this.opt
            && this.opt.max_length !== undefined
            && this.opt.max_length > 0
            && this.length > (this.opt.max_length || 0)) {
            this.popHead();
        }

        return node;
    }

    public heartBeat(node: LRUNode<T>) : boolean {
        if (!node) {
            return false;
        }

        this.remove(node);
        this.append(node);

        if (this.opt
            && this.opt.ttl_ms !== undefined
            && this.opt.ttl_ms > 0
        ) {
            const now = Date.now();
            while (this.head && now > (this.head as LRUNode<T>).latestActTimestamp + this.opt.ttl_ms) {
                this.popHead();
            }
        } // when session heart beats, evict inactive
        return true;
    }
}
