---
description: Enter plan mode with a structured plan scaffold (goal, success criteria, risks, files to touch, rollback). Use before any non-trivial implementation.
argument-hint: [task description]
allowed-tools: Read, Grep, Glob, EnterPlanMode
---

# /holocron:plan

Enter plan mode immediately. Do not start implementing. Use the scaffold below to organize your exploration and drafted plan.

If the user provided a task in `$ARGUMENTS`, treat that as the objective. Otherwise, ask what they want to accomplish.

## Plan scaffold to fill in

```
## Context
<one paragraph: what problem this solves, what the trigger was, what outcome defines success>

## Success criteria
- [ ] <concrete, testable criterion 1>
- [ ] <concrete, testable criterion 2>
- [ ] ...

## Out of scope
- <explicit non-goals>

## Approach
<2-3 sentences: the chosen shape. If there are alternative shapes worth naming, do so and say why this one wins.>

## Files to touch
- <path>:<short note>
- ...

## Risks
- <risk>: <mitigation>

## Verification
- <how we confirm this works end-to-end; ideally a test or a command to run>

## Rollback
<how we undo this if it breaks production, if applicable>
```

## Rules

- Read before planning. Cite specific files and functions you'll touch.
- Name tradeoffs explicitly. If you're uncertain between two shapes, ask via AskUserQuestion.
- Keep the plan short enough to scan, detailed enough to execute.
- When ready, call `ExitPlanMode` to present it for approval.
