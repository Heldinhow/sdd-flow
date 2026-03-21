# Implementation Plan: Require Sequential Approval Between Spec, Plan, and Tasks

**Branch**: `fix-sequential-sdd-approval` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/fix-sequential-sdd-approval/spec.md`

## Summary

Fix the guided SDD planning flow so it advances one stage at a time instead of feeling bundled together. The workflow should generate `spec.md`, stop for mandatory approval in the current session, then generate the planning package, stop again for mandatory approval, and only then generate `tasks.md` from the approved planning artifacts.

## Technical Context

**Language/Version**: TypeScript 5.8 with strict mode  
**Primary Dependencies**: Bun runtime, `@opencode-ai/plugin`, existing workflow routing/helpers  
**Storage**: Filesystem-backed planning artifacts under `specs/` plus in-memory session workflow state  
**Testing**: Bun's built-in `bun:test` and TypeScript type-checking via `bunx tsc --noEmit`  
**Target Platform**: OpenCode plugin runtime and guided repo-local SDD workflow  
**Project Type**: OpenCode plugin with markdown-defined workflow commands and TypeScript routing logic  
**Performance Goals**: Keep routing overhead negligible while adding explicit stage-gate evaluation  
**Constraints**: Keep `Spec Driven` in plan mode, preserve markdown-only outputs, keep clarifications sequential, use session-scoped approvals rather than persisted approval files, and make resume conservative when approvals are unknown  
**Scale/Scope**: Command contract updates, workflow state/routing changes, resume behavior changes, and workflow regression coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Change remains inside the existing Bun + TypeScript workflow architecture
- ✅ `Spec Driven` stays in planning mode and continues producing markdown-only artifacts
- ✅ Clarification remains explicit and sequential
- ✅ Scope is limited to workflow control and artifact sequencing rather than implementation-mode behavior

## Files to Modify

| File | Change |
|------|--------|
| `.opencode/command/sdd.md` | **MODIFY** - Describe mandatory approval gates and sequential artifact generation clearly |
| `.opencode/managed-assets/.opencode/command/sdd.md` | **MODIFY** - Keep bundled command contract aligned with repo-local command behavior |
| `.opencode/src/workflow/session-state.ts` | **MODIFY** - Add session-scoped approval state and any waiting-for-approval phase modeling |
| `.opencode/src/workflow/phase-router.ts` | **MODIFY** - Gate progression on approval state instead of artifact existence alone |
| `.opencode/src/workflow/run-guided-sdd.ts` | **MODIFY** - Thread session approval state through guided routing and resume decisions |
| `.opencode/src/workflow/resume-flow.ts` and related helpers | **MODIFY** - Revalidate stages conservatively when approval state is unavailable |
| `.opencode/tests/unit/workflow/*.test.ts` | **MODIFY/CREATE** - Cover spec gate, plan gate, and conservative resume behavior |
| `AGENTS.md` or workflow docs | **MODIFY if needed** - Keep documented stage order aligned with the fixed workflow |

## File Details

### 1. Command contract

**Purpose**: Make the user-facing `/sdd` contract explicitly sequential.

**Changes**:

- Remove wording that implies the workflow will naturally produce everything in one pass
- Explain that `spec.md` must be approved before planning begins
- Explain that the planning package must be approved before `tasks.md` is generated

### 2. Workflow state model

**Purpose**: Represent approval gates directly in routing.

**Changes**:

- Add session-scoped approval flags for spec and plan
- Distinguish generation phases from waiting-for-approval phases
- Keep approval state session-local by design

### 3. Routing and resume behavior

**Purpose**: Stop eager progression and make resume safer.

**Changes**:

- Route to waiting states when approvals are missing
- Only unlock planning after spec approval
- Only unlock tasks after plan approval
- When resuming without session approval state, stop at the latest completed stage and ask for revalidation

### 4. Regression coverage

**Purpose**: Prevent the workflow from reverting to “all at once” behavior.

**Coverage targets**:

- `spec.md` generation does not auto-trigger planning
- Planning package generation does not auto-trigger tasks
- Resume with existing artifacts but missing session approvals stops at the right gate
- User-facing recommendations identify the pending approval stage correctly

## Project Structure

### Documentation (this feature)

```text
specs/fix-sequential-sdd-approval/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
.opencode/
├── command/
│   └── sdd.md
├── managed-assets/
│   └── .opencode/
│       └── command/
│           └── sdd.md
├── src/
│   └── workflow/
│       ├── phase-router.ts
│       ├── resume-flow.ts
│       ├── run-guided-sdd.ts
│       └── session-state.ts
└── tests/
    └── unit/
        └── workflow/
```

**Structure Decision**: Keep the fix centered on the workflow engine and command contract so command wording and actual routing behavior remain aligned.

## Complexity Tracking

> No constitution violations. The added complexity is limited to explicit stage-gate state and related workflow tests.

| Aspect | Status |
|--------|--------|
| Session-scoped approval model introduced | ✅ Required for explicit spec/plan gates |
| Resume made intentionally conservative | ✅ Required because approvals are not persisted |
| Command contract and runtime routing aligned | ✅ Prevents prompt-only fixes from drifting |
