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

    public popHead(){
        this.remove(this.head as LLNode<T>);
    }

}
