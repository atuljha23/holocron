# Frontend context

This repo is primarily frontend (UI, client-side state, rendering). Optimize for:

- Accessibility from the first commit — not as a follow-up.
- Component API stability — consumers outside this repo depend on your props.
- Bundle health — every new dep earns its keep.
- Interaction performance — INP matters more than first paint once the app is loaded.

## Default collaborators
- `@frontend-engineer` for feature work
- `@a11y-auditor` on every non-trivial UI change
- `@perf-engineer` when changing shared components or heavy deps
- `@code-reviewer` before merge

## Default commands
- `/holocron:a11y` — on changed UI files
- `/holocron:perf` — when touching bundle or render path
- `/holocron:test-gap` — on changed components

## Default rules
- `rules/a11y-defaults.md`
- `rules/read-before-write.md`
- `rules/atomic-commits.md`
