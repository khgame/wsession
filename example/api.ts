import "reflect-metadata";
import * as Koa from "koa";
import {Context} from "koa";
import {createServer, Server} from "http";
import {IApi, APIRunningState} from "@khgame/turtle";
import {useContainer, useKoaServer} from "routing-controllers";
import {Container} from "typedi";
import {WSvr} from "../src/core/index";
import {
    HardInjectTestController,
    InjectFieldTestController,
    SoftInjectTestController,
    TestController
} from "./testController";


export class Api implements IApi {

    runningState: APIRunningState;

    private app: Koa;
    public server: Server;

    public enabled: boolean = true;
    public runningRequest: number = 0;


    constructor() {
        this.app = new Koa();
        useContainer(Container);
        this.server = createServer(this.app.callback());
        this.init();
    }

    public async listen(port: number) {
        await new Promise((resolve, reject) => this.server.listen(port, resolve));
    }

    private init() {

        this.app.use(async (ctx: Koa.Context, next: Function) => {
            const startTime = Date.now();
            await next();
            const timeCost = Date.now() - startTime;
        });

        this.app.use(async (ctx: Context, next: (...args: any[]) => any) => {
            this.runningRequest += 1;
            try {
                if (this.enabled) {
                    await next();
                } else {
                    ctx.status = 403;
                }
            } catch (error) {
                ctx.status = 200;
                const msgCode = Number(error.message || error);
                ctx.body = {
                    statusCode: error.statusCode || 500,
                    message: isNaN(msgCode) ? (error.message || error) : msgCode,
                };
            }
            this.runningRequest -= 1;
        });

        this.app = useKoaServer(this.app, {
            routePrefix: "/api",
            validation: true,
            classTransformer: false,
            controllers: [],
            defaultErrorHandler: false,
        });
        new HardInjectTestController("hard");
        new WSvr(this.server,
            [TestController, HardInjectTestController, SoftInjectTestController, InjectFieldTestController],
            async a => a
        );
        this.runningState = APIRunningState.PREPARED;
    }

    public async start(port: number) {
        this.runningState = APIRunningState.STARTING;
        try {
            await this.listen(port);
            this.runningState = APIRunningState.RUNNING;
            return true;
        } catch (e) {
            this.runningState = APIRunningState.PREPARED;
            return false;
        }
    }

    public async close() {
        this.runningState = APIRunningState.CLOSING;
        try {
            this.server.close();
            this.runningState = APIRunningState.CLOSED;
            return true;
        } catch (e) {
            this.runningState = APIRunningState.RUNNING;
            return false;
        }
    }
}
