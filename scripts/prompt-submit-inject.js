#!/usr/bin/env node
/**
 * UserPromptSubmit — match the user's prompt against learnings via FTS5 and
 * inject up to 3 relevant matches as additionalContext.
 */
const { parseInput, emitContext, safeRun, tryLoadDb } = require('./_hook-utils');

safeRun(() => {
  const input = parseInput();
  const prompt = (input && input.prompt) || '';
  if (!prompt || prompt.length < 6) return process.exit(0);

  const db = tryLoadDb();
  if (!db || !db.isReady()) return process.exit(0);

  const rows = db.searchLearnings(prompt, { limit: 3 });
  if (!rows.length) return process.exit(0);

  const lines = ['## Relevant holocron learnings', ''];
  for (const r of rows) {
    lines.push(`- **${r.title}** — ${r.rule}`);
    if (r.reason) lines.push(`  - Why: ${r.reason}`);
  }
  emitContext(lines.join('\n'));
  process.exit(0);
});
