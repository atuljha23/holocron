---
description: Performance audit on the diff or a path. Delegates to @perf-engineer. Flags bundle bloat, N+1 queries, missing indexes, LCP/CLS risks.
argument-hint: [path — default: working-tree diff]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(du:*), Bash(wc:*), Agent
---

# /holocron:perf

Target: `$ARGUMENTS` — or working-tree diff if no arg.

## Gather

- `git diff --stat` to see the change size
- `git diff package.json` (if present) to detect new deps
- If the change includes migrations (`migrations/`, `alembic/`, `db/migrate/`), include them
- If the change includes query code (look for `SELECT`, query builders, ORM calls), include those files

## Delegate

Spawn `@perf-engineer` on the selected context.

## Ask for

- **Frontend** — bundle delta, likely LCP/CLS impact on changed components, render-hotspot hints.
- **Backend** — N+1 candidates, missing-index candidates, per-request allocation concerns.
- Each finding: file:line, cost estimate (low/medium/high with reason), concrete fix, how to verify the fix helped.

## Do not

- Accept generic "add caching" as the only recommendation. Push back for evidence caching helps here.
- Report "possible issue" without pointing at the specific line.
