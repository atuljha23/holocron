/**
 * First-run bootstrap — if the plugin was installed via /plugin install (which
 * copies source but does not run npm install), the native better-sqlite3
 * binding is missing. Self-heal on the first SessionStart by running
 * `npm install` in the plugin root.
 *
 * Guardrails:
 *   - Only runs if the binding is actually missing.
 *   - Writes a sentinel so we don't retry a failed install on every session.
 *   - Times out at 120s.
 *   - Never throws — returns a status object the caller can surface.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const BINDING = path.join(PLUGIN_ROOT, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
const SENTINEL = path.join(PLUGIN_ROOT, '.holocron-bootstrap-failed');

function bindingPresent() {
  return fs.existsSync(BINDING);
}

function previousAttemptFailed() {
  return fs.existsSync(SENTINEL);
}

function ensureDeps() {
  if (bindingPresent()) return { ok: true, ranInstall: false };
  if (previousAttemptFailed()) {
    return {
      ok: false,
      ranInstall: false,
      reason: 'previous bootstrap failed',
      hint: `cd ${PLUGIN_ROOT} && npm install  (and then delete .holocron-bootstrap-failed)`,
    };
  }
  try {
    execSync('npm install --no-audit --no-fund --loglevel=error', {
      cwd: PLUGIN_ROOT,
      stdio: 'pipe',
      timeout: 120_000,
    });
    if (bindingPresent()) return { ok: true, ranInstall: true };
    // npm ran but the binding still isn't there — treat as failure
    fs.writeFileSync(SENTINEL, `${new Date().toISOString()}\nnpm install completed but native binding missing\n`);
    return { ok: false, ranInstall: true, reason: 'native binding missing after npm install', hint: `cd ${PLUGIN_ROOT} && npm rebuild better-sqlite3` };
  } catch (err) {
    try {
      fs.writeFileSync(SENTINEL, `${new Date().toISOString()}\n${err.message}\n`);
    } catch (_) { /* noop */ }
    return {
      ok: false,
      ranInstall: true,
      reason: err.message || 'npm install failed',
      hint: `cd ${PLUGIN_ROOT} && npm install`,
    };
  }
}

module.exports = { ensureDeps, PLUGIN_ROOT };
