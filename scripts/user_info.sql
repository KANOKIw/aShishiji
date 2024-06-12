CREATE TABLE IF NOT EXISTS QRlogin_Users (
    idx INTEGER,
    discriminator TEXT,
    confidence TEXT,
    PRIMARY KEY (idx)
);
CREATE TABLE IF NOT EXISTS QRlogin_Sessions (
    idx INTEGER,
    discriminator TEXT,
    session TEXT NOT NULL,
    PRIMARY KEY (idx)
);

INSERT INTO QRlogin_Users (discriminator,confidence) VALUES ("_", "_")
