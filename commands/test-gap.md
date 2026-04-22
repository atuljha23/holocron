---
description: Find untested branches and edge cases in a file or the diff. Delegates to @qa-engineer. Returns a prioritized list of missing tests with draft names and assertions.
argument-hint: [file or path — default: working-tree diff]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Agent
---

# /holocron:test-gap

Target: `$ARGUMENTS` — or the changed files if no arg.

## Gather

- The target source file(s)
- The matching test file(s) — convention: `foo.ts` ↔ `foo.test.ts` / `foo.spec.ts` / `test_foo.py` / `foo_test.go`
- For each source file, list the public API surface (exports, classes, functions)

## Delegate

Spawn `@qa-engineer` and ask for:

- **Gaps** — branches / conditions / edge cases not currently exercised by tests. Not a line-coverage number. Name the cases.
- **Priority** — which gaps are most likely to hide a real regression.
- **Draft tests** — for each top gap, a test name and a 2-line assertion sketch.

## Output format

```
## Gap 1 — <short name>  [priority: high]
- Not tested: <the specific condition>
- Risk: <what breaks in prod>
- Draft test:
  - name: "<it should …>"
  - assert: <the check, concretely>
```

## Do not

- Do not say "add more tests" without naming the case.
- Do not propose tests that mirror the implementation (they protect nothing).
