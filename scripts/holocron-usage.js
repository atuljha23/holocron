/**
 * Holocron usage — parse Claude Code transcripts, sum token usage by model,
 * price it, and aggregate session records.
 *
 * Storage: ~/.holocron/sessions/<session_id>.json  (one file per session,
 * overwritten each Stop hook). The `cost` CLI reads all session files and
 * aggregates.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Claude model pricing — $ per 1M tokens.
 * Rates as of April 2026. UPDATE when Anthropic changes pricing.
 * Fallback: sonnet-4.x rates (middle ground).
 *
 * input:       non-cached input
 * output:      output
 * cache_write: cache_creation_input_tokens (typically 125% of input)
 * cache_read:  cache_read_input_tokens     (typically 10% of input)
 */
const RATES = {
  'claude-opus-4-7':     { input: 15,  output: 75, cache_write: 18.75, cache_read: 1.5 },
  'claude-opus-4-6':     { input: 15,  output: 75, cache_write: 18.75, cache_read: 1.5 },
  'claude-opus-4-5':     { input: 15,  output: 75, cache_write: 18.75, cache_read: 1.5 },
  'claude-sonnet-4-7':   { input: 3,   output: 15, cache_write: 3.75,  cache_read: 0.3 },
  'claude-sonnet-4-6':   { input: 3,   output: 15, cache_write: 3.75,  cache_read: 0.3 },
  'claude-sonnet-4-5':   { input: 3,   output: 15, cache_write: 3.75,  cache_read: 0.3 },
  'claude-haiku-4-5':    { input: 1,   output: 5,  cache_write: 1.25,  cache_read: 0.1 },
  'claude-haiku-4-6':    { input: 1,   output: 5,  cache_write: 1.25,  cache_read: 0.1 },
};
const DEFAULT_RATE = RATES['claude-sonnet-4-6'];

function normalizeModel(model) {
  if (!model) return 'unknown';
  // Strip trailing dashes, [brackets], date suffixes like -20251001
  return String(model)
    .toLowerCase()
    .replace(/\[.*?\]/g, '')
    .replace(/-\d{6,8}$/, '')
    .trim();
}

function rateFor(model) {
  const norm = normalizeModel(model);
  if (RATES[norm]) return RATES[norm];
  // Family fallback
  if (norm.includes('opus')) return RATES['claude-opus-4-7'];
  if (norm.includes('haiku')) return RATES['claude-haiku-4-5'];
  if (norm.includes('sonnet')) return RATES['claude-sonnet-4-6'];
  return DEFAULT_RATE;
}

function costOf({ model, input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens }) {
  const r = rateFor(model);
  return (
    ((input_tokens || 0) * r.input) / 1e6 +
    ((output_tokens || 0) * r.output) / 1e6 +
    ((cache_read_input_tokens || 0) * r.cache_read) / 1e6 +
    ((cache_creation_input_tokens || 0) * r.cache_write) / 1e6
  );
}

/**
 * Parse a Claude Code transcript JSONL and return per-model usage.
 * Shape of records varies across versions; we're forgiving.
 */
function parseTranscript(transcriptPath) {
  const byModel = {};
  const empty = { turns: 0, started_at: null, ended_at: null, byModel };
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return empty;

  let started_at = null;
  let ended_at = null;
  let turns = 0;

  const raw = fs.readFileSync(transcriptPath, 'utf8');
  const lines = raw.split('\n');
  for (const line of lines) {
    if (!line) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }

    const ts = obj.timestamp || obj.ts || obj.created_at || null;
    if (ts) {
      if (!started_at) started_at = ts;
      ended_at = ts;
    }

    const msg = obj.message || obj;
    const role = msg.role || obj.role;
    const usage = msg.usage || obj.usage;
    if (role === 'assistant' && usage) {
      turns++;
      const model = normalizeModel(msg.model || obj.model || 'unknown');
      byModel[model] = byModel[model] || {
        turns: 0,
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      };
      const b = byModel[model];
      b.turns += 1;
      b.input_tokens += usage.input_tokens || 0;
      b.output_tokens += usage.output_tokens || 0;
      b.cache_read_input_tokens += usage.cache_read_input_tokens || 0;
      b.cache_creation_input_tokens += usage.cache_creation_input_tokens || 0;
    }
  }

  return { turns, started_at, ended_at, byModel };
}

function totalsOf(byModel) {
  const t = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
    cost_usd: 0,
    turns: 0,
  };
  for (const [model, b] of Object.entries(byModel)) {
    t.input_tokens += b.input_tokens;
    t.output_tokens += b.output_tokens;
    t.cache_read_input_tokens += b.cache_read_input_tokens;
    t.cache_creation_input_tokens += b.cache_creation_input_tokens;
    t.turns += b.turns;
    t.cost_usd += costOf({ model, ...b });
  }
  const cacheableIn = t.cache_read_input_tokens + t.cache_creation_input_tokens;
  t.cache_hit_rate = cacheableIn > 0 ? t.cache_read_input_tokens / cacheableIn : null;
  return t;
}

function usageDir() {
  const base = process.env.HOLOCRON_HOME || path.join(os.homedir(), '.holocron');
  const dir = path.join(base, 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function budgetPath() {
  const base = process.env.HOLOCRON_HOME || path.join(os.homedir(), '.holocron');
  fs.mkdirSync(base, { recursive: true });
  return path.join(base, 'budget.json');
}

function writeSessionRecord(session_id, cwd, parsed) {
  if (!session_id) return;
  const totals = totalsOf(parsed.byModel);
  const record = {
    session_id,
    cwd: cwd || null,
    started_at: parsed.started_at,
    ended_at: parsed.ended_at,
    turns: parsed.turns,
    byModel: parsed.byModel,
    totals,
    updated_at: new Date().toISOString(),
  };
  const p = path.join(usageDir(), `${session_id}.json`);
  fs.writeFileSync(p, JSON.stringify(record, null, 2));
  return record;
}

function readAllSessions() {
  const dir = usageDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const out = [];
  for (const f of files) {
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    } catch (_) { /* skip corrupt */ }
  }
  return out;
}

function filterSince(records, since) {
  if (!since || since === 'all') return records;
  const m = String(since).match(/^(\d+)([dwhm])$/i);
  if (!m) return records;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const ms = unit === 'h' ? 3600e3 : unit === 'd' ? 86400e3 : unit === 'w' ? 7 * 86400e3 : 30 * 86400e3;
  const cutoff = Date.now() - n * ms;
  return records.filter(r => {
    const ts = r.ended_at || r.started_at || r.updated_at;
    if (!ts) return false;
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

function readBudget() {
  try {
    const raw = fs.readFileSync(budgetPath(), 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

function writeBudget(obj) {
  fs.writeFileSync(budgetPath(), JSON.stringify(obj, null, 2));
}

module.exports = {
  RATES,
  rateFor,
  normalizeModel,
  costOf,
  parseTranscript,
  totalsOf,
  usageDir,
  budgetPath,
  writeSessionRecord,
  readAllSessions,
  filterSince,
  readBudget,
  writeBudget,
};
