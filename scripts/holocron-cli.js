#!/usr/bin/env node
/**
 * Holocron CLI — add, list, search, show, delete, export learnings; plus repo
 * `inventory` and `doctor` self-checks. Safe to run with or without better-sqlite3
 * installed; data commands require the dep, meta commands do not.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

function printHelp() {
  console.log(`holocron ${PKG.version} — learning crystal CLI

USAGE
  holocron <command> [args]

COMMANDS
  add          Add a learning. Flags: --title, --rule, --reason, --tags, --scope=user|project
  list         List recent learnings. Flags: --scope=user|project, --limit=N
  search <q>   Full-text search across scopes. Flags: --limit=N, --json
  show <id>    Show a single learning by id.
  delete <id>  Delete a learning. Flag: --scope=user|project (default user).
  export       Dump all learnings as JSON to stdout.
  inventory    Count agents/commands/skills/hooks/scripts in the plugin.
  doctor       Self-check the plugin install.
  help         Show this message.

EXAMPLES
  holocron add --title "no db mocks" --rule "integration tests hit a real db" --tags "testing,db"
  holocron search "flaky tests"
  holocron list --limit 10
  holocron inventory
`);
}

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out.flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) { out.flags[k] = argv[++i]; }
      else out.flags[k] = true;
    } else out._.push(a);
  }
  return out;
}

function lazyDb() {
  try { return require('./holocron-db'); }
  catch (err) {
    console.error('holocron: failed to load DB module:', err.message);
    process.exit(2);
  }
}

function cmdAdd(args) {
  const db = lazyDb();
  if (!db.isReady()) die("better-sqlite3 not installed. Run: cd " + ROOT + " && npm install");
  const { title, rule, reason, tags, scope } = args.flags;
  if (!title || !rule) die('add: --title and --rule are required');
  const res = db.addLearning({
    title: String(title),
    rule: String(rule),
    reason: reason ? String(reason) : null,
    tags: tags ? String(tags) : null,
    scope: scope === 'project' ? 'project' : 'user',
    sessionId: process.env.CLAUDE_SESSION_ID || null,
  });
  console.log(`Saved #${res.id} to ${res.scope} holocron  (${res.path})`);
}

function cmdList(args) {
  const db = lazyDb();
  if (!db.isReady()) die("better-sqlite3 not installed.");
  const limit = parseInt(args.flags.limit || '25', 10);
  const scope = args.flags.scope;
  const rows = db.listLearnings({ scope, limit });
  if (!rows.length) { console.log('(empty holocron)'); return; }
  for (const r of rows) console.log(fmtRow(r));
}

function cmdSearch(args) {
  const db = lazyDb();
  if (!db.isReady()) die("better-sqlite3 not installed.");
  const q = args._.join(' ').trim();
  if (!q) die('search: provide a query');
  const limit = parseInt(args.flags.limit || '10', 10);
  const rows = db.searchLearnings(q, { limit });
  if (args.flags.json) { console.log(JSON.stringify(rows, null, 2)); return; }
  if (!rows.length) { console.log(`(no match for "${q}")`); return; }
  for (const r of rows) console.log(fmtRow(r));
}

function cmdShow(args) {
  const db = lazyDb();
  if (!db.isReady()) die("better-sqlite3 not installed.");
  const id = parseInt(args._[0], 10);
  if (!id) die('show: provide an id');
  const row = db.showLearning(id);
  if (!row) { console.log(`(#${id} not found)`); return; }
  console.log(JSON.stringify(row, null, 2));
}

function cmdDelete(args) {
  const db = lazyDb();
  if (!db.isReady()) die("better-sqlite3 not installed.");
  const id = parseInt(args._[0], 10);
  if (!id) die('delete: provide an id');
  const changes = db.deleteLearning(id, args.flags.scope || 'user');
  console.log(changes ? `Deleted #${id}` : `(#${id} not found in ${args.flags.scope || 'user'} scope)`);
}

function cmdExport() {
  const db = lazyDb();
  if (!db.isReady()) die("better-sqlite3 not installed.");
  console.log(JSON.stringify(db.exportLearnings(), null, 2));
}

function cmdInventory() {
  const counts = {
    agents: countFiles('agents', '.md'),
    commands: countFiles('commands', '.md'),
    skills: countDirsWith('skills', 'SKILL.md'),
    hooks_events: countHookEvents(),
    hook_scripts: countFiles('scripts', '.js') - countMetaScripts(),
    contexts: countFiles('contexts', '.md'),
    rules: countFiles('rules', '.md'),
    templates: countFiles('templates', ''),
  };
  console.log(`Holocron ${PKG.version} inventory`);
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(14)} ${v}`);
  }
}

function cmdDoctor() {
  let ok = true;
  const checks = [];

  const pluginJson = path.join(ROOT, '.claude-plugin/plugin.json');
  const marketplaceJson = path.join(ROOT, '.claude-plugin/marketplace.json');
  const hooksJson = path.join(ROOT, 'hooks/hooks.json');

  for (const f of [pluginJson, marketplaceJson, hooksJson]) {
    try {
      JSON.parse(fs.readFileSync(f, 'utf8'));
      checks.push(['OK ', `${path.relative(ROOT, f)} is valid JSON`]);
    } catch (err) {
      ok = false;
      checks.push(['FAIL', `${path.relative(ROOT, f)}: ${err.message}`]);
    }
  }

  const db = lazyDb();
  if (db.isReady()) {
    try {
      const counts = db.countLearnings();
      checks.push(['OK ', `SQLite reachable. Learnings: user=${counts.user ?? 0}, project=${counts.project ?? '-'}`]);
    } catch (err) {
      ok = false;
      checks.push(['FAIL', `SQLite open: ${err.message}`]);
    }
  } else {
    checks.push(['WARN', `better-sqlite3 not installed. Run: cd ${ROOT} && npm install`]);
  }

  for (const d of ['agents', 'commands', 'skills', 'hooks', 'scripts', 'contexts', 'rules', 'templates']) {
    const exists = fs.existsSync(path.join(ROOT, d));
    checks.push([exists ? 'OK ' : 'FAIL', `${d}/ present`]);
    if (!exists) ok = false;
  }

  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  checks.push([nodeMajor >= 18 ? 'OK ' : 'WARN', `Node ${process.versions.node} (need >=18)`]);
  if (nodeMajor < 18) ok = false;

  for (const [tag, msg] of checks) console.log(`  [${tag}] ${msg}`);
  console.log(ok ? '\nHolocron is in working order.' : '\nHolocron reports problems above.');
  process.exit(ok ? 0 : 1);
}

function countFiles(dir, ext) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) return 0;
  return fs.readdirSync(p).filter(f => !ext || f.endsWith(ext)).filter(f => !f.startsWith('.')).length;
}
function countDirsWith(dir, filename) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) return 0;
  return fs.readdirSync(p, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(p, d.name, filename)))
    .length;
}
function countHookEvents() {
  try {
    const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'hooks/hooks.json'), 'utf8'));
    return Object.keys(h.hooks || {}).length;
  } catch { return 0; }
}
function countMetaScripts() {
  const meta = new Set(['holocron-db.js', 'holocron-cli.js', '_hook-utils.js']);
  const p = path.join(ROOT, 'scripts');
  if (!fs.existsSync(p)) return 0;
  return fs.readdirSync(p).filter(f => meta.has(f)).length;
}
function fmtRow(r) {
  const tags = r.tags ? ` [${r.tags}]` : '';
  return `#${r.id}  (${r._source || r.scope})  ${r.title}${tags}\n        ${r.rule}`;
}
function die(msg) { console.error('holocron:', msg); process.exit(2); }

const argv = process.argv.slice(2);
const cmd = argv[0];
const rest = parseArgs(argv.slice(1));

switch (cmd) {
  case 'add':        cmdAdd(rest); break;
  case 'list':       cmdList(rest); break;
  case 'search':     cmdSearch(rest); break;
  case 'show':       cmdShow(rest); break;
  case 'delete':     cmdDelete(rest); break;
  case 'export':     cmdExport(); break;
  case 'inventory':  cmdInventory(); break;
  case 'doctor':     cmdDoctor(); break;
  case 'help':
  case undefined:
  case '--help':
  case '-h':         printHelp(); break;
  default:           console.error(`holocron: unknown command "${cmd}"`); printHelp(); process.exit(2);
}
