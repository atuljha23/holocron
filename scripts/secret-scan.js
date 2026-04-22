#!/usr/bin/env node
/**
 * PreToolUse Edit|Write|MultiEdit — regex secret scanner on file content.
 * BLOCKS on confident matches (exit 2). Advisory-only on heuristic matches.
 *
 * Keep patterns high-precision; false positives here are expensive.
 */
const { parseInput, safeRun } = require('./_hook-utils');

const CONFIDENT = [
  { name: 'AWS Access Key ID', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'AWS Secret Access Key', re: /\baws_secret_access_key\s*=\s*['"][A-Za-z0-9/+=]{40}['"]/i },
  { name: 'GitHub Token (classic)', re: /\bghp_[A-Za-z0-9]{36,}\b/ },
  { name: 'GitHub Token (fine-grained)', re: /\bgithub_pat_[A-Za-z0-9_]{80,}\b/ },
  { name: 'Slack Bot Token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Google API Key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Stripe Live Key', re: /\bsk_live_[0-9A-Za-z]{24,}\b/ },
  { name: 'OpenAI API Key', re: /\bsk-proj-[A-Za-z0-9_-]{20,}\b|\bsk-[A-Za-z0-9]{48,}\b/ },
  { name: 'Anthropic API Key', re: /\bsk-ant-[A-Za-z0-9_-]{40,}\b/ },
  { name: 'PEM Private Key', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'JWT-looking token', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
];

function contentsFrom(ti, tool) {
  if (tool === 'Write') return ti.content || '';
  if (tool === 'Edit') return (ti.new_string || '') + '\n' + (ti.old_string || '');
  if (tool === 'MultiEdit' && Array.isArray(ti.edits)) {
    return ti.edits.map(e => (e.new_string || '') + '\n' + (e.old_string || '')).join('\n');
  }
  return '';
}

safeRun(() => {
  const input = parseInput();
  const tool = input.tool_name || input.tool || '';
  if (!['Edit', 'Write', 'MultiEdit'].includes(tool)) return process.exit(0);
  const ti = input.tool_input || {};
  const body = contentsFrom(ti, tool);
  if (!body) return process.exit(0);

  const hits = [];
  for (const p of CONFIDENT) {
    if (p.re.test(body)) hits.push(p.name);
  }
  if (!hits.length) return process.exit(0);

  // Block
  process.stderr.write(
    `[holocron] Secret-scan blocked this write. Matched: ${hits.join(', ')}.\n` +
    `Replace the secret with an env var reference or remove it. ` +
    `If this is a test fixture, mark the secret clearly (e.g. "AKIAEXAMPLE...").\n`
  );
  process.exit(2);
});
