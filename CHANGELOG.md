# Changelog

All notable changes to Holocron are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

## [0.2.1] — 2026-04-22

### Fixed
- Every CLI/hook entry point now self-heals on first run, not just `SessionStart`. v0.1.1 added auto-`npm install` at session start; if the user invoked a command (e.g. `/holocron:insights`) via plugin reload before a fresh session, bootstrap never fired. `holocron-db.js#openDb` now catches the bindings error and runs bootstrap before retrying, and `holocron-cli.js#lazyDb` triggers bootstrap when `better-sqlite3` isn't installed at all. Verified end-to-end on a fresh clone with zero `node_modules`.

## [0.2.0] — 2026-04-22

### Added — Jedi Council expands
- **`@threat-modeler`** — STRIDE / LINDDUN design-level threat modeling (complements `@security-reviewer`'s SAST lens).
- **`@sre-engineer`** — Dockerfile / Kubernetes / CI review, SLO and error-budget thinking, runbook drafting.
- **`@data-engineer`** — SQL correctness and performance, dbt model patterns, pipeline idempotency, schema drift.

### Added — Commands
- **`/holocron:insights`** — correction heatmap. Top tags, 8-week additions trend, oldest-rule review candidates. Makes the crystal feel alive.
- **`/holocron:worktree`** — sets up a git worktree for a parallel Claude Code session; zero-dead-time while another feature bakes.
- **`/holocron:permission-tune`** — analyzes your `settings.json` allow/deny lists and suggests additions to reduce prompt fatigue without loosening safety (pro-workflow-inspired).
- **`/holocron:llm-gate`** — AI verdict (GO / HOLD / BLOCK) before high-stakes operations: push to main, DDL migrations, mass deletes, releases (pro-workflow-inspired).
- **`/holocron:threat-model`** — pairs with `@threat-modeler`. STRIDE pass over a diff or component.

### Added — Skills
- **`observability-checklist`** — structured logs, traces, metrics, correlation ids, per-language pointers.
- **`migration-patterns`** — expand/contract, backfill, online DDL, dual-write, shadow-read safety for live-traffic migrations.

### Fixed — Docs site (from `/holocron:review`)
- Contrast bumped on `--muted-2` to meet WCAG AA for small text (`~4.6:1`).
- Flow / ladder arrows repainted in `--kyber` + opacity so they're legible against panel bg.
- Removed the "Cursor (planned)" platform chip — nothing in the plugin metadata commits to Cursor support.
- Added explicit `:focus-visible` styling on links.
- Added `scope="row"` to `<th>` in the council and command tables.
- Added `preconnect` for Google Fonts.
- Replaced positional `.hook span:last-child` selector with a dedicated `.hook-desc` class.

### Site
- Landing page refreshed with v0.2.0 inventory (13 agents · 20 commands · 10 skills), a "What's new" ribbon, and two new role quickstart columns (SRE / Platform and Security).

## [0.1.1] — 2026-04-22

### Fixed
- First-run bootstrap: `SessionStart` now runs `npm install` in the plugin root when the native `better-sqlite3` binding is missing, so `/plugin install` works out of the box. A sentinel file prevents retry loops on failure, and clear guidance is surfaced if manual intervention is needed.

## [0.1.0] — 2026-04-22

### Added
- First public scaffold.
- 10 role/meta agents: `architect`, `frontend-engineer`, `backend-engineer`, `qa-engineer`, `a11y-auditor`, `perf-engineer`, `security-reviewer`, `debugger`, `code-reviewer`, `docs-writer`.
- 15 slash commands: `/holocron:onboard`, `plan`, `develop`, `commit`, `review`, `handoff`, `learn`, `recall`, `doctor`, `a11y`, `perf`, `test-gap`, `flaky`, `sec-scan`, `adr`.
- 8 skills: `context-engineering`, `test-patterns`, `api-design`, `a11y-checklist`, `security-checklist`, `perf-checklist`, `debug-playbook`, `pr-review-rubric`.
- 10 hook scripts wired across `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreCompact`, `Stop`.
- SQLite + FTS5 learning crystal (`scripts/holocron-db.js`, `holocron-cli.js`).
- Stack-aware `/holocron:onboard` that drafts `CLAUDE.md` from detected stack.
- Four role contexts (`frontend`, `backend`, `qa`, `polyglot`) and four rules.
- Example MCP config and permission settings.

### Credits
- Structural inspiration: [rohitg00/pro-workflow](https://github.com/rohitg00/pro-workflow) (MIT).
