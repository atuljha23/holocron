#!/usr/bin/env node
/**
 * Holocron learning crystal — SQLite + FTS5 store for persistent corrections.
 *
 * Scopes:
 *   user    -> ~/.holocron/learnings.db         (follows you everywhere)
 *   project -> <cwd>/.holocron/learnings.db     (lives with the repo, commit or ignore per team)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function tryRequire(mod) {
  try { return require(mod); }
  catch (err) { return { __missing: err }; }
}

function isBindingsError(err) {
  const msg = (err && err.message) || '';
  return /bindings file|Could not locate the bindings|Cannot find module/i.test(msg);
}

function loadSqlite() {
  const D = tryRequire('better-sqlite3');
  return D.__missing ? null : D;
}

function runBootstrap() {
  // Lazy-load to avoid a hard require cycle; _bootstrap is resilient.
  try {
    const { ensureDeps } = require('./_bootstrap');
    return ensureDeps();
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

function bustSqliteCache() {
  for (const mod of ['better-sqlite3', 'bindings']) {
    try { delete require.cache[require.resolve(mod)]; } catch (_) { /* noop */ }
  }
}

let _cachedDatabase = loadSqlite();

function userDbPath() {
  const base = process.env.HOLOCRON_HOME || path.join(os.homedir(), '.holocron');
  fs.mkdirSync(base, { recursive: true });
  return path.join(base, 'learnings.db');
}

function projectDbPath() {
  const base = path.join(process.cwd(), '.holocron');
  if (!fs.existsSync(base)) return null;
  return path.join(base, 'learnings.db');
}

function ensureProjectDir() {
  const base = path.join(process.cwd(), '.holocron');
  fs.mkdirSync(base, { recursive: true });
  return path.join(base, 'learnings.db');
}

function _instantiate(dbPath) {
  const Database = _cachedDatabase || loadSqlite();
  if (!Database) {
    const err = new Error(
      "Holocron requires 'better-sqlite3'. Run:  cd " +
      path.dirname(__dirname) + " && npm install"
    );
    err.code = 'HOLOCRON_MISSING_DEP';
    throw err;
  }
  _cachedDatabase = Database;
  return Database(dbPath);
}

