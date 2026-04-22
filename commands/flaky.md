---
description: Hunt a flaky test — diagnose non-determinism, race conditions, order dependence, timing, or environment leaks. Delegates to @qa-engineer.
argument-hint: <test name or file> [--log <path>]
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(cat:*), Agent
---

# /holocron:flaky

Target flake: `$ARGUMENTS`.

## Gather

- The test file(s) matching the target.
- Recent git blame on the test and on the code it exercises (`git log -p -- <file>` last 5 commits).
- If `--log <path>` was supplied, read the log and pull out the failure message / stack.
- The test harness config (jest/vitest/pytest/go test flags — concurrency, isolation, retries).

## Delegate

Hand off to `@qa-engineer` to walk the flake-triage tree:

1. Timing (sleeps, polling without bound, unawaited promises)
2. Order dependence (shared state, side effects from sibling tests)
3. Environment (wall-clock, tz, locale, random seed, network, ports)
4. Resource contention (temp files, databases, parallel workers)
5. External (3rd-party, flaky mock, fixture instability)

For each hypothesis, demand a concrete observation that would confirm it.

## Output

- Ranked hypotheses (most likely first)
- The probe to run for each hypothesis (a command or added log line)
- A candidate fix once the root is identified
- A guard: the assertion or test-harness setting that prevents reintroduction
