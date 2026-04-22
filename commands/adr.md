---
description: Draft an Architectural Decision Record (ADR) for a proposed or accepted decision. Uses the MADR-style template and places it in docs/adr/ or adrs/ (whichever the repo uses).
argument-hint: <short title>
allowed-tools: Read, Write, Grep, Glob, Bash(ls:*), Bash(date:*)
---

# /holocron:adr

Title: `$ARGUMENTS`

## Locate the ADR directory

Check in this order and use the first one that exists:

- `docs/adr/`
- `docs/adrs/`
- `adrs/`
- `adr/`
- `docs/decisions/`

If none exists, default to `docs/adr/` and create it.

## Determine the next number

Look at existing `NNNN-*.md` files and pick next. If none, use `0001`.

## Write the ADR

File: `<adr-dir>/<NNNN>-<slug>.md` (slug = lowercased title, hyphens, no punctuation).

Template (MADR-inspired):

```markdown
# <Title>

- **Status**: Proposed
- **Date**: <YYYY-MM-DD>
- **Deciders**: <who>
- **Supersedes**: —  |  **Superseded by**: —

## Context and problem statement

<what forces are at play; why a decision is needed now>

## Decision drivers

- <driver 1>
- <driver 2>

## Considered options

1. **<option A>** — sketch
2. **<option B>** — sketch
3. **<option C>** — sketch

## Decision outcome

Chosen option: **<option X>**, because <reason>.

### Positive consequences
- <what becomes easier>

### Negative consequences
- <what becomes harder / what we defer>

## Validation
<how we will know this was the right call — a measurable outcome or a review trigger>
```

Delegate the prose drafting to `@architect` (who holds the tradeoff discipline) and optionally polish with `@docs-writer`.

After writing, print the file path and the TL;DR.
