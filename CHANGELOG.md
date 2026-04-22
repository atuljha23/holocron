# Changelog

All notable changes to Holocron are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

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
