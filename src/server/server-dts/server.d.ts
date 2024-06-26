import { mapObj } from "../../assets/shishiji-dts/objects";


interface mapObjComponent {
    [key: string]: mapObj
}

interface tr {
    title: string
    content: string
}

interface DBColumn{
    idx: number;
}

interface OrgAuthDataColumn extends DBColumn {
    org_name: string;
    pass_word: string;
    cloud_size: number;
    confidence: string;
}

interface OrgAuthSessionColumn extends DBColumn {
    sessionid: string;
    corresponder: string;
}

interface User_QRlogin_Colmn extends DBColumn {
    confidence: string;
    discriminator: string;
    explored_org: string;
}

interface User_Session_Colmn extends DBColumn {
    session: string;
    discriminator: string;
}

export {
    mapObj as mapObject,
    mapObjComponent,
    OrgAuthDataColumn as OrgAuthColumn,
    OrgAuthSessionColumn,
    User_QRlogin_Colmn,
    User_Session_Colmn,
}
