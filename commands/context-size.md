---
description: Snapshot the current session's context footprint — transcript size, CLAUDE.md size, MCP schemas, file reads still in context. Identifies what's eating tokens so you can trim.
allowed-tools: Read, Bash(ls:*), Bash(wc:*), Bash(du:*), Glob
---

# /holocron:context-size

Inspect where the context-window money is going.

## Gather

1. **Transcript size** — if the session has a `transcript_path`, report its size. Otherwise estimate from turn count × avg-turn-size.

2. **CLAUDE.md contributions** — each of these, if it exists, contributes tokens to every turn:
   - `~/.claude/CLAUDE.md` (user scope)
   - `./CLAUDE.md` or `./.claude/CLAUDE.md` (project scope)
   - `~/.claude/memory/MEMORY.md` and the indexed memory files
   Report: file path, byte size, approximate tokens (`bytes / 4`).

3. **MCP schemas** — list the MCP tools in the current session's tool list and estimate their combined schema token cost.

4. **Plugin hook additionalContext** — note any persistent injections (e.g., holocron's SessionStart learnings, UserPromptSubmit matches). These live in the transcript.

5. **Open file reads** — list files you've `Read` in this session. Big unread-again files are candidates for trimming in the next session.

## Output

```
## Context footprint (snapshot)

- Transcript:        <size> (~<tokens> tokens)
- CLAUDE.md (user):  <size> (~<tokens> tokens) — <path>
- CLAUDE.md (proj):  <size> (~<tokens> tokens) — <path>  or "(none)"
- Memory index:      <size> (~<tokens> tokens)  or "(none)"
- MCP schemas:       ~<tokens> tokens across <N> tools
- Big file reads:
  - <file> (<lines> lines, ~<tokens>)
  - ...

## Biggest offenders (trim candidates)
1. <item> — ~<tokens> tokens — trim by <action>
2. ...
```

## Actions to suggest

- CLAUDE.md > 1k lines → split into role-scoped files (planned for v0.3.0+).
- MCP schemas > 8k tokens → `/holocron:mcp-audit` for pruning.
- Session transcript > 150k tokens → run `/holocron:handoff` and start fresh.
- One file re-read multiple times → `Grep` + targeted `Read(offset, limit)` next time.

## Do not

- Guess sizes. If you don't know, say so.
- Recommend a rewrite of CLAUDE.md without reading it first.
