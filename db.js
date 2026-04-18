import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.NODE_ENV === 'production'
    ? '/app/data/briefs.db'
    : path.join(__dirname, 'data', 'briefs.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
        CREATE TABLE IF NOT EXISTS tokens (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            token           TEXT UNIQUE NOT NULL,
            client_name     TEXT NOT NULL,
            client_email    TEXT NOT NULL,
            project_type    TEXT NOT NULL CHECK(project_type IN ('brand', 'web', 'both')),
            prefill         TEXT NOT NULL DEFAULT '{}',
            created_at      INTEGER NOT NULL,
            expires_at      INTEGER NOT NULL,
            used            INTEGER NOT NULL DEFAULT 0,
            submitted_at    INTEGER
        );

        CREATE TABLE IF NOT EXISTS submissions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id        INTEGER NOT NULL REFERENCES tokens(id),
            answers         TEXT NOT NULL,
            submitted_at    INTEGER NOT NULL
        )
    `);

export default db;