/**
 * Shared helpers for hook scripts.
 * All hook scripts should be defensive — never crash the session on a bad input.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function readStdinSync() {
  try {
    const chunks = [];
    const buf = Buffer.alloc(65536);
    const fd = 0;
    // Node may not have stdin ready synchronously on some terminals; try readFileSync fallback.
    try {
      return fs.readFileSync(fd, 'utf8');
    } catch (_) {
      let n;
      while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) chunks.push(buf.slice(0, n));
      return Buffer.concat(chunks).toString('utf8');
    }
  } catch (_) { return ''; }
}

function parseInput() {
  const raw = readStdinSync();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function emit(obj) {
  try { process.stdout.write(JSON.stringify(obj)); }
  catch (_) { /* noop */ }
}

function emitContext(additionalContext) {
  emit({ hookSpecificOutput: { additionalContext } });
}

function holocronDir() {
  const base = process.env.HOLOCRON_HOME || path.join(os.homedir(), '.holocron');
  fs.mkdirSync(base, { recursive: true });
  return base;
}

function sessionDir(sessionId) {
  const id = sessionId || process.env.CLAUDE_SESSION_ID || 'unknown-session';
  const dir = path.join(holocronDir(), 'sessions', id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadState(sessionId, name, fallback = {}) {
  const p = path.join(sessionDir(sessionId), `${name}.json`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
}

function saveState(sessionId, name, data) {
  const p = path.join(sessionDir(sessionId), `${name}.json`);
  try { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
  catch (_) { /* noop */ }
}

function safeRun(fn) {
  try { fn(); }
  catch (err) {
    // Never fail the session on a hook bug. Emit a diagnostic to stderr (non-blocking).
    try { process.stderr.write(`[holocron hook] ${err.message}\n`); } catch (_) {}
    process.exit(0);
  }
}

function tryLoadDb() {
  try { return require('./holocron-db'); } catch { return null; }
}

module.exports = {
  parseInput,
  emit,
  emitContext,
  holocronDir,
  sessionDir,
  loadState,
  saveState,
  safeRun,
  tryLoadDb,
};
