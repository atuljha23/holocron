---
description: Audit the MCP servers active in this session — tool count, schema size, and which ones probably aren't pulling their weight. Every MCP tool's schema adds tokens to every turn; disabling the unused ones is a direct cost cut.
allowed-tools: Read, Glob, Bash(cat:*), Bash(ls:*)
---

# /holocron:mcp-audit

Audit the MCP footprint.

## Gather

1. **Enumerate servers** — look in these places for MCP configs (read whichever exist):
   - `~/.claude.json` — user-level MCP servers
   - `~/.claude/settings.json` — user settings
   - `./.claude/settings.json` — project settings
   - `./.mcp.json` — project-level MCP registration
   - Plugin-level MCP configs under `~/.claude/plugins/marketplaces/*/\.mcp.json` or `~/.claude/plugins/cache/*/.mcp.json`

2. **For each server:** list the tools it exposes (from the current session's tool manifest, which you see in your system prompt's tool list). For each tool, estimate schema size in tokens (roughly `JSON.stringify(schema).length / 4`).

3. **Identify:**
   - **Heavy servers** — >2 MCP servers active, or a single server contributing >10 tools / >3k tokens of schema
   - **Unused servers** — servers whose tools you haven't invoked in the current session (if you can tell)
   - **Duplicates** — two servers that expose similar capability (e.g. two search providers)

## Output

```
## MCP footprint

Total MCP servers: <N>
Total MCP tools: <N>
Estimated schema tokens per turn: ~<N>

## By server
- <server-name> — <N tools>, ~<N> tokens of schema
  - <tool-a>, <tool-b>, ...
  - Used this session: <tools invoked, or "none observed">

## Recommendations
- Disable: <server> — <reason>
- Keep: <server> — <reason>
- Consolidate: <server-a> and <server-b> — <reason>
```

## Disabling an MCP server

In your Claude Code settings, add it to `mcpServers.<name>.disabled: true`, or remove the server entry entirely and reload.

## Do not

- Recommend disabling a server you don't understand the purpose of. Ask.
- Flag servers as "heavy" without a concrete token estimate — "heavy" alone is noise.
