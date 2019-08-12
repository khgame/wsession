import {WSInject, WS, WSCtx, WSHandler, WSMeta, WSParam} from "../core";
import {WSContext} from "../core";
import {Inject} from "typedi";

enum MSG_CODE {
    CS_MSG1 = 1,
    CS_MSG2 = 2,
    CS_MSG3 = 3,
    CS_MSG4 = 4,
    CS_MSG5 = 5,
    CS_MSG6 = 6,
    CS_MSG7 = 7,
    CS_MSG8 = 8,

    SC_MSG4 = 14,
    SC_NOTICE = 20,
}

@WS()
export class TestController {

    /**
     * 无参数调用的示例, 监听事件 1
     */
    @WSHandler(MSG_CODE.CS_MSG1)
    async method1() {
        console.log("CS_MSG1 received");
    }

    /**
     * 无参数调用的示例, 监听事件 2
     */
    @WSHandler(MSG_CODE.CS_MSG2)
    async method2() {
        console.log("CS_MSG2 received");
    }

    /**
     * 带参数调用的示例, 监听事件 3
     * 有参数时, 用 WSParam 对应 data 内字段名,
     * 用 Ctx 对应 Context 对象
     * 未指定回报消息号, 返回值不会发送给客户端
     */
    @WSHandler(MSG_CODE.CS_MSG3)
    async method3(@WSParam("arg1") input: number, @WSCtx() ctx: WSContext) {
        console.log("CS_MSG3 received");
        console.log("input is", input);
        console.log("context is", ctx);
        return input;
    }


    /**
     * 带参数, 不用 WSParam 的示例
     * 参数固定为 data 和 context
     * 有回报消息号时, 返回值会被发送给客户端
     */
    @WSHandler(MSG_CODE.CS_MSG4, MSG_CODE.SC_MSG4)
    async method4(data: { m: string }, ctx: WSContext) {
        console.log("CS_MSG4 received");
        return data.m;
    }

    /**
     * 在 API 中直接给某个用户发消息
     */
    @WSHandler(MSG_CODE.CS_MSG5)
    async method5(data: { m: string }, ctx: WSContext) {
        console.log("CS_MSG5 received");
        ctx.notice("hehe", MSG_CODE.SC_NOTICE, {d: "notice data", m: data.m});
        return data.m;
    }

}


@WS()
export class HardInjectTestController {

    constructor(public param: any) {
        WSMeta.inject(this);
    }

    /**
     * 无参数调用的示例, 监听事件 1
     */
    @WSHandler(MSG_CODE.CS_MSG6)
    async method1() {
        console.log("CS_MSG6 received", this.param);
    }

}

@WS({getInstance: () => new SoftInjectTestController("soft")})
export class SoftInjectTestController {

    constructor(public param: any) {
    }

    /**
     * 无参数调用的示例, 监听事件 1
     */
    @WSHandler(MSG_CODE.CS_MSG7)
    async method1() {
        console.log("CS_MSG7 received", this.param);
    }

}

@WS()
export class InjectBTest {

    word: string = "world";
}


@WS()
export class InjectATest {

    @WSInject(InjectBTest)
    anotherInjectClass: InjectBTest;

    get sentence() {
        return "hello " + this.anotherInjectClass.word;
    }
}

@WS()
export class InjectFieldTestController {

    constructor() {
    }

    @WSInject(InjectATest)
    injectedObject: InjectATest;

    /**
     * 无参数调用的示例, 监听事件 1
     */
    @WSHandler(MSG_CODE.CS_MSG8)
    async method1() {
        console.log("CS_MSG8 received", this.injectedObject.sentence);
    }

}


