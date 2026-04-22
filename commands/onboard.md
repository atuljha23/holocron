---
description: Detect the project stack and draft a repo-appropriate CLAUDE.md (language, framework, test runner, lint setup, agents and commands that fit).
argument-hint: [--dry-run]
allowed-tools: Read, Glob, Grep, Bash(ls:*), Bash(cat:*), Edit, Write
---

# /holocron:onboard

Draft (or refresh) a `CLAUDE.md` at the repo root tailored to this project.

## Detect stack

Inspect the repo root and key subdirectories. Check for:

- `package.json` — detect framework hints (react, next, vue, svelte, express, fastify, nestjs, remix), test runner (jest, vitest, mocha, playwright, cypress), lint (eslint, biome), typechecker (tsc).
- `pyproject.toml` / `setup.cfg` / `requirements*.txt` — detect Django, Flask, FastAPI, pytest, ruff, mypy.
- `go.mod` — detect web framework (gin, chi, echo, fiber), test tooling.
- `Gemfile` — Rails / Sinatra.
- `Cargo.toml` — web framework if any, `cargo test`.
- `pom.xml` / `build.gradle[.kts]` — Java / Kotlin, Spring Boot.
- `composer.json` — PHP / Laravel.
- Infra: `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `terraform/`, `helm/`, `k8s/`.

Use `${CLAUDE_PLUGIN_ROOT}/contexts/<role>.md` for baseline context:

- frontend-heavy repo (React/Vue/Svelte, no server) → `contexts/frontend.md`
- backend-heavy repo (API server, no client) → `contexts/backend.md`
- test-centric or QA tooling repo → `contexts/qa.md`
- mixed / monorepo → `contexts/polyglot.md`

Also load applicable files from `${CLAUDE_PLUGIN_ROOT}/rules/` based on detected signals.

## Draft CLAUDE.md

Fill in the template at `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl` with:

- Project name (from `package.json` / `pyproject.toml` / repo folder name).
- Detected stack (one line per language/framework found).
- Commands the LLM should prefer (`npm test`, `pytest -q`, `go test ./...`).
- Recommended agents: a shortlist of `@architect`, `@frontend-engineer`, `@backend-engineer`, `@qa-engineer`, etc. that match the stack.
- Recommended holocron commands for this stack (e.g. always include `/holocron:a11y` for frontend projects).

## If CLAUDE.md already exists

Do NOT overwrite. Diff against the detected stack, list what would be added or updated, and ask before writing. With `--dry-run`, never write — only print the proposed content.

## Output shape

- Summary of detected stack (1 paragraph)
- Recommended agents (bulleted)
- Recommended commands (bulleted)
- The proposed `CLAUDE.md` content in a fenced block
- The path to be written and whether it will overwrite
