---
description: Analyze your Claude Code permission setup — flag commands that probably deserve an allowlist entry, dangerous defaults that should be on the denylist, and suggest additions to settings.json. Reduces prompt fatigue without loosening safety.
argument-hint: [--scope user|project]
allowed-tools: Read, Glob, Bash(ls:*), Bash(cat:*)
---

# /holocron:permission-tune

Two files to inspect:

- **User scope**: `~/.claude/settings.json`
- **Project scope**: `.claude/settings.json` (and `.claude/settings.local.json`, if present)

## Steps

1. Read the existing permissions from the relevant scope (`$ARGUMENTS` selects; default: both).
2. Parse the `allow` and `deny` arrays (they may not exist).
3. Walk the recent conversation history surface this tool sees (or, if not available, ask the user which commands they find themselves approving repeatedly).
4. Against the existing allowlist, identify:
   - **Safe read-only commands** that are approved often but not on the allowlist (`git status`, `git diff`, `git log`, `ls`, `cat`, `grep`, `rg`, `find`, `fd`, `wc`, `head`, `tail`, `node <script>`, `python -c`, `pytest`, `npm test`, `go test`, `cargo test`).
   - **Dangerous commands** that aren't on the denylist (`rm -rf *`, `git push --force *`, `git reset --hard *`, `npm publish`, `gh release *`, `curl | sh`, `wget | sh`, `sudo *`, `brew uninstall *`).
5. Propose a patch to `settings.json` — show the exact JSON to add. Do not write the file automatically; the user approves the patch.

## Output format

```
## Current state
- allow: <N entries>
- deny: <N entries>

## Proposed allowlist additions (safe, high-frequency)
- "Bash(git status:*)"
- "Bash(rg:*)"
- ...

## Proposed denylist additions (dangerous defaults)
- "Bash(rm -rf:*)"
- "Bash(git push --force:*)"
- ...

## Patch to apply
```json
{
  "permissions": {
    "allow": [ ... ],
    "deny": [ ... ]
  }
}
```

After this: use `/update-config` or edit `settings.json` by hand.
```

## Do not

- Do not rewrite `settings.json` silently.
- Do not broaden permissions to `"Bash(*)"` — that defeats the point.
- Do not add a command to both allow and deny. If you're torn, it belongs in `deny`.
