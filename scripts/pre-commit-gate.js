#!/usr/bin/env node
/**
 * PreToolUse Bash(git commit*) — warn if quality gates weren't run in this session.
 * We do NOT run tests here (too slow, too opinionated). Instead: surface which
 * gates are available in the repo (lint / typecheck / test scripts) and remind
 * the model to invoke them before committing.
 *
 * Never blocks. This is a nudge, not a wall.
 */
const fs = require('fs');
const path = require('path');
const { parseInput, emitContext, safeRun } = require('./_hook-utils');

function detectGates(cwd) {
  const gates = [];
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const scripts = pkg.scripts || {};
      for (const name of ['lint', 'typecheck', 'check-types', 'test', 'test:unit']) {
        if (scripts[name]) gates.push({ cmd: `npm run ${name}`, name });
      }
    } catch (_) {}
  }
  if (fs.existsSync(path.join(cwd, 'pyproject.toml'))) {
    if (fs.existsSync(path.join(cwd, 'ruff.toml')) ||
        fs.existsSync(path.join(cwd, '.ruff.toml'))) gates.push({ cmd: 'ruff check', name: 'ruff' });
    gates.push({ cmd: 'pytest -q', name: 'pytest' });
  }
  if (fs.existsSync(path.join(cwd, 'go.mod'))) {
    gates.push({ cmd: 'go vet ./...', name: 'go vet' });
    gates.push({ cmd: 'go test ./...', name: 'go test' });
  }
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
    gates.push({ cmd: 'cargo clippy', name: 'clippy' });
    gates.push({ cmd: 'cargo test', name: 'cargo test' });
  }
  return gates;
}

safeRun(() => {
  parseInput();
  const gates = detectGates(process.cwd());
  if (!gates.length) return process.exit(0);

  const lines = [
    '## Pre-commit gate (holocron)',
    '',
    'Quality gates detected for this repo. Run these before committing if you have not already:',
    '',
    ...gates.map(g => `- \`${g.cmd}\``),
    '',
    'If tests fail, capture the lesson via `/holocron:learn` before iterating.',
  ];
  emitContext(lines.join('\n'));
  process.exit(0);
});
