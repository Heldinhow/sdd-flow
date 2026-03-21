# sdd-flow Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-20

## Active Technologies

- TypeScript 5.8 + `@opencode-ai/plugin` (002-opencode-sdd-agent)
- Bun-first runtime with Node 22 compatibility (002-opencode-sdd-agent)
- `zod` schemas for plugin and workflow contracts (002-opencode-sdd-agent)

## Project Structure

```text
.opencode/
.specify/
specs/
```

## Commands

- `cd .opencode && bun test`
- `cd .opencode && bunx tsc --noEmit`
- `Spec Driven` is the primary user-facing SDD agent in OpenCode
- `/sdd` for the unified guided workflow

## Code Style

- TypeScript: ESM modules, schema-validated boundaries, repository-first workflow orchestration
- Git branches: use `feat-short-name`, `fix-short-name`, `refactor-short-name`, `init-short-name`, or `test-short-name`
- Markdown artifacts: planning outputs stay traceable, human-readable, and safe for non-destructive updates
- `Spec Driven`: plan mode only, markdown planning artifacts only, no direct source-code generation

## Recent Changes

- 002-opencode-sdd-agent: Planned a Bun-first TypeScript OpenCode plugin with non-destructive repository init and typed branch prefixes for the unified SDD workflow

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
