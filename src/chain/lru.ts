import {Chain, Node} from "./basic";

export interface ILRUOption {
    ttl_ms?: number; // ms
    max_length?: number;
}

export class LRUNode extends Node {
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

export class LRULst extends Chain {

    constructor(
        public readonly onRemove: (node: LRUNode) => void,
        public readonly opt: ILRUOption = {}) {
        super();
    }

    public popHead(){
        return this.del(this.head as LRUNode);
    }

    public del(node: LRUNode): LRUNode {
        this.remove(node);
        this.onRemove(node);
        return node;
    }

    public push(node: LRUNode): LRUNode {
        this.append(node);

        node.pulse(); // update time
        if (this.opt
            && this.opt.max_length !== undefined
            && this.opt.max_length > 0
            && this.length > (this.opt.max_length || 0)) {
            this.popHead();
        }

        return node;
    }

    public heartBeat(node: LRUNode) : boolean {
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
            while (this.head && now > (this.head as LRUNode).latestActTimestamp + this.opt.ttl_ms) {
                this.popHead();
            }
        } // when session heart beats, evict inactive
        return true;
    }
}
