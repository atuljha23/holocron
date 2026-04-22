---
description: Search the holocron (SQLite + FTS5) for relevant past learnings. Returns top matches ranked by bm25.
argument-hint: <query>
allowed-tools: Bash(node:*)
---

# /holocron:recall

Search for relevant rules captured in past sessions.

Run:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" search $ARGUMENTS
```

Present the results concisely. If none match, say so; do not hallucinate.

If the user wants to see all recent learnings instead of a search, suggest:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" list --limit 20
```
