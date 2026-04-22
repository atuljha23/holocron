# Polyglot / monorepo context

This repo holds multiple services and/or frontends. Optimize for:

- Respecting per-package conventions — do not export the root repo's style into a sub-package that has its own.
- Minimizing cross-package coupling — interfaces between services are contracts.
- Per-package CI signal — changes in one package shouldn't flake the test suite of another.

## Default collaborators
- `@architect` for cross-package concerns
- `@frontend-engineer` / `@backend-engineer` per affected package
- `@code-reviewer` before merge

## Default commands
- `/holocron:review` on cross-package changes
- `/holocron:adr <title>` when a decision spans packages

## Default rules
- `rules/atomic-commits.md`
- `rules/read-before-write.md`
