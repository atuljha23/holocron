# Rule — read before write

Always read a file in the current session before editing it. No exceptions for "small changes".

## Why
- Writes without reads routinely overwrite work or break conventions.
- The pre-edit hook tracks reads; unread writes trigger a warning in context.
- Small time cost (a Read is cheap); large payoff (fewer regressions).

## Applies to
- Edit, Write, MultiEdit on any existing file.
- Does not apply to new-file creation.
