# sdd-flow

`sdd-flow` is an OpenCode-focused Spec-Driven Development workflow plugin and repository bootstrap kit.

It provides:
- a unified `/sdd` entrypoint for guided SDD flows
- compatibility wrappers for `speckit.specify`, `speckit.clarify`, `speckit.plan`, and `speckit.tasks`
- repo-local `.specify` scripts and templates adapted for typed branch prefixes like `feat-short-name`
- a TypeScript/Bun plugin runtime for init, branching, planning, clarification, and resume helpers

## Where the code is

The main implementation lives in hidden workflow directories because this project is structured the way OpenCode expects:

- plugin runtime: `.opencode/src/`
- plugin loader: `.opencode/plugin/sdd.ts`
- command surface: `.opencode/command/`
- tests: `.opencode/tests/`
- workflow backend scripts and templates: `.specify/`

## Project layout

```text
.opencode/
.specify/
specs/
AGENTS.md
README.md
```

## Verification

Run from the repository root:

```bash
cd .opencode && bun test
cd .opencode && bunx tsc --noEmit
```

## Current status

This repository already contains the core plugin code, tests, and adapted scripts/templates.

The current snapshot is a strong foundation for the unified SDD workflow, but it is not yet a fully finished end-to-end product. Follow-up work is still needed to:
- wire the runtime helpers directly into the `/sdd` execution flow
- generate the full planning artifact package automatically from the unified flow
- tighten clarification rewriting and resume/init edge cases

## Goal

The long-term goal is to make OpenCode feel like a simpler, repo-local version of Spec Kit: one entrypoint, guided clarification, typed branch naming, and reproducible markdown planning artifacts.
