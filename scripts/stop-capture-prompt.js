#!/usr/bin/env node
/**
 * Stop — if the transcript looks like the user corrected Claude in this turn
 * without the correction being captured, nudge toward /holocron:learn.
 *
 * Cheap heuristic: count "correction markers" in user messages this session vs
 * learnings added this session.
 */
const fs = require('fs');
const path = require('path');
const { parseInput, emit, safeRun, sessionDir, loadState, saveState } = require('./_hook-utils');

const MARKERS = [
  /\bdon'?t\b/i, /\bstop\b/i, /\bno+,?\s/i, /\bnever\b/i, /\balways\b/i,
  /\binstead\b/i, /\bwrong\b/i, /\bnot (?:like )?that\b/i,
];

safeRun(() => {
  const input = parseInput();
  const sid = input.session_id || process.env.CLAUDE_SESSION_ID;
  const transcript = input.transcript || input.last_user_message || '';
  if (!transcript || typeof transcript !== 'string') return process.exit(0);

  const hits = MARKERS.reduce((n, re) => n + (re.test(transcript) ? 1 : 0), 0);
  if (hits < 2) return process.exit(0);

  const state = loadState(sid, 'stop-counter', { nudges: 0 });
  if (state.nudges >= 2) return process.exit(0); // don't nag
  state.nudges += 1;
  saveState(sid, 'stop-counter', state);

  emit({
    hookSpecificOutput: {
      additionalContext: [
        '## Correction detected (holocron)',
        '',
        'Your last message looks like a correction. If this is a durable rule',
        '(not just a one-off), capture it now:',
        '',
        '`/holocron:learn "<short rule>" --reason "<why>" --tags <scope>`',
      ].join('\n'),
    },
  });
  process.exit(0);
});
