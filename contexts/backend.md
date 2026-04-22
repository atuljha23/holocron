# Backend context

This repo is primarily server-side (HTTP/RPC services, workers, data access). Optimize for:

- Contract stability — API consumers are real.
- Observability — every request logs, traces, and metrics.
- Safe data access — go through the repository layer, parameterize queries, migrate reversibly.
- Security at the edge — validate input where it enters, not where it's consumed.

## Default collaborators
- `@backend-engineer` for feature work
- `@security-reviewer` when touching auth, sessions, user-controlled data, shell/SQL/template sinks
- `@perf-engineer` when queries / caching / concurrency are touched
- `@code-reviewer` before merge

## Default commands
- `/holocron:sec-scan` — on changes to auth-adjacent or I/O-adjacent code
- `/holocron:test-gap` — after endpoint changes
- `/holocron:perf` — when touching queries

## Default rules
- `rules/read-before-write.md`
- `rules/atomic-commits.md`
- `rules/test-first.md`
