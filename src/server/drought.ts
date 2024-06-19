import fs from "fs";
import express from "express";
import https from "https";
import { Server as SocketIO } from "socket.io";
import fileUpload from "express-fileupload";
import * as cookieParser from "cookie-parser";
import tls from "tls";
import { Request, Response } from "express";

import { readJSONSync } from "./utils";
import { OrgAuth } from "./handler/org/auth";
import { Edit } from "./handler/org/edit";
import { Cloud } from "./handler/org/cloud";
import { UserAuth } from "./handler/user/auth";
import { UserActivity } from "./handler/user/activity";


const httpsOptions = {
    cert: fs.readFileSync("./.cert/shishiji/fullchain.pem").toString("utf-8"),
    key: fs.readFileSync("./.cert/shishiji/privkey.pem").toString("utf-8"),
    SNICallback: (hostname: string, callback: Function) => {
        if (hostname === "open-campus.shishijifes.com"){
            const key = fs.readFileSync("./.cert/open-campus/privkey.pem");
            const cert = fs.readFileSync("./.cert/open-campus/fullchain.pem");
            callback(null, tls.createSecureContext({ key: key, cert: cert }));
        } else if (hostname === "shishiji.kanokiw.com"){
            const key = fs.readFileSync("./.cert/shishiji/privkey.pem");
            const cert = fs.readFileSync("./.cert/shishiji/fullchain.pem");
            callback(null, tls.createSecureContext({ key: key, cert: cert }));
        } else if (hostname === "mc.kanokiw.pw"){
            const key = fs.readFileSync("./.cert/mc/privkey.pem");
            const cert = fs.readFileSync("./.cert/mc/fullchain.pem");
            callback(null, tls.createSecureContext({ key: key, cert: cert }));
        } else if (hostname === "test.kanokiw.pw"){
            const key = fs.readFileSync("./.cert/test/privkey.pem");
            const cert = fs.readFileSync("./.cert/test/fullchain.pem");
            callback(null, tls.createSecureContext({ key: key, cert: cert }));
        } else if (hostname === "dev.kanokiw.pw"){
            const key = fs.readFileSync("./.cert/dev/privkey.pem");
            const cert = fs.readFileSync("./.cert/dev/fullchain.pem");
            callback(null, tls.createSecureContext({ key: key, cert: cert }));
        } else {
            const key = fs.readFileSync("./.cert/dev/privkey.pem");
            const cert = fs.readFileSync("./.cert/dev/fullchain.pem");
            callback(null, tls.createSecureContext({ key: key, cert: cert }));
        }
    }
};


export const mapConfData = readJSONSync("./.data/app/map.json");
export const app = express();
export const server = https.createServer(httpsOptions, app);
export const websocket = new SocketIO(server);


app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(fileUpload());
app.use(cookieParser.default());
app.use(express.static("./"));


export const orgauth = new OrgAuth();
export const edit = new Edit();
export const cloud = new Cloud();
export const userauth = new UserAuth();
export const useractivity = new UserActivity();


export function resFile(fp: string){
    return function(req: Request, res: Response){
        res.sendFile(fp);
    }
}

export { }
