import { Request, Response } from "express";
import { OrgAuth } from "./auth";
import { DEFAULT_MAP_OBJECT } from "../../mapobjs";
import * as AppAPI from "../../utils";
import { mapObject } from "../../server-dts/server";
import { returnError } from "./doubt";


export class Edit{
    async savemain(req: Request, res: Response): Promise<void>{
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


    async saveothers(req: Request, res: Response): Promise<void>{
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
