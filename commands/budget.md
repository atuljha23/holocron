---
description: Set or inspect token $ budgets. Per-session, daily, and monthly caps. The Stop hook reads these and nudges you when you cross 80% / 100%.
argument-hint: [--session N] [--daily N] [--monthly N] [--clear]
allowed-tools: Bash(node:*)
---

# /holocron:budget

Set a budget and get nudged when you're approaching it.

## Examples

```bash
# Set per-session cap at $2 and daily cap at $10
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" budget --session 2.00 --daily 10.00

# Just see the current budget
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" budget

# Clear all budgets
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" budget --clear
```

With `$ARGUMENTS` provided, pass them through:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" budget $ARGUMENTS
```

## How it fires

Budget lives at `~/.holocron/budget.json`. On each `Stop` event, the usage logger checks your current session vs. the cap, and today's aggregate vs. the daily cap. If you're past 80% session or 100% daily, you get an advisory `additionalContext` message — never blocking.

## Sensible starting values

- **Per-session**: $1.00–$3.00 for routine dev; higher for exploratory research.
- **Daily**: $5.00–$20.00 for a working day of Claude Code usage.
- **Monthly**: use only if you're billing to a budget owner.
