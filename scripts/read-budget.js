#!/usr/bin/env node
/**
 * PreToolUse Read — if the target file is large and the caller isn't already
 * using offset+limit, suggest a targeted range to keep the context window
 * and subsequent turn costs under control.
 */

const fs = require('fs');
const path = require('path');
const { parseInput, emitContext, safeRun } = require('./_hook-utils');

const LINE_THRESHOLD = 500;

safeRun(() => {
  const input = parseInput();
  const tool = input.tool_name || input.tool || '';
  if (tool !== 'Read') return process.exit(0);
  const ti = input.tool_input || {};
  if (ti.offset || ti.limit) return process.exit(0);
  const file = ti.file_path;
  if (!file || !fs.existsSync(file)) return process.exit(0);

  let stat;
  try { stat = fs.statSync(file); } catch { return process.exit(0); }
  if (!stat.isFile()) return process.exit(0);

  // Cheap line count — avoid loading huge binaries into memory.
  if (stat.size > 8 * 1024 * 1024) {
    emitContext([
      `## Big file read (holocron)`,
      ``,
      `\`${path.relative(process.cwd(), file)}\` is ${(stat.size / 1024 / 1024).toFixed(1)} MB.`,
      `Consider \`Read\` with \`offset\`+\`limit\`, or \`Grep\` to locate lines first.`,
    ].join('\n'));
    return process.exit(0);
  }

  let lineCount = 0;
  try {
    const buf = fs.readFileSync(file);
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0x0a) lineCount++;
    }
  } catch { return process.exit(0); }

  if (lineCount < LINE_THRESHOLD) return process.exit(0);

  emitContext([
    `## Read budget (holocron)`,
    ``,
    `\`${path.relative(process.cwd(), file)}\` is ${lineCount.toLocaleString()} lines.`,
    `Consider \`Read\` with \`offset\` + \`limit\` to target what you need — full reads of large files bloat the transcript and hurt cache hits on later turns.`,
    `Tip: use \`Grep\` to find the range first, then \`Read\` that range.`,
  ].join('\n'));
  process.exit(0);
});
