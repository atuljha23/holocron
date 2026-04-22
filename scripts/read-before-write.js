#!/usr/bin/env node
/**
 * PreToolUse Edit|Write|MultiEdit — track Reads in a session state file and warn
 * (never block) when a file is about to be written without having been Read.
 *
 * This complements Claude Code's own read-before-edit enforcement by logging and
 * giving the model a chance to self-correct via additionalContext.
 */
const fs = require('fs');
const path = require('path');
const { parseInput, emitContext, safeRun, loadState, saveState } = require('./_hook-utils');

safeRun(() => {
  const input = parseInput();
  const tool = input.tool_name || input.tool || '';
  const ti = input.tool_input || {};
  const sessionId = input.session_id || process.env.CLAUDE_SESSION_ID;
  const state = loadState(sessionId, 'reads', { reads: {}, writes: {} });

  if (tool === 'Read') {
    if (ti.file_path) state.reads[ti.file_path] = Date.now();
    saveState(sessionId, 'reads', state);
    return process.exit(0);
  }

  const targets = [];
  if (tool === 'Edit' || tool === 'Write') {
    if (ti.file_path) targets.push(ti.file_path);
  } else if (tool === 'MultiEdit' && Array.isArray(ti.edits)) {
    if (ti.file_path) targets.push(ti.file_path);
  }
  if (!targets.length) return process.exit(0);

  const unread = targets.filter(p => !state.reads[p] && fs.existsSync(p));
  for (const p of targets) state.writes[p] = Date.now();
  saveState(sessionId, 'reads', state);

  if (unread.length) {
    emitContext(
      `## Read-before-write (holocron)\n\n` +
      `You are about to modify files not Read in this session. Read them first:\n\n` +
      unread.map(p => `- \`${path.relative(process.cwd(), p)}\``).join('\n')
    );
  }
  process.exit(0);
});
