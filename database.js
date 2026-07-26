const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./levels.db");

db.run(`
CREATE TABLE IF NOT EXISTS levels (
    id TEXT PRIMARY KEY,
    name TEXT,
    count INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0
)
`);

module.exports = db;