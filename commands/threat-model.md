---
description: STRIDE-driven threat model of a diff, component, or proposed feature. Delegates to @threat-modeler. Produces an actionable threat list with mitigations — different from /holocron:sec-scan (line-level SAST) in that it works at the design level.
argument-hint: [scope — file, directory, or "diff" for working tree]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Agent
---

# /holocron:threat-model

Scope: `$ARGUMENTS` — or the working-tree diff if empty.

## Gather

- If scope is a file/dir: read it + the files it calls/imports from (one hop).
- If scope is "diff" or empty: `git diff --stat` then `git diff` to see what changed.
- Identify trust boundaries crossed — user ↔ app, app ↔ datastore, tenant ↔ tenant, internal ↔ external.
- Identify assets at stake — credentials, PII, customer data, billing, IP.

## Delegate

Spawn `@threat-modeler` with the gathered context. Ask for a **STRIDE** pass (Spoofing / Tampering / Repudiation / Information disclosure / Denial of service / Elevation of privilege).

For systems with heavy PII, overlay a **LINDDUN** pass (Linkability, Identifiability, Non-repudiation, Detectability, Disclosure, Unawareness, Non-compliance).

## Output

Severity-scored threat list. Each threat:

- Category
- Entry point (where the attacker touches the system)
- Scenario (2-3 sentences)
- Impact × Likelihood (H/M/L each)
- Mitigation (specific, file:line where possible)
- Residual risk after mitigation

## Do not

- Do not confuse with `/holocron:sec-scan` — that's SAST for line-level bugs; this is design-level.
- Do not produce academic threat lists — rank by exploitability, cut the noise.
- Do not recommend "user education" as a mitigation.
