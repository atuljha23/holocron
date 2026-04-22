---
description: Staff-level review of the current diff (or a specified ref). Delegates to @code-reviewer, @security-reviewer, and @a11y-auditor as relevant.
argument-hint: [ref — default: working tree vs HEAD]
allowed-tools: Read, Grep, Glob, Bash(git:*), Agent
---

# /holocron:review

Target: `$ARGUMENTS` — or the working tree vs HEAD if no arg.

## Gather

- `git status`
- `git diff $ARGUMENTS` (or `git diff` for working tree)
- For large diffs, `git diff --stat` first to scope.

## Route

- Always: spawn `@code-reviewer` on the diff.
- If the diff touches `.tsx`/`.jsx`/`.vue`/`.svelte`/HTML: also spawn `@a11y-auditor`.
- If the diff touches auth, session, db queries, file I/O, shell, or crypto: also spawn `@security-reviewer`.
- If the diff touches hot paths (render loops, DB queries in loops, bundled deps): also spawn `@perf-engineer`.

Run specialists in parallel (single message, multiple Agent calls).

## Consolidate

Merge findings. Dedupe. Order by severity:

- **Blocker** — must fix before merge
- **Important** — should fix
- **Nit** — optional
- **Question** — author explains

For each, cite file:line.

## Output

Start with a 2-sentence summary of what the diff does, then the verdict (`Approve` / `Approve with nits` / `Request changes`), then the grouped findings.
