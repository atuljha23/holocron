#!/usr/bin/env node
/**
 * PreCompact — write a small pre-compact snapshot (open threads, unsaved rule
 * drafts) to session state so context survives compaction. Emits a short
 * additionalContext reminder pointing at the snapshot location.
 */
const fs = require('fs');
const path = require('path');
const { parseInput, emitContext, safeRun, sessionDir } = require('./_hook-utils');

safeRun(() => {
  const input = parseInput();
  const sid = input.session_id || process.env.CLAUDE_SESSION_ID;
  const dir = sessionDir(sid);
  const snap = {
    ts: new Date().toISOString(),
    cwd: process.cwd(),
    trigger: input.trigger || 'compact',
  };
  try { fs.writeFileSync(path.join(dir, 'pre-compact.json'), JSON.stringify(snap, null, 2)); } catch (_) {}

  emitContext([
    '## Compaction imminent (holocron)',
    '',
    `Snapshot saved to \`${path.relative(process.cwd(), dir)}/pre-compact.json\`.`,
    'After compaction: use `/holocron:recall <topic>` to resurface prior learnings, and',
    '`/holocron:handoff` to emit a durable session doc if work continues.',
  ].join('\n'));
  process.exit(0);
});
