/**
 * First-run bootstrap — if the plugin was installed via /plugin install (which
 * copies source but does not run npm install), the native better-sqlite3
 * binding is missing. Self-heal by running `npm install`, and escalate to
 * `npm rebuild` and finally a clean reinstall if the binding still doesn't
 * drop into place (prebuild-install is flaky).
 *
 * Guardrails:
 *   - Only runs if the binding is actually missing.
 *   - Writes a sentinel ONLY if all escalation steps fail, so subsequent
 *     invocations don't silently retry a broken setup on every call.
 *   - Each step is bounded by a timeout.
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

function run(cmd, { timeout = 180_000 } = {}) {
  return execSync(cmd, {
    cwd: PLUGIN_ROOT,
    stdio: 'pipe',
    timeout,
  });
}

function tryStep(label, fn) {
  try {
    fn();
    return { ok: bindingPresent(), label };
  } catch (err) {
    return { ok: false, label, error: err.message || String(err) };
  }
}

function ensureDeps() {
  if (bindingPresent()) return { ok: true, ranInstall: false };

  if (previousAttemptFailed()) {
    return {
      ok: false,
      ranInstall: false,
      reason: 'previous bootstrap failed',
      hint: `cd ${PLUGIN_ROOT} && rm -rf node_modules && npm install  (and delete .holocron-bootstrap-failed)`,
    };
  }

  const attempts = [];

  // Step 1: plain npm install (cheapest; works 95% of the time).
  attempts.push(tryStep('npm install', () => {
    run('npm install --no-audit --no-fund --loglevel=error');
  }));
  if (bindingPresent()) return { ok: true, ranInstall: true, attempts };

  // Step 2: npm rebuild better-sqlite3 (prebuild-install sometimes silently skips).
  attempts.push(tryStep('npm rebuild better-sqlite3', () => {
    run('npm rebuild better-sqlite3 --no-audit --no-fund --loglevel=error');
  }));
  if (bindingPresent()) return { ok: true, ranInstall: true, attempts };

  // Step 3: force compile from source.
  attempts.push(tryStep('npm rebuild --build-from-source', () => {
    run('npm rebuild better-sqlite3 --build-from-source --no-audit --no-fund --loglevel=error');
  }));
  if (bindingPresent()) return { ok: true, ranInstall: true, attempts };

  // Step 4: nuclear — clean reinstall.
  attempts.push(tryStep('rm -rf node_modules && npm install', () => {
    run('rm -rf node_modules package-lock.json && npm install --no-audit --no-fund --loglevel=error');
  }));
  if (bindingPresent()) return { ok: true, ranInstall: true, attempts };

  // All escalations failed — record the sentinel so we don't loop.
  try {
    fs.writeFileSync(
      SENTINEL,
      `${new Date().toISOString()}\n` +
      attempts.map(a => `[${a.ok ? 'ok' : 'FAIL'}] ${a.label}${a.error ? ' — ' + a.error : ''}`).join('\n') + '\n'
    );
  } catch (_) { /* noop */ }

  return {
    ok: false,
    ranInstall: true,
    attempts,
    reason: 'all bootstrap steps ran but the native binding never appeared',
    hint: `cd ${PLUGIN_ROOT} && rm -rf node_modules && npm install  (then delete .holocron-bootstrap-failed)`,
  };
}

module.exports = { ensureDeps, PLUGIN_ROOT };
