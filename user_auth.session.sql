CREATE TABLE IF NOT EXISTS QRlogin_Sessions (
    idx INTEGER,
    org_name TEXT,
    pass_word TEXT,
    cloud_size INTEGER, -- MB
    PRIMARY KEY (idx)
);
