---
description: Write a session handoff document summarizing what was done, what's open, and what the next session should pick up. Saves to .holocron/handoff-YYYY-MM-DD.md.
allowed-tools: Read, Write, Bash(git:*), Bash(date:*), Bash(mkdir:*)
---

# /holocron:handoff

Produce a handoff doc so the next session (you-in-30-minutes, or a teammate) can pick up without archaeology.

## Gather

- `git status` and `git diff --stat` (uncommitted work)
- `git log --oneline -20` (what was committed this session)
- Open threads from the conversation: unresolved questions, deferred work, things you decided not to do and why

## Write

Path: `.holocron/handoff-<YYYY-MM-DD>-<short-slug>.md` (create the `.holocron` dir if missing).

Template:

```markdown
# Handoff — <YYYY-MM-DD> <short title>

## What was done
- <bulleted list, one line each, with commit SHAs where applicable>

## What's in flight
- <file>:<what's partial>

## What's open (pick up next)
- <item>: <why it's open, first step to unblock>

## Decisions made
- <decision>: <reason>

## Non-decisions (deferred)
- <thing>: <why we didn't touch it>

## Verification to run on next pickup
- <command or check>
```

Keep it under 400 words. After writing, `touch ${CLAUDE_PLUGIN_DATA:-~/.holocron}/sessions/${CLAUDE_SESSION_ID}/handoff-done.flag` so the pre-push hook stops nagging.
