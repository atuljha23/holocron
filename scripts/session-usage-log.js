#!/usr/bin/env node
/**
 * Stop — after each turn, parse the session's transcript and write a running
 * usage record to ~/.holocron/sessions/<session_id>.json. Idempotent (overwrite).
 *
 * Also: if a budget is configured and we're past a threshold, emit an
 * additionalContext nudge.
 */

const fs = require('fs');
const path = require('path');
const { parseInput, emitContext, safeRun } = require('./_hook-utils');
const usage = require('./holocron-usage');

safeRun(() => {
  const input = parseInput();
  const sid = input.session_id || process.env.CLAUDE_SESSION_ID;
  const transcript = input.transcript_path || input.transcript || null;
  if (!sid || !transcript) return process.exit(0);

  const parsed = usage.parseTranscript(transcript);
  const record = usage.writeSessionRecord(sid, input.cwd || process.cwd(), parsed);
  if (!record) return process.exit(0);

  // Budget check
  const budget = usage.readBudget();
  if (!budget) return process.exit(0);

  const sessionCost = record.totals.cost_usd;
  const lines = [];

  if (budget.session_usd && sessionCost >= budget.session_usd) {
    lines.push(
      `## Budget exceeded (holocron)`,
      ``,
      `This session is at $${sessionCost.toFixed(2)} of your $${budget.session_usd.toFixed(2)} per-session budget.`,
      `Consider wrapping up, running \`/holocron:handoff\`, or inspecting \`/holocron:cost\`.`,
    );
  } else if (budget.session_usd && sessionCost >= 0.8 * budget.session_usd) {
    lines.push(
      `## Budget ~80% (holocron)`,
      ``,
      `Session cost: $${sessionCost.toFixed(2)} of $${budget.session_usd.toFixed(2)}.`,
      `Cache hit rate: ${record.totals.cache_hit_rate != null ? (record.totals.cache_hit_rate * 100).toFixed(0) + '%' : 'n/a'}.`,
    );
  }

  if (budget.daily_usd) {
    // Sum cost for today across sessions
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = usage.readAllSessions().filter(r => {
      const t = (r.ended_at || r.updated_at || '').slice(0, 10);
      return t === today;
    });
    const todayCost = todayRecords.reduce((s, r) => s + (r.totals?.cost_usd || 0), 0);
    if (todayCost >= budget.daily_usd) {
      lines.push(
        `## Daily budget exceeded (holocron)`,
        ``,
        `Today: $${todayCost.toFixed(2)} / $${budget.daily_usd.toFixed(2)} budget.`,
      );
    }
  }

  if (lines.length) emitContext(lines.join('\n'));
  process.exit(0);
});
