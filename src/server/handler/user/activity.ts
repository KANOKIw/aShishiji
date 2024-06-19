import { Request, Response } from "express";
import { UserAuth } from "./auth";
import { OrgAuth } from "../org/auth";
import { random, userDB } from "./doubt";
import { User } from "./user";


export class UserActivity extends UserAuth{
    async passedOrg(request: Request, response: Response){
        const jetParms = {
            orgConfidence: typeof request.query.cid === "string" ? request.query.cid : "",
            orgname: typeof request.query.oname === "string" ? request.query.oname : "",
        };
        const gr =  random.string(12);
        
        OrgAuth._cidAuth(jetParms.orgname, jetParms.orgConfidence)
        .then(() => {
            const logSession = request.cookies["__shjSID"] || "";

            UserAuth.fineData(logSession)
            .then(async (finedata) => {
                const user = new User(finedata.discriminator);
                const explored: string[] = JSON.parse(await user.getData("explored_org") || "[]");

                if (explored.includes(jetParms.orgname)){
                    response.redirect(`/stamp?psdo=${jetParms.orgname}&went=hahahahaha&g=${gr}`);
                } else {
                    explored.push(jetParms.orgname);
                    await user.setData("explored_org", JSON.stringify(explored));
                    response.redirect(`/stamp?psdo=${jetParms.orgname}&went=unstoppable&g=${gr}`);
                }
            })
            .catch(err => {
                response.redirect(`/stamp?psdo=${jetParms.orgname}&went=whatintheworld&g=${gr}`);
            });
        })
        .catch(err => {
            response.redirect(`/stamp?psdo=${jetParms.orgname}&went=wtfisthisbruh&g=${gr}`);
        });
    }
}


export { }
