import fs from "fs";
import { Request, Response } from "express";
import { DEFAULT_MAP_OBJECT } from "../../mapobjs";
import * as AppAPI from "../../utils";
import { 
    OrgAuthColumn,
    OrgAuthSessionColumn
    } from "../../server-dts/server";
import { returnError, authDB, random } from "./doubt";
import { Cloud } from "./cloud";


export class OrgAuth{
    async login(req: Request, res: Response): Promise<void>{
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


    async _login(req: Request, res: Response): Promise<void>{
        const data = req.body;
        const session = data.session;
        const orgname = await OrgAuth._auth(session);

        if (!orgname){
            returnError(res, 403);
            return;
        }

        res.status(200).json({ permitted: true });
    }


    async logout(req: Request, res: Response){
        const data = req.body;
        const session = data.session;

        OrgAuth._endSession(session);
        res.status(202).end();
    }


    async editor(req: Request, res: Response): Promise<void>{
        const sessionkey = req.body.session;
        const orgname = await OrgAuth._auth(sessionkey);
        
        if (!orgname){
            returnError(res, 403);
            return;
        }

        console.log(new Date() + ": Editor: "+orgname);

        const mapdata = AppAPI.getOrgMdata(orgname) || DEFAULT_MAP_OBJECT;

        if (!fs.existsSync(Cloud._toOrgDirname(orgname)))
            Cloud._createOrgDir(orgname);

        res.status(200).json({ artdata: mapdata, usn: orgname, mxcs: await Cloud.getOrgMaCloudSize(orgname) });
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