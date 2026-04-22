# Rule — atomic commits

One logical change per commit. A commit should stand on its own: build, tests pass, message describes the *why*.

## Why
- Makes `git bisect` useful.
- Makes review surgical — reviewers can opine on one thing at a time.
- Makes reverts safe — rolling back one commit doesn't unroll three unrelated features.

## Do
- Split unrelated refactors from feature work into separate commits.
- Keep message subjects ≤ 72 chars.
- Use the body for the "why" when the "what" isn't obvious from the diff.

## Don't
- Don't pile "fix typo" commits on top of a feature commit when a squash fixup would be clearer (or vice versa).
- Don't include generated/formatting noise in the same commit as logic changes.
- Don't amend pushed commits without coordinating with the team.
