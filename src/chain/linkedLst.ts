import {Chain, Node} from "./basic";

export class LLNode<T> extends Node {
    constructor(public payload: T) {
        super();
    }
}

export class LinkedLst<T> extends Chain {

    constructor() {
        super();
    }

    public push(payload: T){
        this.append(new LLNode<T>(payload));
    }

    public pop(payload: T): T{
        return (this.remove(this.head as LLNode<T>) as LLNode<T>).payload;
    }

}