function openDb(dbPath) {
  let db;
  try {
    db = _instantiate(dbPath);
  } catch (err) {
    if (!isBindingsError(err)) throw err;
    // Self-heal: run npm install in the plugin root, then retry once.
    const boot = runBootstrap();
    if (!boot || !boot.ok) {
      const hint = (boot && boot.hint) || `cd ${path.dirname(__dirname)} && npm install`;
      const e = new Error(
        `Holocron SQLite binding missing and auto-bootstrap failed. Fix: ${hint}`
      );
      e.code = 'HOLOCRON_BOOTSTRAP_FAILED';
      e.cause = err;
      throw e;
    }
    bustSqliteCache();
    _cachedDatabase = null;
    db = _instantiate(dbPath);
  }
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS learnings (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      title          TEXT NOT NULL,
      rule           TEXT NOT NULL,
      reason         TEXT,
      scope          TEXT NOT NULL CHECK(scope IN ('user','project')) DEFAULT 'user',
      tags           TEXT,
      source_session TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS learnings_fts USING fts5(
      title, rule, reason, tags,
      content='learnings', content_rowid='id',
      tokenize='porter unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS learnings_ai AFTER INSERT ON learnings BEGIN
      INSERT INTO learnings_fts(rowid, title, rule, reason, tags)
      VALUES (new.id, new.title, new.rule, new.reason, new.tags);
    END;
    CREATE TRIGGER IF NOT EXISTS learnings_ad AFTER DELETE ON learnings BEGIN
      INSERT INTO learnings_fts(learnings_fts, rowid, title, rule, reason, tags)
      VALUES ('delete', old.id, old.title, old.rule, old.reason, old.tags);
    END;
    CREATE TRIGGER IF NOT EXISTS learnings_au AFTER UPDATE ON learnings BEGIN
      INSERT INTO learnings_fts(learnings_fts, rowid, title, rule, reason, tags)
      VALUES ('delete', old.id, old.title, old.rule, old.reason, old.tags);
      INSERT INTO learnings_fts(rowid, title, rule, reason, tags)
      VALUES (new.id, new.title, new.rule, new.reason, new.tags);
    END;

    CREATE INDEX IF NOT EXISTS idx_learnings_created ON learnings(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_learnings_scope ON learnings(scope);
  `);
}

function dbsForRead() {
  const dbs = [];
  const u = userDbPath();
  dbs.push({ scope: 'user', path: u, db: openDb(u) });
  const p = projectDbPath();
  if (p) dbs.push({ scope: 'project', path: p, db: openDb(p) });
  return dbs;
}

function dbForWrite(scope) {
  const target = scope === 'project' ? ensureProjectDir() : userDbPath();
  return { scope, path: target, db: openDb(target) };
}

function addLearning({ title, rule, reason, tags, scope = 'user', sessionId }) {
  if (!title || !rule) throw new Error('title and rule are required');
  const { db, path: dbPath } = dbForWrite(scope);
  const stmt = db.prepare(
    `INSERT INTO learnings (title, rule, reason, scope, tags, source_session)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(title, rule, reason || null, scope, tags || null, sessionId || null);
  return { id: info.lastInsertRowid, scope, path: dbPath };
}

function listLearnings({ scope, limit = 50 } = {}) {
  const rows = [];
  for (const { scope: s, db } of dbsForRead()) {
    if (scope && scope !== s) continue;
    const r = db
      .prepare(`SELECT id, title, rule, reason, scope, tags, created_at FROM learnings ORDER BY created_at DESC LIMIT ?`)
      .all(limit);
    for (const row of r) rows.push({ ...row, _source: s });
  }
  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return rows.slice(0, limit);
}

function searchLearnings(query, { limit = 20 } = {}) {
  const out = [];
  const q = sanitizeFts(query);
  if (!q) return out;
  for (const { scope, db } of dbsForRead()) {
    try {
      const r = db.prepare(`
        SELECT l.id, l.title, l.rule, l.reason, l.scope, l.tags, l.created_at,
               bm25(learnings_fts) AS rank
        FROM learnings_fts
        JOIN learnings l ON l.id = learnings_fts.rowid
        WHERE learnings_fts MATCH ?
        ORDER BY rank LIMIT ?
      `).all(q, limit);
      for (const row of r) out.push({ ...row, _source: scope });
    } catch (_) { /* malformed FTS query — ignore */ }
  }
  out.sort((a, b) => a.rank - b.rank);
  return out.slice(0, limit);
}

function sanitizeFts(q) {
  const cleaned = String(q || '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!cleaned.length) return '';
  return cleaned.map(t => `${t}*`).join(' ');
}

function showLearning(id) {
  for (const { scope, db } of dbsForRead()) {
    const row = db.prepare(`SELECT * FROM learnings WHERE id = ?`).get(id);
    if (row) return { ...row, _source: scope };
  }
  return null;
}

function deleteLearning(id, scope) {
  const { db } = dbForWrite(scope || 'user');
  const info = db.prepare(`DELETE FROM learnings WHERE id = ?`).run(id);
  return info.changes;
}

function countLearnings() {
  const out = {};
  for (const { scope, db } of dbsForRead()) {
    out[scope] = db.prepare(`SELECT COUNT(*) AS n FROM learnings`).get().n;
  }
  return out;
}

function exportLearnings() {
  const rows = [];
  for (const { scope, db } of dbsForRead()) {
    const r = db.prepare(`SELECT * FROM learnings`).all();
    for (const row of r) rows.push({ ...row, _source: scope });
  }
  return rows;
}

module.exports = {
  userDbPath,
  projectDbPath,
  openDb,
  addLearning,
  listLearnings,
  searchLearnings,
  showLearning,
  deleteLearning,
  countLearnings,
  exportLearnings,
  sanitizeFts,
  isReady: () => _cachedDatabase != null || loadSqlite() != null,
};
