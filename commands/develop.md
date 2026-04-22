---
description: Multi-phase feature development — Research → Plan → Implement → Review. Delegates research/review to specialist agents; you drive the implementation.
argument-hint: <feature description>
allowed-tools: Read, Edit, Grep, Glob, Bash, Agent, EnterPlanMode
---

# /holocron:develop

Feature: **$ARGUMENTS**

Run this in four explicit phases. Do not skip ahead.

## Phase 1 — Research (delegate)

Spawn `@architect` (or `@frontend-engineer` / `@backend-engineer` depending on the feature) via the Agent tool to:

- Read adjacent code and summarize conventions.
- Identify reusable primitives already in the repo.
- List relevant constraints (data contracts, consumers, SLAs).

Cap the research report at ~300 words. Bring back file paths, not just prose.

## Phase 2 — Plan (you)

With research in hand, enter plan mode (`/holocron:plan`-style scaffold). Present options if they exist. Get approval before writing code.

## Phase 3 — Implement (you)

- Match conventions found in Phase 1.
- Minimum viable change. No speculative abstractions.
- Write a test first where the contract is clear; write the code, then the test when exploratory.
- Commit in atomic chunks — one logical change per commit.

## Phase 4 — Review (delegate)

Spawn `@code-reviewer` on the diff. Surface blockers before handing back to the user. If the change is UI, also spawn `@a11y-auditor`. If server-side and non-trivial, `@security-reviewer`.

## Exit

End with: summary of what was built, files changed, tests added, and the commands the user can run to verify.
