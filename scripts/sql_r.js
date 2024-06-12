//@ts-check

const sqlite3 = require("sqlite3");
const database = sqlite3.verbose();
const DB = new database.Database("./.db/user/info.db");

DB.serialize(() => {
    DB.run(`CREATE TABLE IF NOT EXISTS QRlogin_Users (
        idx INTEGER,
        discriminator TEXT,
        confidence TEXT,
        PRIMARY KEY (idx)
    );
    `);
    DB.run(`CREATE TABLE IF NOT EXISTS QRlogin_Sessions (
        idx INTEGER,
        discriminator TEXT,
        session TEXT NOT NULL,
        PRIMARY KEY (idx)
    );
    `);
});

