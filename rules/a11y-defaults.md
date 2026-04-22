# Rule — accessibility defaults

Every new UI element must be accessible on first commit. Accessibility retrofits don't happen; inaccessible code ships.

## Non-negotiable defaults
- Use the semantic element (`<button>`, `<a>`, form elements, landmarks). Don't reach for `<div role="...">` when the platform element exists.
- Every interactive control has an accessible name.
- Every input has a programmatic label.
- Every image has `alt` (empty when decorative).
- `:focus-visible` is styled — do not remove without replacement.
- Respect `prefers-reduced-motion` in animations.

## When in doubt
- Run `@a11y-auditor` on the component.
- Consult `skills/a11y-checklist`.
- Prefer the WCAG success criterion you can name over "looks accessible".
