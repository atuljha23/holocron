#!/usr/bin/env node
/**
 * PostToolUse Bash — when a test-runner command exits non-zero, suggest
 * capturing the lesson via /holocron:learn. Advisory only.
 */
const { parseInput, emitContext, safeRun } = require('./_hook-utils');

const TEST_CMD = /(?:^|[\s;&|])(?:npm|pnpm|yarn)\s+(?:run\s+)?test|\bpytest\b|\bgo\s+test\b|\bcargo\s+test\b|\brspec\b|\bjest\b|\bvitest\b|\bmocha\b/;

safeRun(() => {
  const input = parseInput();
  const ti = input.tool_input || {};
  const tr = input.tool_response || input.tool_result || {};
  const cmd = ti.command || '';
  if (!TEST_CMD.test(cmd)) return process.exit(0);

  const exitCode = (tr.exit_code !== undefined) ? tr.exit_code
                 : (tr.exitCode !== undefined) ? tr.exitCode
                 : (typeof tr.output === 'string' && /FAIL|failed|Error:/i.test(tr.output) ? 1 : 0);

  if (!exitCode) return process.exit(0);

  emitContext([
    '## Test failure noticed (holocron)',
    '',
    `Command failed: \`${cmd.slice(0, 120)}\``,
    '',
    'Before iterating: if this failure exposes a durable lesson (test pattern, missing fixture,',
    'environment assumption), capture it with `/holocron:learn` so it survives compaction.',
  ].join('\n'));
  process.exit(0);
});
