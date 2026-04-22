---
description: Security scan on the diff — SAST heuristics, secret regex sweep, dependency advisory check. Delegates to @security-reviewer.
argument-hint: [ref — default: working-tree diff]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(npm:*), Bash(pip-audit:*), Bash(bundle:*), Bash(cargo:*), Agent
---

# /holocron:sec-scan

Target: `$ARGUMENTS` — or working-tree diff if no arg.

## 1. Secret sweep

Run the regex gauntlet across the diff:

```
git diff $ARGUMENTS | grep -E 'AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|xox[baprs]-|AIza[0-9A-Za-z_-]{35}|sk_live_|sk-ant-|-----BEGIN .*PRIVATE KEY-----'
```

If anything matches, stop and report. Do **not** echo the matched secret in your output — redact.

## 2. Dependency advisories

Detect ecosystem and run the native auditor. Skip if the tool isn't installed.

- Node: `npm audit --audit-level=high` (or pnpm/yarn equivalent)
- Python: `pip-audit` if present
- Ruby: `bundler-audit check --update` if present
- Rust: `cargo audit` if present
- Go: `govulncheck ./...` if present

Summarize high/critical advisories. Ignore dev-only nuisance advisories unless severe.

## 3. SAST pass

Delegate to `@security-reviewer` with the diff and ask for:

- Authn/authz gaps
- Injection surfaces (SQL, shell, template, path, deserializer)
- Session / cookie attribute issues
- Unsafe crypto (MD5/SHA1 for security, ECB mode, custom crypto)
- Over-returning in response objects

## Output

Severity-ordered findings (Critical / High / Medium / Low), each with file:line, impact, trigger, fix. Redact any actual secrets found.
