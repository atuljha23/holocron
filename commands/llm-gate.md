---
description: AI-powered verification gate before a destructive or high-stakes operation. Use before git push to main, production deploys, DDL migrations, or mass deletes. Reads the proposed action in context and returns a go / hold decision with reasons.
argument-hint: <operation description> [--context <file>]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(git status:*)
---

# /holocron:llm-gate

Ask: is this about to do what I think it's about to do?

## When to invoke

- Before `git push` to `main` / `master` / a release branch.
- Before running a production migration.
- Before a mass delete (`rm -rf`, `DELETE FROM`, `kubectl delete`).
- Before publishing a release (`npm publish`, `gh release create`).
- Before a config change that crosses environments (rotating a secret, flipping a feature flag for all tenants).

## Proposed operation

**$ARGUMENTS**

## Checklist the gate walks

Before returning a verdict, satisfy these:

1. **Intent clear.** State in one sentence what you believe will happen.
2. **Diff surveyed.** If it's a code change, `git diff --stat` and `git diff` on the relevant range. If it's a DDL, inspect the migration file.
3. **Blast radius.** Who/what is affected? One tenant or all? One service or the whole cluster? One row or a table?
4. **Reversibility.** Can this be undone in < 5 minutes? < 1 hour? Not at all?
5. **Preconditions.** Has the quality gate run (tests, lint, typecheck, staging verification)? Is on-call available?
6. **Suspicious patterns.** Force-push to a protected branch, secrets in the diff, migration without a `DOWN`, delete without a `WHERE`.

## Verdict

```
## Gate verdict: GO  |  HOLD  |  BLOCK

### Intent
<one-sentence read of what's about to happen>

### Blast radius
<scope>

### Reversibility
<minutes / hours / not>

### Concerns
- <item>  (severity: low/medium/high)
- <item>
- ...

### Required before GO (if HOLD)
- <action>
- <action>

### Why BLOCK (if BLOCK)
<one or two sentences — specific, actionable>
```

## Do not

- Do not approve your own work without reading the diff.
- Do not rubber-stamp with "LGTM" — produce concerns, even minor ones, so the user sees them.
- Do not block on cosmetic issues. BLOCK is for "this will break prod".
