# QA context

This repo is test-infrastructure heavy (or you're a QA working across multiple repos). Optimize for:

- Tests that assert behavior, not implementation.
- Deterministic suites — flakes are bugs, not noise.
- Readable specs — a new teammate understands intent without reading the code under test.
- Coverage gaps expressed as cases, not percentages.

## Default collaborators
- `@qa-engineer` for test strategy, coverage, and flakes
- `@debugger` when a test exposes a real bug
- `@code-reviewer` before merge

## Default commands
- `/holocron:test-gap` — after any non-trivial change
- `/holocron:flaky <test>` — when a suite is unstable

## Default rules
- `rules/test-first.md`
- `rules/read-before-write.md`
