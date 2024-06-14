import express from "express";
import http from "http";
import fs from "fs";
import { Server as SocketIO } from "socket.io";

import { app, server, websocket } from "./drought";
import * as drought from "./drought";
import * as mapObjAPI from "./mapobjs";
import { readJSONSync, Random } from "./utils";

import { validationResult, body  } from "express-validator";


__dirname = __dirname.replace(/[/, \\]src[/, \\]server/, "");





websocket.on("connection", (socket) => {
	
	socket.on("/data/update/map-objects", (data) => {
		const mapobjects_ = mapObjAPI.getAllObjects(true);
		socket.emit("/client/update/map-objects", mapobjects_);
	});


	socket.on("disconnect", (reason) => {
		
	});
});



app.post("/org/manage/auth/login", drought.orgauth.login);

app.post("/org/manage/auth/_login", drought.orgauth._login);

app.post("/org/manage/auth/logout", drought.orgauth.logout);

app.post("/org/manage/auth/editor", drought.orgauth.editor);

app.post("/org/manage/edit/saveothers", drought.edit.saveothers);

app.post("/org/manage/edit/savemain", drought.edit.savemain);

app.post("/org/manage/file/list", drought.cloud.list);

app.post("/org/manage/file/overflow", drought.cloud.overflow);

app.post("/org/manage/file/upload", drought.cloud.upload);

app.post("/org/manage/file/delete", drought.cloud.delete);


app.get("/qr_login", drought.userauth.giveSession);

app.post("/login", drought.userauth.giveFine);


app.get("/org_completion", drought.useractivity.passedOrg);


app.post("/data/map-data/objects", (req, res) => {
	const mapobjects_ = mapObjAPI.getAllObjects(false);
	res.send(mapobjects_);
});

app.post("/data/map-data/conf", (req, res) => {
	res.send(drought.mapConfData);
});


app.get("/share_panel", (req, res) => {
	res.sendFile(__dirname + "/resources/html-ctx/share.html");
});



app.get(["/test/", "/test/@", "/test/@:PARAMS"], function(req, res){
	res.sendFile(__dirname + "/test/index.html");
});



app.get("/org/manage/edit", function(req, res){
	res.sendFile(__dirname + "/src/manage/org/editor.html");
});

app.get("/org/manage/login", function(req, res){
	res.sendFile(__dirname + "/src/manage/org/login.html");
});


app.get(["/", "/@", "/@:PARAMS"], function(req, res){
	res.sendFile(__dirname + "/src/main/index.html");
});


app.post("/api/test/spam", function(req, res){
	const body = req.body;
	const data = JSON.parse(fs.readFileSync("./test/spam.json", { encoding: "utf-8" }));
	const key = req.ip || "no-ip";
	const newString = new Random().string(12);

	console.log(body)
	if (typeof data[key] === "undefined"){
		data[key] = { newString: body };
	} else {
		data[key][newString] = body;
	}

	fs.writeFileSync("./test/spam.json", JSON.stringify(data, null, 4), { encoding: "utf-8" });

	const randomstrs: string[] = [];
	for (var i = 0; i < 100; i++){
		randomstrs.push(new Random().string(32));
	}
    const resdat: {[key: string]: string} = {}

	for (var i = 1; i < randomstrs.length; i += 2){
		resdat[randomstrs[i]] = randomstrs[i-1]
	}
		
	res.status(200).send({ status: 200, message: "ok", dat: resdat });
});



http.createServer((express()).all("*", function (request, response) {
    response.redirect(`https://${request.hostname}${request.url}`);
})).listen(80);


server.listen(443, function(){
	console.log("socketio, express server listening on port: 443");
});
