import * as AppAPI from "../../utils";
import sqlite3 from "sqlite3";


export const Database = sqlite3.verbose();
export const random = new AppAPI.Random();
export const userDB = new Database.Database("./.db/user/info.db");


export { }
