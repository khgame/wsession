import { Server } from "http";
import { WSServer } from "../wsServer";
import { UserSession } from "../userSession";

export class WebSocket {

    constructor(server: Server) {
        new WSServer(server, this.validateToken.bind(this), this.callback.bind(this));
    }

    public async validateToken(token: string): Promise<string | undefined> {
        return token;
    }

    public async callback(session: UserSession<any>, msg: any) {
        console.log(session.uid, msg);
    }
}
