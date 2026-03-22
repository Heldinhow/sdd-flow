# CLAUDE.md

## What This Project Is

`sdd-flow` is an OpenCode plugin that brings a Spec-Driven Development workflow into a repository. It ships a `Spec Driven` planning agent, a non-destructive repository bootstrap (`/sdd-init`), and an implementation entrypoint (`/implement`).

All source lives in `.opencode/`. Runtime: Bun. Language: TypeScript 5.8 strict. Plugin SDK: `@opencode-ai/plugin`.

See `AGENTS.md` for full development guidelines and conventions.

---

## Commands

All commands run from `.opencode/` unless noted.

```bash
# Typecheck
bunx tsc --noEmit

# Tests
bun test

# Run a single test file
bun test tests/unit/workflow/phase-router.test.ts

# Pre-commit check
bunx tsc --noEmit && bun test

# Build / publish prep
bun run prepublishOnly
```

---

## Key Directories

| Path | Purpose |
|------|---------|
| `.opencode/src/plugin/` | Plugin runtime, agent registration, hook handlers |
| `.opencode/src/workflow/` | SDD phase routing and planning orchestration |
| `.opencode/src/init/` | Non-destructive repository bootstrap logic |
| `.opencode/src/branching/` | Branch prefix detection and recommendation |
| `.opencode/command/` | Command markdown files (`/sdd`, `/sdd-init`, `/implement`, `speckit.*`) |
| `.opencode/managed-assets/` | Bundle published to npm |
| `.opencode/tests/` | Unit and integration tests (mirrors `src/` structure) |
| `.specify/scripts/bash/` | Shell workflow backends |
| `.specify/templates/` | Planning artifact templates |
| `specs/` | Feature workspaces (`specs/<feature-branch>/`) |

---

## Invariants — Do Not Break

1. **Artifact ordering**: spec → plan → tasks → implement. Never skip.
2. **Approval gates**: the workflow waits for explicit user approval before advancing phases.
3. **Non-destructive init**: `/sdd-init` classifies existing files as ADD / KEEP / REVIEW. Never overwrites without review.
4. **Session-scoped workspaces**: each new `Spec Driven` interaction creates a fresh typed branch workspace.
5. **Repo-owned artifacts**: planning artifacts live in `specs/<feature>/`, not in hidden agent state.

---

## TypeScript Conventions

- `node:` prefix for built-ins — `import { readFileSync } from "node:fs"`
- `import type` for type-only imports
- `import { foo } from "./foo.ts"` — always include extension
- `camelCase` functions/variables, `PascalCase` types, `kebab-case.ts` file names
- Boolean vars prefixed with `is`, `has`, `should`
- `as const` + indexed access for exhaustive enums
- Plain `throw new Error(...)` — no custom error classes
- No `!` non-null assertions

---

## Branch Naming

```
feat-<slug>
fix-<slug>
refactor-<slug>
init-<slug>
test-<slug>
```
