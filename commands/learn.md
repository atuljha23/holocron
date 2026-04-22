---
description: Capture a correction as a durable learning in the holocron (SQLite). Survives compaction, loads on session start, matched against future prompts.
argument-hint: [--title "…"] [--rule "…"] [--reason "…"] [--tags t1,t2] [--scope user|project]
allowed-tools: Bash(node:*)
---

# /holocron:learn

Capture a rule that Claude should honor in future sessions.

## If `$ARGUMENTS` is already a full invocation

Pass it through to the CLI:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" add $ARGUMENTS
```

## Otherwise, extract fields

If the user gave prose, extract:

- **title** (short — 5–10 words — what this learning is about)
- **rule** (the imperative — "always do X" / "never do Y")
- **reason** (the "why" — usually ties to an incident, preference, or architectural constraint)
- **tags** (comma-separated — e.g. `testing,db`, `frontend,a11y`, `security`)
- **scope** (`user` by default — follows you across projects; `project` — lives in this repo's `.holocron/`)

Then run:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" add \
  --title "<title>" \
  --rule "<rule>" \
  --reason "<reason>" \
  --tags "<tags>" \
  --scope <scope>
```

## Rules for what to save

Save when the correction is **durable** — a rule that should apply to future work. Do NOT save:

- One-off debugging details
- Current-task scratch state
- Things the code already enforces

See also: `/holocron:recall <query>` to search, `/holocron:list` to browse.
