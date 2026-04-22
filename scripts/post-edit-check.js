#!/usr/bin/env node
/**
 * PostToolUse Edit|Write|MultiEdit — sniff for debug residue left in source:
 * console.log / debugger / print / pdb / binding.pry / TODO markers without owner.
 * Advisory only.
 */
const fs = require('fs');
const path = require('path');
const { parseInput, emitContext, safeRun } = require('./_hook-utils');

const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|rb|java|kt|swift|php)$/i;

const SNIFFERS = [
  { name: 'console.log', re: /\bconsole\.(log|debug|trace)\b/g, ext: /\.(ts|tsx|js|jsx|mjs|cjs)$/i },
  { name: 'debugger', re: /\bdebugger\s*;?\b/g, ext: /\.(ts|tsx|js|jsx|mjs|cjs)$/i },
  { name: 'print()', re: /^\s*print\s*\(/gm, ext: /\.py$/i },
  { name: 'pdb.set_trace', re: /pdb\.set_trace\(\)|breakpoint\(\)/g, ext: /\.py$/i },
  { name: 'fmt.Println', re: /\bfmt\.Print(?:ln|f)\b/g, ext: /\.go$/i },
  { name: 'dbg!', re: /\bdbg!\s*\(/g, ext: /\.rs$/i },
  { name: 'binding.pry', re: /\bbinding\.pry\b/g, ext: /\.rb$/i },
  { name: 'TODO/FIXME', re: /\b(TODO|FIXME|XXX|HACK)\b(?!\s*\([a-z0-9._-]+\))/gi, ext: SOURCE_EXT },
];

safeRun(() => {
  const input = parseInput();
  const ti = input.tool_input || {};
  const file = ti.file_path;
  if (!file || !SOURCE_EXT.test(file)) return process.exit(0);
  if (!fs.existsSync(file)) return process.exit(0);

  let body;
  try { body = fs.readFileSync(file, 'utf8'); }
  catch { return process.exit(0); }

  const findings = [];
  for (const s of SNIFFERS) {
    if (!s.ext.test(file)) continue;
    const m = body.match(s.re);
    if (m && m.length) findings.push(`${s.name} (${m.length})`);
  }
  if (!findings.length) return process.exit(0);

  emitContext(
    `## Post-edit sniffer (holocron) — ${path.relative(process.cwd(), file)}\n\n` +
    `Debug residue detected:\n\n` +
    findings.map(f => `- ${f}`).join('\n') +
    `\n\nRemove before committing, or mark intentional (e.g. \`// keep: prod log\`).`
  );
  process.exit(0);
});
