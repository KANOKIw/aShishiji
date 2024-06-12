import fs from "fs";
import * as path from "path";
import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";

import { DEFAULT_MAP_OBJECT } from "../mapobjs";
import * as AppAPI from "../utils";
import { 
    mapObject,
    mapObjComponent,
    OrgAuthColumn,
    OrgAuthSessionColumn
    } from "../server-dts/server";
import sqlite3 from "sqlite3";
import * as file from "../file";


const Database = sqlite3.verbose();
const random = new AppAPI.Random();
const authDB = new Database.Database("./.db/org/auth.db");
const Responses = {
    "400": { status: 400, error: "Bad Request" },
    "403": { status: 403, error: "Permission Denied" },
    "500": { status: 500, err: "Internal Server Error" }
};


function returnError(res: Response, code: 400 | 403 | 500): void{
    res.status(code).json(Responses[code]);
}

class OrgAuth{
    static login(req: Request, res: Response): void{
        const data = req.body;
        const username = data.username;
        const password = data.password;
    
        if (!username || !password){
            returnError(res, 403);
            return;
        }
    
        authDB.serialize(() => {
            authDB.all(`SELECT * FROM Auth_and_Data WHERE org_name=?`,
            [ username ], function(err: Error | null, rows: OrgAuthColumn[]){
                if (err){
                    returnError(res, 500);
                    return;
                }
                
                const correct_data = rows[0];

                if (!correct_data){
                    res.status(404).json({ error: "User name not found" });
                    return;
                } else if (correct_data.pass_word != password){
                    res.status(401).json({ error: "Incorrect password" });
                    return;
                }
            
                const newkey = random.string(48);

                authDB.run(`INSERT INTO Auth_Sessions (sessionid, corresponder) VALUES (?, ?);`, [ newkey, username ], function(err){
                    if (err){
                        returnError(res, 500);
                        return;
                    }
                
                    res.cookie("__ogauthk", newkey, { path: "/org/manage" });
                
                    res.status(200).json({ status: "success" });
                });
            });
        });
    }


    static async _login(req: Request, res: Response): Promise<void>{
        const data = req.body;
        const session = data.session;
        const orgname = await OrgAuth._auth(session);

        if (!orgname){
            returnError(res, 403);
            return;
        }

        res.status(200).json({ permitted: true });
    }


    static logout(req: Request, res: Response){
        const data = req.body;
        const session = data.session;

        OrgAuth._endSession(session);
        res.status(202).end();
    }


    static async editor(req: Request, res: Response): Promise<void>{
        const sessionkey = req.body.session;
        const orgname = await OrgAuth._auth(sessionkey);
        
        if (!orgname){
            returnError(res, 403);
            return;
        }

        console.log(new Date() + ": Editor: "+orgname);

        const mapdata = AppAPI.getOrgMdata(orgname) || DEFAULT_MAP_OBJECT;

        if (!fs.existsSync(File._toOrgDirname(orgname)))
            File._createOrgDir(orgname);

        res.status(200).json({ artdata: mapdata, usn: orgname, mxcs: await File.getOrgMaCloudSize(orgname) });
    }


