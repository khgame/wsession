import { Api } from "./api";
import { turtle } from "@khgame/turtle/lib";
import * as Path from "path";

const conf = {
    "name": "wsession",
    "id": 0,
    "port": 9999,
};


async function start() {
    turtle.conf = conf;
    const app = new Api();
    await turtle.startAll(app);
}

start().then(() => {
    console.log("service started");
});
