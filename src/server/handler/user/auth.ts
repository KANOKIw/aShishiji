import { Request, Response } from "express";
import { userDB } from "./doubt";

import { User_QRlogin_Colmn, User_Session_Colmn } from "../../server-dts/server"
import { random } from "./doubt";
import { User } from "./user";


function rejectReq(res: Response, status: number, msg: string): void{
    res.status(status).json({status: status, message: msg});
}


export class UserAuth{
    static async warrant(discriminator: string, preconfidence: string): Promise<string>{
        return new Promise((resolve, reject) => {
            userDB.all(`SELECT * FROM QRlogin_Users WHERE discriminator=?`,
            [ discriminator ], function(err, rows: User_QRlogin_Colmn[]){
                if (err){
                    reject("unknown");
                    return;
                }
                
                const user_data = rows[0];
    
                if (!user_data){
                    reject("no user found");
                } else if (user_data.confidence != preconfidence){
                    reject("incorrect confidence");
                } else {
                    const session_id = random.string(64);
                    resolve(session_id);
                }
            });
        });
    }


    static async insertSession(discriminator: string, session_id: string): Promise<void>{
        return new Promise((resolve, reject) => {
            userDB.run(`INSERT INTO QRlogin_Sessions (discriminator, session) VALUES (?, ?)`,
                [ discriminator, session_id ], resolve
            );
        });
    }


    static async fineData(session_id: string): Promise<User_QRlogin_Colmn>{
        return new Promise((resolve, reject) => {
            userDB.all(`SELECT * FROM QRlogin_Sessions WHERE session=?`, [ session_id ],
                async function(err, rows: User_Session_Colmn[]){
                    if (err){
                        reject("unknown");
                        return;
                    }

                    const row = rows[0];

                    if (!row){
                        reject("no user found");
                    } else {
                        const user = new User(row.discriminator);
                        
                        resolve(await user.getData(null));
                    }
                }
            )
        });
    }


    async giveSession(request: Request, response: Response): Promise<void>{
        const reqData = {
            discriminator: typeof request.query.glog === "string" ? request.query.glog : "",
            confidence: typeof request.query.kry === "string" ? request.query.kry : "",
        };
        
        UserAuth.warrant(reqData.discriminator, reqData.confidence)
        .then(async session_id => {
            const date = new Date();

            await UserAuth.insertSession(reqData.discriminator, session_id);

            date.setMonth(date.getMonth() + 1);
            response.cookie("__shjSID", session_id, { path: "/", expires: date }).status(202).redirect("/test");
        })
        .catch((msg: string) => {
            rejectReq(response, 403, msg);
            return;
        });
    }


    async giveFine(request: Request, response: Response): Promise<void>{
        const session_id = request.cookies.__shjSID;
        
        await UserAuth.fineData(session_id)
        .then(row => {
            response.status(200).json({
                discriminator: row.discriminator,
                completed_org: row.explored_org || "[]",
            });
        })
        .catch(err => {
            response.status(404).end();
        });
    }
}


export { }
