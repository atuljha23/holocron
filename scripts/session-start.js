#!/usr/bin/env node
/**
 * SessionStart — on first run after /plugin install, self-heal by running
 * npm install in the plugin root. Then load top-K recent learnings from the
 * holocron and inject them as additionalContext.
 */
const { parseInput, emitContext, safeRun, tryLoadDb } = require('./_hook-utils');
const { ensureDeps, PLUGIN_ROOT } = require('./_bootstrap');

safeRun(() => {
  parseInput(); // consume stdin

  const boot = ensureDeps();
  if (!boot.ok) {
    // Surface a clear, actionable message — but do not block the session.
    emitContext([
      '## Holocron bootstrap (action needed)',
      '',
      `The learning crystal is unavailable: ${boot.reason}.`,
      `Fix: \`${boot.hint}\`.`,
    ].join('\n'));
    return process.exit(0);
  }

  // Clear memoized require cache for holocron-db in case we just installed the dep.
  if (boot.ranInstall) {
    try { delete require.cache[require.resolve('./holocron-db')]; } catch (_) {}
  }

  const db = tryLoadDb();
  if (!db || !db.isReady()) return process.exit(0);

  const rows = db.listLearnings({ limit: 12 });

  const lines = [];
  if (boot.ranInstall) {
    lines.push('## Holocron', '', `_First run: dependencies installed in \`${PLUGIN_ROOT}\`._`, '');
  }
  if (rows.length) {
    lines.push(
      '## Holocron — persistent learnings',
      '',
      'Rules you have confirmed in past sessions. Honor them unless the user overrides.',
      '',
    );
    for (const r of rows) {
      const tags = r.tags ? ` _[${r.tags}]_` : '';
      lines.push(`- **${r.title}** (${r._source || r.scope})${tags}`);
      lines.push(`  - ${r.rule}`);
      if (r.reason) lines.push(`  - Why: ${r.reason}`);
    }
  }

  if (lines.length) emitContext(lines.join('\n'));
  process.exit(0);
});
