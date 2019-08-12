# WSession

WSession is a server-side websocket framework which enables creating declarative and beautifully organized class-based controllers with decorators.

# Table of Contents

* [Installation](#installation)
* [Quick Start](#quick-start)
* [Examples](#examples)
    - [Using WSHandler](#using-wshandler)
    - [Response](#response)
    - [Send notice](#send-notice)
    - [Using param objects](#using-param-objects)
    - [Using context objects](#using-context-objects)

## Installation

- install with npm
    `npm install wsession --save`
- install with yarn
    `yarn add wsession`

## Quick Start

1. Create a file `testController.ts`

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
2. create a file `app.ts`, and run it.

    ``` typescript
        import {TestController} from "./testController"

        const server = ... // create http server and activate it
        server.listen(port, resolve)

        const svr = new WSvr(
            server,
            [TestController],
            async a => a
        )
    ```

3. create a client project, and try make some messages to the app.

## Decorators


## Examples

#### Using WSHandler

You can declare a class method as an event handler, with the `@WS` and `@WSHandler` decorator. When decorator `@WSParam` and `@WSCtx` are not setted, default args will be `data` and `context`.

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

#### Response

If the rsp_code are specified, which are provided as the second param of `@WSHandler`, the return value will be sent to client as a response.

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

#### Send notice

You can use the method `ctx.notice` to send a message to any user in connection.

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

#### Using param objects

You can use `@WSParam` decorator to define arguments which are inject by request massage.
*In this example, `data.arg1` from request message will be insert as the param `input`.*

```typescript

// ...

@WS()
export class TestController {

    @WSHandler(MSG_CODE.CS_MSG3)
    async method3(@WSParam("arg1") input: number) {
        console.log("CS_MSG3 received");
        console.log("input is", input);
        console.log("context is", ctx);
        return input;
    }
}
```

#### Using context objects

You can use `@WSCtx` decorator to define argument which are inject as context.
*In this example, ctx will be current WSContext*

```typescript

// ...

@WSHandler(MSG_CODE.CS_MSG3)
async method3(@WSParam("arg1") a: number, @WSCtx() ctx: WSContext, @WSParam("arg2") b: number) {
    console.log("context is", ctx);
    return input;
}
```

#### Service injection

You can use `@Inject` to inject services into your class.

```typescript

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

    @WSHandler(MSG_CODE.CS_MSG8)
    async method1() {
        console.log("CS_MSG8 received", this.injectedObject.sentence);
    }

}

```

## Manually set instance

WSMeta will create a instance of classes who marked by decorator `@WS()` when necessary, such as when the message arrives.
By default, each class will be instantiated **only once**, and when instantiated, an **empty parameter list** will be passed to the constructor.

### hard set instance

Sometimes, you may expect to create the service instance by yourself.
In these cases, you can inject the instance into the meta table in the constructor by your self.

```typescript
@WS()
class NewService {

    constructor(
        public readonly paramA: any,
        public readonly paramB: any
    ){
        WSMeta.inject(this);
    }
}

const newService = new NewService("a", "b");

// ...

const svr = new WSvr(server, [NewService], async a => a);

```

### soft set instance

In some another cases, the instantiate method can be a lazy-load implementation.
You can provide `getInstance` option to inject the instances.

```typescript
@WS({ getInstance: () => new NewService("a", "b") })
class NewService {

    constructor(
        public readonly paramA: any,
        public readonly paramB: any
    ){
        WSMeta.inject(this);
    }
}

// ...
const svr = new WSvr(server, [NewService], async a => a);

```

### priority

hard inject > soft inject > natural inject


