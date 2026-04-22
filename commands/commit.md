---
description: Quality-gated commit — runs lint/typecheck/test (if configured), reviews the staged diff, drafts a conventional-commits message, and commits.
argument-hint: [--no-verify] [--amend]
allowed-tools: Read, Grep, Glob, Bash(git:*), Bash(npm:*), Bash(pnpm:*), Bash(yarn:*), Bash(pytest:*), Bash(go:*), Bash(cargo:*)
---

# /holocron:commit

Do these in order. Do not skip.

## 1. See what's staged

```
git status
git diff --cached
```

If nothing is staged, ask which files to stage. Do not run `git add -A` or `git add .` without an explicit green light — too easy to sweep in secrets or noise.

## 2. Quality gates

Detect the stack and run what exists (skip what doesn't, don't invent scripts):

- **Node** — if `package.json` has scripts: `npm run lint`, `npm run typecheck` (or `check-types`), `npm test` (or the narrowest subset that covers changed files).
- **Python** — `ruff check .` or `flake8` if present; `pytest -q` (or `-k` the changed paths).
- **Go** — `go vet ./...`, `go test ./...`.
- **Rust** — `cargo clippy`, `cargo test`.

If any gate fails, **stop**. Do not commit. Report the failure to the user with the exact output. The user decides whether to fix or override (`--no-verify`).

## 3. Review the staged diff

Delegate a short review pass to `@code-reviewer` against the staged diff (not HEAD). If the reviewer flags a Blocker, stop and report before committing.

## 4. Draft the message

Use Conventional Commits. Match the repo's history style (check `git log --oneline -20`). Short subject (<72 chars), blank line, body only when the "why" isn't obvious from the diff.

Do not add marketing or emoji unless the repo's history uses them.

## 5. Commit

Use a HEREDOC to preserve formatting:

```
git commit -m "$(cat <<'EOF'
<type>(<scope>): <short subject>

<body: why this change, not what>
EOF
)"
```

## 6. Verify

Run `git status` and show the resulting commit with `git log -1 --stat`.

## Flags

- `--no-verify`: skip quality gates. Require the user's explicit instruction in the invocation — don't skip silently.
- `--amend`: only if explicitly requested by the user. Warn if the commit has been pushed.
