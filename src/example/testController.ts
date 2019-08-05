import {WS, WSCtx, WSHandler, WSParam} from "../core";
import {WSContext} from "../core/context";

@WS()
export class TestController {

    /**
     * 无参数调用的示例, 监听事件 1
     */
    @WSHandler(1)
    async method1() {
        console.log("method 1");
    }

    /**
     * 无参数调用的示例, 监听事件 2
     */
    @WSHandler(2)
    async method2() {
        console.log("method 2");
    }

    /**
     * 带参数调用的示例, 监听事件 3
     * 有参数时, 用 WSParam 对应 data 内字段名,
     * 用 Ctx 对应 Context 对象
     * 未指定回报消息号, 返回值不会发送给客户端
     */
    @WSHandler(3)
    async method3(@WSParam("arg1") input: number, @WSCtx() ctx: WSContext) {
        console.log("method 3");
        console.log("inputs", input, ctx);
        return input;
    }


    /**
     * 带参数, 不用 WSParam 的示例
     * 参数固定为 data 和 context
     * 有回报消息号时, 返回值会被发送给客户端
     */
    @WSHandler(4, 5)
    async method4(data: { m: string }, ctx: WSContext) {
        console.log("method 4");
        return data.m;
    }

}
