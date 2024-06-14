import fs from "fs";
import express from "express";
import https from "https";
import { Server as SocketIO } from "socket.io";
import fileUpload from "express-fileupload";
import * as cookieParser from "cookie-parser";

import { readJSONSync } from "./utils";
import { OrgAuth } from "./handler/org/auth";
import { Edit } from "./handler/org/edit";
import { Cloud } from "./handler/org/cloud";
import { UserAuth } from "./handler/user/auth";
import { UserActivity } from "./handler/user/activity";


const httpsOptions = {
    cert: fs.readFileSync("./.cert/dev/fullchain.pem").toString("utf-8"),
    key: fs.readFileSync("./.cert/dev/privkey.pem").toString("utf-8")
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


export { }
