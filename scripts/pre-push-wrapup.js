#!/usr/bin/env node
/**
 * PreToolUse Bash(git push*) — suggest /holocron:wrap-up if no handoff doc was
 * generated this session. Advisory only, never blocks.
 */
const fs = require('fs');
const path = require('path');
const { parseInput, emitContext, safeRun, sessionDir } = require('./_hook-utils');

safeRun(() => {
  parseInput();
  const flag = path.join(sessionDir(), 'handoff-done.flag');
  if (fs.existsSync(flag)) return process.exit(0);

  emitContext([
    '## Pre-push reminder (holocron)',
    '',
    'No session handoff recorded yet. Consider running `/holocron:handoff` to',
    'capture open threads and `/holocron:learn` to persist any corrections before pushing.',
  ].join('\n'));
  process.exit(0);
});
