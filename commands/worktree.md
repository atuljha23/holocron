---
description: Set up a git worktree for parallel Claude Code sessions — zero-dead-time while one feature bakes. Creates the worktree, creates/switches the branch, and prints the launch command.
argument-hint: <branch-name> [--base main]
allowed-tools: Read, Bash(git worktree:*), Bash(git branch:*), Bash(git fetch:*), Bash(git rev-parse:*), Bash(realpath:*), Bash(pwd:*), Bash(ls:*)
---

# /holocron:worktree

Set up a parallel worktree so you can work on a new branch without disturbing the current session.

Branch: `$ARGUMENTS`

## Steps

1. Detect the current repo root (`git rev-parse --show-toplevel`). If not inside a git repo, ask the user to `cd` into one first.
2. Decide the base branch: parse `--base <ref>` from `$ARGUMENTS`; default to `main` if present, else `master`, else the current branch.
3. Fetch: `git fetch origin`.
4. Decide the worktree path: sibling directory at `<repo-parent>/<repo-name>-<branch>` (keep the original folder clean).
5. List existing worktrees (`git worktree list`). If the target branch or path already has a worktree, warn and exit — don't overwrite.
6. Create:
   - If the branch exists locally: `git worktree add <path> <branch>`.
   - If it exists only on origin: `git worktree add --track -b <branch> <path> origin/<branch>`.
   - If it doesn't exist anywhere: `git worktree add -b <branch> <path> <base>`.
7. Print the launch line the user should run:
   ```
   cd <path> && claude
   ```
8. Remind them: when the branch is merged and the work is done, clean up with
   ```
   git worktree remove <path>
   git branch -d <branch>   # or -D if it was force-pushed
   ```

## Do not

- Do not `cd` into the new worktree from this session — the current session stays put.
- Do not force-remove an existing worktree.
- Do not commit or push in this command; worktree creation is the whole job.
