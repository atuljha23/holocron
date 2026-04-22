# Holocron

A Claude Code plugin that gives you a Jedi council of role-specialist agents, domain commands (a11y, perf, QA, security, ADR), and a SQLite-backed learning crystal that compounds your corrections across sessions.

> A holocron, in Star Wars lore, is a crystalline cube that stores Jedi teachings. This one stores yours — every correction you make becomes durable knowledge the assistant carries into the next session.

**[atuljha23.github.io/holocron](https://atuljha23.github.io/holocron/)** · **v0.3.0** · MIT · targets SWEs, frontend engineers, backend engineers, QAs, SREs, and security.

<img width="1723" height="950" alt="Screenshot 2026-04-22 at 14 41 57" src="https://github.com/user-attachments/assets/7f2995ab-f359-4a0a-909e-9735fe45b1c9" />


---

## Why holocron

If you use Claude Code daily you already know the failure mode: you correct the assistant the same way a dozen times, every session feels like starting over, and the "plan → review" discipline rots the moment compaction hits. Holocron does three things about that:

1. **Specialist agents** — not one generic "reviewer", but ten role-flavored agents (`@frontend-engineer`, `@qa-engineer`, `@a11y-auditor`, `@security-reviewer`, `@perf-engineer`, …) each with a sharpened rubric and clear handoff boundaries.
2. **Domain commands** — a11y audits, performance checks, test-gap analysis, flaky-test hunting, security scans, ADR drafting. The stuff engineers actually reach for, as slash commands.
3. **The crystal** — a SQLite + FTS5 store of your corrections. New sessions load the top matches automatically. Compaction can't wipe them.

---

## Install (30 seconds)

```bash
# Add this repo as a marketplace and install the plugin
/plugin marketplace add atuljha23/holocron
/plugin install holocron@holocron

# One-time: install the native dependency the learning crystal needs
cd ~/.claude/plugins/marketplaces/holocron && npm install
```

Local dev against a clone:

```bash
git clone https://github.com/atuljha23/holocron ~/projects/holocron
cd ~/projects/holocron && npm install
/plugin marketplace add ~/projects/holocron
/plugin install holocron@holocron
```

Health check:

```
/holocron:doctor
```

---

## What's inside (v0.3.0)

| Component | Count | Where |
|---|---:|---|
| Role / meta agents | 14 | `agents/` |
| Slash commands | 24 | `commands/` |
| Skills | 11 | `skills/` |
| Hook scripts | 13 | `scripts/` |
| Hook events wired | 6 | `hooks/hooks.json` |
| Context profiles | 4 | `contexts/` |
| Rules | 4 | `rules/` |

Run `node scripts/holocron-cli.js inventory` anytime to verify counts match this table.

> **v0.3.0 — Token Economy.** Every Claude Code session's $ and tokens are logged to `~/.holocron/sessions/`. Run `/holocron:cost` for the rolling total, `/holocron:budget` to set caps, `/holocron:mcp-audit` to cut schema bloat, `@cost-analyst` for ranked savings proposals.

---

## Quickstart by role

### If you're a software engineer

```
/holocron:onboard            # draft a CLAUDE.md for this repo
/holocron:plan               # enter plan mode with a real scaffold
/holocron:develop <feature>  # research → plan → implement → review
/holocron:commit             # quality-gated commit with a reviewed diff
/holocron:learn "<rule>"     # capture a correction so it sticks
```

### If you're a frontend engineer

```
@frontend-engineer <task>    # role-specialist for component/UX work
/holocron:a11y               # audit changed UI files against WCAG 2.2 AA
/holocron:perf               # bundle / LCP / CLS check on the diff
/holocron:test-gap <file>    # find the component states nobody tests
```

### If you're a backend engineer

```
@backend-engineer <task>     # API / data / service work
/holocron:sec-scan           # SAST + secrets + dep advisories on the diff
/holocron:perf               # N+1 and index-gap sweep
/holocron:adr "<title>"      # record a real decision, not a Slack message
```

### If you're in QA

```
@qa-engineer <task>          # test strategy / coverage / flakes
/holocron:test-gap <file>    # prioritized list of missing tests
/holocron:flaky <test>       # walk the flake-triage tree with evidence
```

### If you're SRE / platform

```
@sre-engineer <task>         # Docker / k8s / CI / runbooks
/holocron:llm-gate "push to main"
/holocron:permission-tune    # reduce prompt fatigue with allow/deny tuning
```

### If you're security

```
@threat-modeler <feature>    # STRIDE on a proposed change
/holocron:threat-model       # design-level review
/holocron:sec-scan           # SAST + secrets + CVE on the diff
```

### If you care about cost

```
/holocron:cost --breakdown          # $ + tokens + cache hit rate
/holocron:budget --session 2 --daily 10
/holocron:mcp-audit                 # MCP token overhead
@cost-analyst                       # ranked savings from usage data
```

---

## Agents

All live under `agents/` and invoke as `@<name>`:

| Agent | Use when |
|---|---|
| `@architect` | Picking between approaches, decomposing a feature, writing an ADR |
| `@frontend-engineer` | React/Vue/Svelte/Web Components, state, forms, rendering |
| `@backend-engineer` | APIs, services, data layer, async patterns |
| `@qa-engineer` | Test strategy, coverage gaps, flakes, BDD |
| `@a11y-auditor` | WCAG 2.2 AA audits on UI components |
| `@perf-engineer` | Core Web Vitals, bundle size, N+1, index gaps |
| `@security-reviewer` | OWASP review, authn/authz, injection surfaces |
| `@threat-modeler` | STRIDE / LINDDUN design-level threat modeling |
| `@sre-engineer` | Dockerfile / k8s / CI / SLOs / runbook drafting |
| `@data-engineer` | SQL review, dbt models, pipelines, schema drift |
| `@cost-analyst` | Ranked $-saving proposals from session usage data |
| `@debugger` | Hypothesis-driven root-cause analysis |
| `@code-reviewer` | Staff-level PR review |
| `@docs-writer` | READMEs, runbooks, ADRs, API docs |

Each agent's system prompt includes a "when NOT to use me — delegate to X" section so they don't step on each other's toes.

---

## Commands

Namespaced as `/holocron:<name>`:

**Meta / workflow**: `onboard`, `plan`, `develop`, `commit`, `review`, `handoff`, `learn`, `recall`, `insights`, `worktree`, `doctor`

**Domain**: `a11y`, `perf`, `test-gap`, `flaky`, `sec-scan`, `threat-model`, `adr`

**Ops / gates**: `permission-tune`, `llm-gate`

**Token economy**: `cost`, `budget`, `mcp-audit`, `context-size`

Each command file documents its argument hints and delegates to the right agent(s).

---

## Skills

Cross-cutting knowledge, auto-loaded when relevant:

- `context-engineering` — Write / Select / Compress / Isolate
- `test-patterns` — deep assertions > spies, AAA, table-driven
- `api-design` — REST + GraphQL conventions, pagination, idempotency
- `a11y-checklist` — WCAG 2.2 AA walkthrough
- `security-checklist` — OWASP-style pre-merge sweep
- `perf-checklist` — Core Web Vitals + backend query rubric
- `debug-playbook` — hypothesis-driven triage
- `pr-review-rubric` — what a staff engineer actually looks at
- `observability-checklist` — logs / traces / metrics / correlation
- `migration-patterns` — expand / contract, backfill, online DDL
- `token-economy` — model tiering, cache hygiene, Read discipline, MCP pruning

---

## Hooks

Six events, thirteen scripts. Everything fails safe — hooks never crash the session.

| Event | What it does |
|---|---|
| `SessionStart` | Injects top-K recent learnings from the crystal as additionalContext |
| `UserPromptSubmit` | FTS-matches the prompt against learnings, injects top 3 |
| `PreToolUse` Edit\|Write | Read-before-write tracker + regex secret scanner (blocks on confident matches) |
| `PreToolUse` Read | Nudges `offset` + `limit` on files > 500 lines |
| `PreToolUse` Bash(git commit*) | Surfaces repo-detected quality gates |
| `PreToolUse` Bash(git push*) | Nudges `/holocron:handoff` if none recorded |
| `PostToolUse` Edit | Sniffs `console.log`/`debugger`/`print`/`TODO` debug residue |
| `PostToolUse` Bash(*test*) | On test failure, nudges `/holocron:learn` |
| `PostToolUse *` | Flags tool responses > ~8k tokens (context bloat) |
| `PreCompact` | Snapshots session state, advises on post-compact recall |
| `Stop` | Parses the transcript and writes a per-session $ / token record; checks budget; nudges correction capture |

---

## The learning crystal

A SQLite database with an FTS5 index. Two scopes:

- **user** — `~/.holocron/learnings.db`, follows you across all projects
- **project** — `<repo>/.holocron/learnings.db`, lives with the repo (commit or ignore per team)

Add, search, list:

```
/holocron:learn "no db mocks" --reason "mock/prod drift burned us on the Q1 migration" --tags testing,db
/holocron:recall flaky
/holocron:recall database
```

Or directly:

```
node scripts/holocron-cli.js add --title "no db mocks" --rule "integration tests hit a real db" --tags testing,db
node scripts/holocron-cli.js list --limit 20
node scripts/holocron-cli.js search "flaky"
```

Schema and triggers live in `scripts/holocron-db.js` — one file, zero build step, easy to fork.

---

## Configuration examples

- `mcp-config.example.json` — curated MCP servers (context7, playwright, github, postgres)
- `settings.example.json` — permissions allowlist/denylist tuned for holocron + sensible auto-compaction

Neither is loaded automatically — copy what you want into your own Claude Code settings.

---

## Requirements

- Claude Code (latest)
- Node ≥ 18 (the hook scripts and learning crystal are Node-based)
- `better-sqlite3` — installed via `npm install` in the plugin dir

---

## Acknowledgements

Structural inspiration: [rohitg00/pro-workflow](https://github.com/rohitg00/pro-workflow) (MIT). Holocron reimplements the persistent-learning idea from scratch (no code copied) and builds role-specialist content on top. If you want the workflow-meta focus, go check out pro-workflow — different tool for a different shape of user.

Plugin authoring reference: [Anthropic's Claude Code plugin docs](https://docs.claude.com/en/docs/claude-code/plugins).

---

## License

MIT — see `LICENSE`.

---

## Contributing

v0.1.0 is intentionally scoped. Planned for v0.2.0:

- Visual-regression / Storybook integration
- Mobile agents (React Native, Swift, Kotlin)
- Data-engineering agents (pipelines, SQL)
- Terraform / Helm / Dockerfile reviewers
- Load testing and trace inspection commands

Open an issue or PR.
