export class LRUNode<T> {
    public next: LRUNode<T> = null;
    public prev: LRUNode<T> = null;

    public latestActTimestamp: number;

    constructor() {
        this.pulse();
    }

    public pulse(): this {
        this.latestActTimestamp = Date.now();
        return this;
    }
}

export interface ILRUOption {
    ttl_ms?: number; // ms
    max_length?: number;
}


export class LRUList<T> {

    public head: LRUNode<T> = null;
    public tail: LRUNode<T> = null;

    public length: number = 0;

    constructor(
        public readonly onRemove: (node: LRUNode<T>) => void,
        public readonly opt: ILRUOption = {}) {
    }

    public remove(node: LRUNode<T>): this {
        const {prev, next} = node;
        if (prev) {
            prev.next = next;
        } else if (this.head === node) {
            this.head = next;
        } else {
            throw new Error(`the node to remove is not in the list.`);
        }

        if (next) {
            next.prev = prev;
        } else if (this.tail === node) {
            this.tail = prev;
        } else {
            throw new Error(`the node to remove is not in the list.`);
        }
        node.prev = node.next = null;
        length -= 1;
        return this;
    }

    public append(node: LRUNode<T>): this {
        if (node.prev || node.next) {
            throw new Error(`the node is already in the list.`);
        }

        node.pulse(); // update time

        if (this.tail) {
            node.prev = this.tail;
            this.tail.next = node;
            this.tail = node;
        } else {
            this.head = this.tail = node;
        }
        length += 1;

        if (this.opt
            && this.opt.max_length !== undefined
            && this.opt.max_length > 0
            && this.length > (this.opt.max_length || 0)) {
            this.remove(this.head);
        }

        return this;
    }

    public heartBeat(node: LRUNode<T>) : boolean {
        if (!node) {
            return false;
        }

        this.remove(node).append(node);

        if (this.opt
            && this.opt.ttl_ms !== undefined
            && this.opt.ttl_ms > 0
        ) {
            const now = Date.now();
            while (this.head && now > this.head.latestActTimestamp + this.opt.ttl_ms) {
                this.remove(this.head);
                this.onRemove(this.head);
            }
        } // when session heart beats, evict inactive
        return true;
    }
}
