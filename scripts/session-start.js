#!/usr/bin/env node
/**
 * SessionStart — load top-K recent learnings from the holocron and inject them
 * into the session as additionalContext. Fails silently if SQLite isn't ready.
 */
const { parseInput, emitContext, safeRun, tryLoadDb } = require('./_hook-utils');

safeRun(() => {
  parseInput(); // consume stdin
  const db = tryLoadDb();
  if (!db || !db.isReady()) return process.exit(0);

  const rows = db.listLearnings({ limit: 12 });
  if (!rows.length) return process.exit(0);

  const lines = [
    '## Holocron — persistent learnings',
    '',
    'Rules you have confirmed in past sessions. Honor them unless the user overrides.',
    '',
  ];
  for (const r of rows) {
    const tags = r.tags ? ` _[${r.tags}]_` : '';
    lines.push(`- **${r.title}** (${r._source || r.scope})${tags}`);
    lines.push(`  - ${r.rule}`);
    if (r.reason) lines.push(`  - Why: ${r.reason}`);
  }
  emitContext(lines.join('\n'));
  process.exit(0);
});
