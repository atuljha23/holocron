#!/usr/bin/env node
/**
 * PostToolUse — if a tool returned an unusually large payload, nudge the
 * caller toward a narrower query next time. The payload is already in the
 * transcript; this is advisory for the *next* invocation.
 */

const { parseInput, emitContext, safeRun } = require('./_hook-utils');

const TOKEN_THRESHOLD = 8000;           // ~32KB at 4 chars/token
const CHAR_PER_TOKEN = 4;               // rough English estimate

function approxTokens(text) {
  return Math.ceil(String(text || '').length / CHAR_PER_TOKEN);
}

safeRun(() => {
  const input = parseInput();
  const tool = input.tool_name || input.tool || '';
  const tr = input.tool_response || input.tool_result || null;
  if (!tool || tr == null) return process.exit(0);

  let text;
  if (typeof tr === 'string') text = tr;
  else if (tr.output) text = String(tr.output);
  else if (tr.content) text = JSON.stringify(tr.content);
  else text = JSON.stringify(tr);

  const n = approxTokens(text);
  if (n < TOKEN_THRESHOLD) return process.exit(0);

  emitContext([
    `## Tool output is big (holocron)`,
    ``,
    `\`${tool}\` returned ~${n.toLocaleString()} tokens.`,
    `Big outputs stay in the transcript and inflate every subsequent turn's cost.`,
    `Next time: narrow the query (filter, grep first, limit rows, specific file paths).`,
  ].join('\n'));
  process.exit(0);
});
