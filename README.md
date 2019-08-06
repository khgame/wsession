# WSession

WSession is a server-side websocket framework which enables creating declarative and beautifully organized class-based controllers with decorators.

## Installation

- install with npm
    `npm install wsession --save`
- install with yarn
    `yarn add wsession`

## Quick Start

```typescript

import {WS, WSCtx, WSHandler, WSParam, WSContext} from "wsession";

enum MSG_CODE {
    CS_MSG1 = 1,
    CS_MSG2 = 2,
    CS_MSG3 = 3,
    CS_MSG4 = 4,
    SC_MSG4 = 5,
    // ...
}

@WS()
export class TestController {

    @WSHandler(MSG_CODE.CS_MSG1, MSG_CODE.CS_MSG2)
    async echo(@WSParam("arg1") input: number, @WSCtx() ctx: WSContext) {
        console.log("SC_MSG3 received");
        console.log("input is", input);
        console.log("context is", ctx);
        return input;
    }
}

```

## Examples


1. Default handler

    If decorator WSParam and WSCtx are not used, default args are data and context.

    ```typescript

    // ...

    @WS()
    export class TestController {

        @WSHandler(MSG_CODE.CS_MSG1)
        async sample(data: IDataType, ctx: WSContext) {
            console.log("SC_MSG3 received");
            console.log("input is", input);
            console.log("context is", ctx);
        }
    }

    ```

2. Response

    If the rsp_code are specified, the return value will be sent to client

    ```typescript

    // ...

    @WS()
    export class TestController {

        @WSHandler(MSG_CODE.CS_MSG4, MSG_CODE.SC_MSG4)
        async sample(data: IDataType, ctx: WSContext) {
            console.log("SC_MSG3 received");
            console.log("input is", input);
            console.log("context is", ctx);
            return input;
        }
    }

    ```

3. Messaging

    Send message to a user

    ```typescript

    // ...

    @WS()
    export class TestController {

        @WSHandler(MSG_CODE.CS_MSG5)
        async sample(data: { uid: string }, ctx: WSContext) {
            ctx.notice(data.uid, MSG_CODE.SC_NOTICE, { d: "notice data" });
        }
    }

    ```





