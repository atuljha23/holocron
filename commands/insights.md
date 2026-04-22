---
description: Correction heatmap for the holocron — top tags, weekly additions, oldest rules (review candidates). Makes the crystal visible.
allowed-tools: Bash(node:*)
---

# /holocron:insights

Show the shape of what you've taught Claude.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/holocron-cli.js" insights
```

## What you'll see

- **Totals** — user-scope and project-scope counts.
- **Top tags** — which topics you correct most. A heavy tag is a signal (real pattern, or a single incident blasted into many rules).
- **Weekly additions** — last 8 weeks. A flat line is either calm seas or that you stopped capturing — worth reflecting on which.
- **Oldest rules** — review candidates. A rule from 8 months ago that's still true is fine; one that's about a defunct library is noise. Retire what doesn't serve.

## When to use

- Sunday retro / weekly reflection.
- Before onboarding a teammate (show them the shape of "our rules").
- Before a `/holocron:handoff` at the end of a long project.
