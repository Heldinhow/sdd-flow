<!--
## Sync Impact Report

**Version change**: (template) → 1.0.0 (initial ratification)

**Principles defined (new)**:
- I. Spec-First Ordering
- II. Approval-Gated Phase Transitions
- III. Non-Destructive Bootstrap
- IV. Session-Scoped Workspaces
- V. Repo-Owned Artifacts

**Sections added**:
- Core Principles (5 principles from CLAUDE.md invariants)
- Technical Standards
- Workflow Invariants
- Governance

**Templates reviewed**:
- `.specify/templates/plan-template.md` ✅ — Constitution Check section present;
  gates derive directly from the five principles
- `.specify/templates/spec-template.md` ✅ — scope/requirements structure aligns
  with Spec-First and Approval-Gated principles
- `.specify/templates/tasks-template.md` ✅ — phase ordering aligns with
  artifact-ordering principle; test discipline aligns with Technical Standards
- `.specify/templates/commands/` ⚠ pending — directory not found in repo;
  no command templates to validate

**Deferred TODOs**:
- `TODO(RATIFICATION_DATE)`: original project adoption date unknown; marked
  as TODO until confirmed from git history or project records
-->

# sdd-flow Constitution

## Core Principles

### I. Spec-First Ordering

The workflow MUST enforce a strict artifact ordering: spec → plan → tasks →
implement. No phase may begin until its predecessor artifact exists and has
been approved. The `Spec Driven` agent MUST NOT produce a plan before a spec
exists, MUST NOT generate tasks before a plan exists, and MUST NOT invoke
`/implement` before tasks exist.

**Rationale**: Skipping phases produces ambiguous implementations where
implementation decisions cannot be traced to an approved user requirement.
Strict ordering makes every decision auditable.

### II. Approval-Gated Phase Transitions

The workflow MUST pause and request explicit user approval before advancing
from one planning phase to the next. Silent auto-advancement between phases
is prohibited. The agent MUST surface the completed artifact and wait for a
clear approval signal before continuing.

**Rationale**: Approval gates give the user visibility and control at each
decision point, preventing weak specs or incomplete plans from becoming
implementation debt that is expensive to reverse.

### III. Non-Destructive Bootstrap

`/sdd-init` MUST classify every managed file as ADD, KEEP, or REVIEW. It
MUST NOT silently overwrite a file that already exists in the repository.
Files marked REVIEW MUST be presented to the user for manual inspection
before any merge or replacement occurs.

**Rationale**: The init workflow must be safe for brownfield repositories.
Silent overwrites destroy local customization and break user trust in the
bootstrap process.

### IV. Session-Scoped Workspaces

Each new `Spec Driven` interaction MUST create a fresh feature workspace
under `specs/<typed-branch>/`. A typed branch prefix (`feat`, `fix`,
`refactor`, `init`, `test`) is required. Reusing a prior session's workspace
for a distinct interaction is prohibited.

**Rationale**: Isolated workspaces keep planning artifacts for different
features separate, enabling independent review, handoff, and rollback without
cross-feature interference.

### V. Repo-Owned Artifacts

All planning artifacts (`spec.md`, `plan.md`, `research.md`, `data-model.md`,
`quickstart.md`, `tasks.md`) MUST reside in the repository under
`specs/<feature>/`. No planning state may be stored exclusively in agent
memory or hidden session state. Artifacts MUST be committed to version control
as part of the feature workflow.

**Rationale**: Repository-owned artifacts are reviewable, auditable, shareable,
and resilient to session changes and agent upgrades. They make the workflow
handoff-safe between people and agents.

## Technical Standards

The following standards apply to all source code contributed to `sdd-flow`.

- **Runtime**: Bun (Node 22 compatible). TypeScript 5.8 with strict mode
  enabled at all times. `verbatimModuleSyntax` and `moduleResolution: Bundler`
  are required compiler options.
- **Module imports**: `node:` prefix for all Node built-ins; `import type`
  for type-only imports; file extensions always included in relative paths
  (e.g., `import { foo } from "./foo.ts"`).
- **Naming**: `camelCase` for functions and variables, `PascalCase` for types
  and interfaces, `kebab-case.ts` for file names. Boolean variables MUST be
  prefixed with `is`, `has`, or `should`.
- **Error handling**: Plain `throw new Error(...)`. No custom error classes.
  No `!` non-null assertions. Use `??` and `?.` for safe navigation; handle
  `null` and `undefined` explicitly in conditional logic.
- **Testing**: `bun:test` only — no Jest or Vitest. Tests live in
  `.opencode/tests/` mirroring the `src/` directory structure. The pre-commit
  gate is `bunx tsc --noEmit && bun test` and MUST pass before merging.
- **Exhaustive enums**: Use `as const` objects with indexed access types.
  Avoid raw string unions for values that need exhaustive handling.

## Workflow Invariants

Rules that govern the SDD workflow's operational behavior at runtime.

- **Branch naming**: `feat-<slug>`, `fix-<slug>`, `refactor-<slug>`,
  `init-<slug>`, `test-<slug>`. Freeform branch names are not permitted.
- **Slash command execution**: When user input starts with `/`, the registered
  command MUST be executed immediately. Re-reading the command markdown file,
  explaining what the command does, or asking for confirmation before running
  are all prohibited.
- **Agent permissions**: Restrictive by default. `Spec Driven` operates in
  plan mode only — markdown writes scoped to `specs/**`, no code execution.
  Permissions are declared per-agent and per-operation in the plugin manifest.
- **Automatic task generation**: After `spec.md`, `plan.md`, `research.md`,
  `data-model.md`, and `quickstart.md` are complete and the planning package
  is approved, `tasks.md` MUST be generated automatically. The user MUST NOT
  be required to invoke a separate command to trigger task generation.

## Governance

This constitution supersedes all other development practices for `sdd-flow`.
When a practice documented elsewhere conflicts with a principle here, the
constitution takes precedence.

**Amendment procedure**: Any amendment MUST be accompanied by a semantic
version bump, a description of the change in the Sync Impact Report, and —
for principle removals or redefinitions — a migration note explaining the
impact on existing workflows and templates.

**Versioning policy**:
- MAJOR — backward-incompatible principle removals or redefinitions
- MINOR — new principle or section added, or materially expanded guidance
- PATCH — clarifications, wording fixes, non-semantic refinements

**Compliance review**: All PRs that modify planning workflow behavior, agent
permissions, or init logic MUST reference the relevant constitution principle
in the PR description. Complexity that violates a principle MUST be justified
in the `Complexity Tracking` table in `plan.md`.

See `AGENTS.md` for repository-specific development guidelines (generated organically during planning via `update-agent-context.sh`).

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-03-22