    /**
     * get orgname linked session
     * @param session 
     * @returns orgname or null if not found
     */
    static _auth(session: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            if (!session) resolve(null);
            
            authDB.all(`SELECT * FROM Auth_Sessions WHERE sessionid=?`, [ session ], function(err: Error | null, rows: OrgAuthSessionColumn[]) {
                if (err) resolve(null);
                else {
                    if (rows.length > 0) {
                        const orgname = rows[0].corresponder;
                        resolve(orgname);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }


    static _endSession(session: string): void{
        authDB.run(`DELETE FROM Auth_Sessions WHERE sessionid=?`, [ session ]);
    }
}


class Edit{
    static async savemain(req: Request, res: Response): Promise<void>{
        const data = req.body;
        const session = data.session;
        const username = await OrgAuth._auth(session);
        const newMapdata: mapObject = JSON.parse(data.nmap);
        
        if (!username || !newMapdata){
            returnError(res, 403);
            return;
        }

        const prevObjdata = AppAPI.getOrgMdata(username) || DEFAULT_MAP_OBJECT;

        prevObjdata.discriminator = username;
        prevObjdata.article.content = newMapdata.article.content;

        AppAPI.saveOrgMdata(username, prevObjdata);

        res.status(202).end();
    }


    static async saveothers(req: Request, res: Response): Promise<void>{
        const data = req.body;
        const session = data.session;
        const username = await OrgAuth._auth(session);
        const newMapdata: mapObject = JSON.parse(data.nmap);
        
        if (!username || !newMapdata){
            returnError(res, 403);
            return;
        }

        const prevObjdata = AppAPI.getOrgMdata(username) || DEFAULT_MAP_OBJECT;

        prevObjdata.discriminator = username;
        prevObjdata.article.font_family = newMapdata.article.font_family;
        prevObjdata.article.core_grade = newMapdata.article.core_grade;
        prevObjdata.article.images = newMapdata.article.images;
        prevObjdata.object.images = newMapdata.object.images;
        prevObjdata.article.theme_color = newMapdata.article.theme_color;

        AppAPI.saveOrgMdata(username, prevObjdata);

        res.status(202).end();
    }
}


class File{
    static async list(req: Request, res: Response): Promise<void>{
        const data = req.body;
        const session = data.session;
        const orgname = await OrgAuth._auth(session);

        if (!orgname){
            returnError(res, 403);
            return;
        }
        
        const dirname = File._toOrgDirname(orgname);

        if (!fs.existsSync(dirname)){
            File._createOrgDir(orgname);
        }

        File._sendOrgdirInfo(orgname, res);
    }


    static async overflow(req: Request, res: Response): Promise<void>{
        const data = req.body;
	    const session = data.session;
        const orgname = await OrgAuth._auth(session);
        const incsize = Number(data.size);

        if (!orgname || incsize == null || isNaN(incsize)){
            returnError(res, 400);
            return;
        }

        const dirpath = File._toOrgDirname(orgname);
        const incd = AppAPI.convertUnit((File._getDirsize(dirpath, false) + incsize), "MB");
        const maxClousSize = await File.getOrgMaCloudSize(orgname);
        const responsedata = { acceptable: true, overflow: incd - maxClousSize };

        if (responsedata.overflow > 0){
            responsedata.acceptable = false;
        }

        res.status(200).json(responsedata);
    }


    static async upload(req: Request, res: Response): Promise<void>{
        const files = req.files;
	    const session = req.body.session;
        const orgname = await OrgAuth._auth(session);
        
        if (!orgname || !files || Object.keys(files).length != 1){
            returnError(res, 400);
            return;
        }

        const file: UploadedFile = files.file as UploadedFile;
        const dirpath = File._toOrgDirname(orgname);
        const mediatype = AppAPI.getMediaType(file.name);
        const ext = path.extname(file.name);

        if (mediatype == "unknown"){
            returnError(res, 403);
            return;
        }

        if (!fs.existsSync(dirpath))
            File._createOrgDir(orgname);

        const existfiles = fs.readdirSync(dirpath)
        .map(fn => { return fn.replace(/\..*/, ""); });
        // Prevent first upload error
        var filename = mediatype + "_0";
        var broken = false;
        
        for (const i in existfiles){
            filename = mediatype + "_" + i;
            
            if (!existfiles.includes(filename)){
                broken = true;
                break;
            }
        }
        if (!broken){
            filename = mediatype + "_" + existfiles.length;
        }
        filename += ext;

        const currentdirsize = File._getDirsize(dirpath, false);
        const aftersize = AppAPI.convertUnit(currentdirsize + file.size, "MB");
        const maxsize = await File.getOrgMaCloudSize(orgname);

        if (aftersize > maxsize){
            res.status(413).json({ status: 413, error: "Your cloud is overflowing!", overflow: (aftersize - maxsize) });
            return;
        }

        file.mv(dirpath + "/" + filename, err => {
            if (err){
                return res.status(500).send({ error: err });
            }

            File._sendOrgdirInfo(orgname, res, { uploaded: filename });
        });
    }


    static async delete(req: Request, res: Response): Promise<void>{
        const data = req.body;
        const files = JSON.parse(data.files) || [];
	    const session = data.session;
        const orgname = await OrgAuth._auth(session);
        
        if (files.length == 0 || !orgname){
            returnError(res, 403);
            return;
        }

        const dirpath = File._toOrgDirname(orgname);
        var deletecount = 0;
        
        new Promise((resolve, reject) => {
            for (const fn of files){
                fs.unlink(dirpath+"/"+fn, err => {
                    if (err){
                        res.status(500).send({ error: err });
                        reject();
                        return;
                    }
                    deletecount++;
                    if (deletecount == files.length)
                        resolve(void 0);
                });
            }
        })
        .then(() => {
            File._sendOrgdirInfo(orgname, res, { deleted: files });
        })
        .catch(() => {});
    }


    /**
     * not handling null orgname
     * @param orgname 
     */
    static async _sendOrgdirInfo(orgname: string, res: Response, adjust?: {[key: string]: any}): Promise<void>{
        const dirname = File._toOrgDirname(orgname);
        const sizemap = File._getDirsize(dirname, true);
        var filelist = File._filelist(orgname);
        var totalsize = 0;

        if (adjust?.deleted){
            filelist = filelist.filter(o=> { 
                if (path.basename(o) !== adjust.deleted)
                    return true;
            });
        }
        
        
        Object.keys(sizemap).forEach(f => {
            const converted = AppAPI.convertUnit(sizemap[f], "MB");

            totalsize += converted;
            sizemap[path.basename(f)] = converted;

            delete sizemap[f];
        });
        
        const defaultres: {[key: string]: any} = {
            files: filelist,
            totalsize: totalsize,
            sizemap: sizemap,
            mxcs: await File.getOrgMaCloudSize(orgname),
        };

        if (adjust){
            for (const key of Object.keys(adjust)){
                defaultres[key] = adjust[key];
            }
        }
        
        res.send(defaultres);
    }


    static _filelist(orgname: string): string[]{
        // folder: never
        return fs.readdirSync(this._toOrgDirname(orgname));
    }


    static _createOrgDir(orgname: string): void{
        fs.mkdirSync(this._toOrgDirname(orgname));
    }

    
    static _toOrgDirname(orgname: string): string{
        return "./resources/cloud/org/"+orgname;
    }


    static _getDirsize(dirpath: string, each: true): {[key: string]: number};
    static _getDirsize(dirpath: string, each: false | null): number;
    static _getDirsize(dirpath: string, each: true | false | null){
        var total = 0;
        var eachtotal: {[key: string]: number} = {};
    
        const files = fs.readdirSync(dirpath);
    
        files.forEach(file => {
            const filePath = path.join(dirpath, file);
            try{
                const stats = fs.statSync(filePath);
            
                if (each){
                    eachtotal[filePath] = stats.size;
                } else{
                    total += stats.size;
                }
            } catch(e){}
        });
    
        if (each)
            return eachtotal;
        else
            return total;
    }

    /**
     * not handling null orgname
     * @param orgname 
     */
    static getOrgMaCloudSize(orgname: string): Promise<number>{
        return new Promise(function(resolve, reject){
            authDB.all(`SELECT * FROM Auth_and_Data WHERE org_name=?`, [ orgname ], (err, rows: OrgAuthColumn[]) => {
                if (rows && rows[0]){
                    resolve(rows[0].cloud_size);
                } else {
                    resolve(0);
                }
            });
        });
    }
}


export {
    OrgAuth,
    Edit,
    File,
}
