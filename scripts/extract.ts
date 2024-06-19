import { Cloud } from "../src/server/handler/org/cloud";
import { orgDB, random } from "../src/server/handler/org/doubt";
import { OrgAuthColumn,User_QRlogin_Colmn } from "../src/server/server-dts/server";
import { DEFAULT_MAP_OBJECT } from "../src/server/mapobjs";
import * as AppAPI from "../src/server/utils";
import * as QRcode from "qrcode";
import { userDB } from "../src/server/handler/user/doubt";

import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from 'path';


const domain = "open-campus.shishiji.com"
const cloud = new Cloud();

const id_vs_orgname = {
    "kendoubu": "剣道部",
    "eiken-1": "映画研究同好会-1",
    "rekishibu": "歴史部",
    "bukkyou_seinen": "仏教青年会",
    "suugakuka": "数学科",
    "butsuribu": "物理部",
    "tigakubu": "地学部",
    "eigoka-eigobu": "英語科英語部",
    "seitokai": "生徒会執行部",
    "shishijifes": "獅子児祭実行委員会",
    "kagakubu": "科学部",
    "volley_ball": "バレーボール部",
    "drone": "ドローン研究同好会",
    "quintet": "あほ",
    "basketball": "バスケットボール部",
    "articulture": "美術部",
    "magic-life": "Magic life",
    "dance": "ダンス同好会",
    "tetuken": "鉄道研究同好会",
    "setagaya_wind_2024": "光る世田谷wind2024",
    "literature": "文芸部",
    "karate": "空手道部",
    "soft-tennis": "ソフトテニス部",
    "engeki": "演劇部",
    "table-tennis": "卓球部",
    "paken": "パソコン研究同好会",
}


function createUserDB(){
    userDB.serialize(() => {
        userDB.run(`CREATE TABLE IF NOT EXISTS QRlogin_Users (
            idx INTEGER,
            discriminator TEXT,
            confidence TEXT,
            PRIMARY KEY (idx)
        );
        `);
        userDB.run(`CREATE TABLE IF NOT EXISTS QRlogin_Sessions (
            idx INTEGER,
            discriminator TEXT,
            session TEXT NOT NULL,
            PRIMARY KEY (idx)
        );
        `);
    });
}


async function getLastUseridx(): Promise<number>{
    createUserDB();
    return new Promise((resolve, reject) => {
        userDB.all("SELECT MAX(idx) FROM QRlogin_Users", function(e,r: {[key:string]:number}[]){
            resolve(r[0]["MAX(idx)"]);
        });
    });
}


var useridx = 0;


function adveEditor(){
    orgDB.all("SELECT * FROM Auth_Data", function(err: Error | null, rows: OrgAuthColumn[]){
        var txt = "";
        for (const row of rows){
            //@ts-ignore
            txt += `${id_vs_orgname[row.org_name]}; uname: ${row.org_name}, pwd: ${row.pass_word}\n`;
            serializeOrg(row);
        }
        fs.writeFileSync("./.data/org/org_pwd.txt", txt);
    });
}

function saveFile(blob: Blob, fp: string){
    blob.arrayBuffer().then((buffer) => {
    fs.writeFile(fp, Buffer.from(buffer), (err) => {
        
        });
    });
}

async function userLoginQRcode(): Promise<void>{
    return new Promise((resolve, reject) => {
        userDB.all("SELECT * FROM QRlogin_Users", [],
        async function(err: Error | null, rows: User_QRlogin_Colmn[]){
            for (const row of rows){
                const username = row.discriminator;
                const url = `https://${domain}/qr_login?glog=${username}&kry=${row.confidence}`;
    
                await QRcode.toDataURL(url, {width: 256}, (err, QRDataURL) => {
                    fetch(QRDataURL)
                    .then(response => response.blob())
                    .then(blob => {
                        saveFile(blob, `./.data/user/login/${username}.png`);
                    });
                });
            }
            resolve();
        });  
    });
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer>{
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            //@ts-ignore
            resolve(reader.result);
        };
        reader.onerror = () => {
            reject(new Error("Failed to read the blob as ArrayBuffer"));
        };
        reader.readAsArrayBuffer(blob);
    });
}

async function createUserLogin(col: { [key: string]: string, discriminator: string, confidence: string }): Promise<void>{
    const username = col.discriminator;
    const url = `https://${domain}/qr_login?glog=${username}&kry=${col.confidence}`;

    return new Promise((resolve, reject) => {
        QRcode.toDataURL(url, {width: 256}, (err, QRDataURL) => {
            fetch(QRDataURL)
            .then(response => response.blob())
            .then(async blob => {
                saveFile(blob, `./.data/user/login/originals/${username}.png`);
                resolve();
            });
        });
    });
}

function orgCompletionQRcode(){
    orgDB.all("SELECT * FROM Auth_Data", [],
    function(err: Error | null, rows: OrgAuthColumn[]){
        for (const row of rows){
            const orgname = row.org_name;
            const url = `https://${domain}/org/completion?oname=${orgname}&cid=${row.confidence}`;

            QRcode.toDataURL(url, {width: 256}, (err, QRDataURL) => {
                fetch(QRDataURL)
                .then(response => response.blob())
                .then(blob => {
                    saveFile(blob, `./.data/org/completion/${orgname}.png`);
                });
            });
        }
    });
}

function initUserData(){
    userDB.run("UPDATE QRlogin_Users SET explored_org=? ",["[]"]);
    userDB.run("DELETE FROM QRlogin_Sessions")
}

async function createUser(): Promise<void>{
    if (useridx == 0){
        useridx = await getLastUseridx() + 1;
    }
    const uid = useridx;
    const confidence = random.string(64);
    const user_id = `OP${uid.toString().padStart(4, '0')}`;

    useridx++;
    
    return new Promise((resolve, reject) => {
        userDB.run(`INSERT INTO QRlogin_Users (confidence, discriminator, explored_org) VALUES (?, ?)`, [ confidence, user_id, "[]" ],
        async function(){
            await createUserLogin({ discriminator: user_id, confidence: confidence });
            resolve();
        });
    });
}

function serializeOrg(row: OrgAuthColumn){
    const orgname = row.org_name;
    try{
        Cloud._createOrgDir(orgname);
    } catch(e){}

    const objdata = AppAPI.getOrgMdata(orgname) || DEFAULT_MAP_OBJECT;
    //@ts-ignore
    const real_orgname: string = id_vs_orgname[orgname];

    if (!real_orgname){
        console.log(orgname);
    }
    objdata.discriminator = orgname;
    objdata.article.title = real_orgname;

    AppAPI.saveOrgMdata(orgname, objdata);
}


async function main(){
    {
        const dag = [
        "karate",
        "soft-tennis",
        "engeki",
        "table-tennis",
        "paken",
    ];
    for (const d of dag){
        orgDB.run(`INSERT INTO Auth_Data (org_name, pass_word, cloud_size) VALUES (?,?,?);`, [d, "UNKO", 512]);

        //@ts-ignore
        serializeOrg({org_name: d });
    }
    }
    
    adveEditor();
}


main();
