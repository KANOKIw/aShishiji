import { userDB } from "./doubt";
import { UserClass } from "./about";
import { User_QRlogin_Colmn } from "../../server-dts/server";


export class User implements UserClass{
    user_id = "";

    constructor(user_id: string){
        this.user_id = user_id;
    }

    async getData(key: null): Promise<User_QRlogin_Colmn>
    async getData(key: keyof User_QRlogin_Colmn): Promise<string>
    async getData(key: keyof User_QRlogin_Colmn | null): Promise<User_QRlogin_Colmn | string>{
        return new Promise((r, j) => {
            userDB.all(`SELECT * FROM QRlogin_Users WHERE discriminator=?`,
            [ this.user_id ], function(err, rows: User_QRlogin_Colmn[]){
                if (err){ j(void 0); return; };

                if (rows && rows[0]){
                    if (key){
                        //@ts-ignore
                        r(rows[0][key]);
                    } else {
                        r(rows[0]);
                    }
                } else {
                    j(void 0);
                }
            });
        });
    }


    async setData(key: keyof User_QRlogin_Colmn, value: string): Promise<void>{
        return new Promise((r, j) => {
            userDB.all(`UPDATE QRlogin_Users
                SET ${key} = ?
                WHERE discriminator=?`,
            [ value, this.user_id ], (e) => { e ? j() : r(); });
        });
    }
}

export { }
