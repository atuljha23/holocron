---
description: Session + rolling $ and token usage across all Claude Code sessions — totals, per-model breakdown, cache hit rate, budget status. Data comes from the Stop hook that logs every session.
argument-hint: [--since 7d|30d|all] [--by-session] [--breakdown]
allowed-tools: Bash(node:*)
---

# /holocron:cost

Show how many tokens you've spent and what it cost.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" cost $ARGUMENTS
```

## What you'll see

- **Total cost** in $ — summed across all logged sessions in the window
- **Turns, input/output tokens, cache read/write**
- **Cache hit rate** — the big one. Above ~70% is healthy. Below 50% means something is busting Anthropic's 5-min prompt cache; usually a volatile value (timestamp, random id) in CLAUDE.md or injected context.
- **Per-model breakdown** — where the money goes (`--breakdown` or automatic if multiple models were used)
- **Top-10 sessions by cost** (with `--by-session`)
- **Budget status** if configured (set via `/holocron:budget`)

## Defaults

- `--since 30d` — last 30 days. Use `7d`, `all`, or a custom window like `3d`.
- Data directory: `~/.holocron/sessions/`. If empty, the Stop hook hasn't fired yet — run a Claude Code session, end it, and try again.

## Pricing

Rates are hardcoded for Opus/Sonnet/Haiku 4.x (input, output, cache-write at 125% of input, cache-read at 10% of input). Update `scripts/holocron-usage.js` when Anthropic changes pricing.
