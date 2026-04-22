---
description: Self-check the holocron plugin install — manifests, SQLite, directories, Node version, hook wiring.
allowed-tools: Bash(node:*)
---

# /holocron:doctor

Run the plugin's self-check:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" doctor
```

Also print the inventory:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" inventory
```

If any `[FAIL]` or `[WARN]` lines appear, explain what to do about them (usually: `cd <plugin dir> && npm install`).
