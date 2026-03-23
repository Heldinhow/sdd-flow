# Implementation Plan: sdd-init Speckit Alignment

**Branch**: `004-sdd-init-speckit-align` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-sdd-init-speckit-align/spec.md`

## Summary

Remove `AGENTS.md` from the `/sdd-init` managed-assets bundle and all supporting
infrastructure (asset classification, state detection, plugin prompt, command definitions,
tests). Align the installed folder structure to the speckit standard so that init
only places files under `.specify/`, `.opencode/`, and `specs/`. Produce a deviation
audit documenting all remaining intentional sdd-flow vs speckit differences.

## Technical Context

**Language/Version**: TypeScript 5.8 strict, Bun runtime
**Primary Dependencies**: `@opencode-ai/plugin`, `bun:test`
**Storage**: N/A — filesystem files only
**Testing**: `bun:test` unit tests; integration tests in `.opencode/tests/`
**Target Platform**: Node 22 / Bun compatible
**Project Type**: OpenCode plugin (library + CLI workflow backend)
**Performance Goals**: N/A — no performance-sensitive changes
**Constraints**: Non-destructive to existing repos; all existing `speckit.*` commands must remain functional
**Scale/Scope**: Pure refactoring — ~12 files changed, ~30 lines removed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First Ordering | ✅ PASS | Refactoring only; no artifact ordering changes |
| II. Approval-Gated Phase Transitions | ✅ PASS | No phase transition logic changes |
| III. Non-Destructive Bootstrap | ✅ PASS | Removing AGENTS.md from init improves non-destructiveness |
| IV. Session-Scoped Workspaces | ✅ PASS | No workspace logic changes |
| V. Repo-Owned Artifacts | ✅ PASS | Planning artifacts still live in `specs/<feature>/` |
| Technical Standards | ✅ PASS | TypeScript changes follow existing conventions |

## Project Structure

### Documentation (this feature)

```text
specs/004-sdd-init-speckit-align/
├── plan.md              # This file
├── research.md          # Deviation audit (KEEP / REMOVE / REVIEW)
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md
```

### Source Code Changes

```text
.opencode/src/init/
├── managed-assets.ts    # Remove GUIDE group and AGENTS.md entry
└── detect-repo-state.ts # Remove hasAgentsFile from RepoState

.opencode/src/plugin/
└── spec-driven-agent.ts # Remove AGENTS.md from uninitialized-repo prompt

.opencode/command/
├── sdd-init.md          # Remove Phase 4.1, verification 6.7, completion line
├── sdd.md               # Replace AGENTS.md rules with constitution + organic generation
└── speckit.analyze.md   # Make AGENTS.md load opportunistic, not required

.opencode/managed-assets/
├── AGENTS.md            # DELETED
└── .opencode/command/
    ├── sdd-init.md      # Synced from source
    ├── sdd.md           # Synced from source
    └── speckit.analyze.md # Synced from source

.opencode/tests/unit/
├── packaging/packaging.test.ts  # Remove REQUIRED_GUIDE_ASSETS and loop
└── init/repo-init.test.ts       # Change toContain → not.toContain for AGENTS.md

.specify/memory/constitution.md  # Update AGENTS.md governance reference
```

**Structure Decision**: All changes are in-place edits or deletions. No new directories.
The managed-assets bundle root now contains only `.opencode/` and `.specify/` — fully
aligned with speckit standard.
