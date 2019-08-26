import {HandlerMeta} from "../meta/handlerMeta";
import {WSContext} from "./context";
import {IMsg} from "../const";
import {ParamMeta} from "../meta/paramMeta";
import {CAssert, CError} from "@khgame/err";
import {WSMeta} from "../meta/wsMeta";

export class Runtime {

    assert = new CAssert();

    handlers: { [code: number]: HandlerMeta; } = {};

    addHandler(meta: HandlerMeta) {
        const code = meta.code;
        if (this.handlers[code]) {
            throw new Error(`handler of code ${code} is already exist`);
        }
        this.handlers[code] = meta;
    }

    getHandler(code: number) {
        return this.handlers[code];
    }

    getTarget(targetClass: Function) {
        const targetMeta = WSMeta.find(targetClass);
        if (!targetMeta) {
            console.error(`cannot find the target : ${targetClass}, is it initialized?`);
            return undefined;
        }
        return targetMeta.instance;
    }

    async call(
        ctx: WSContext, // require context for session (rspOK ...)
        msg: IMsg // code and msg contents
    ) {
        const handlerMeta = this.getHandler(msg.code);
        this.assert.cok(handlerMeta, -1, () => `dispatch failed: cannot find handler of code ${msg.code}`);

        const targetInstance: any = this.getTarget(handlerMeta.targetClass);
        const matchedArgs = handlerMeta.getParamMetas();

        let result: any = undefined;

        // console.log(">> msg:", msg, matchedArgs.length);

        try {
            if (matchedArgs.length <= 0) {
                result = await targetInstance[handlerMeta.methodName].apply(targetInstance, [msg.data, ctx]);
            } else { // using array
                const args: any = [];
                matchedArgs.forEach((paramMeta: ParamMeta) => {
                    args[paramMeta.index] = paramMeta.isContext ? ctx : msg.data[paramMeta.key];
                });
                result = await targetInstance[handlerMeta.methodName].apply(targetInstance, args);
            }
            if (handlerMeta.rspCode !== undefined) {
                ctx.rspOK(handlerMeta.rspCode, result);
            }
        } catch (error) {
            console.log("wsvr.call error: ", error);
            if (handlerMeta.rspCode !== undefined) {
                let errorCode: any = 500;
                if (error instanceof CError) {
                    errorCode = error.code;
                } else if (error.hasOwnProperty("statusCode")) {
                    errorCode = error.statusCode;
                }

                const msgCode = Number(error.message || error);
                const errorMsg = isNaN(msgCode) ? (error.message || error) : msgCode;
                ctx.rspERR(handlerMeta.rspCode, {
                    code: errorCode,
                    msg: errorMsg
                });
            }
        }

    }

}
