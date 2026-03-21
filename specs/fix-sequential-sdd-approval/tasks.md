# Tasks: Require Sequential Approval Between Spec, Plan, and Tasks

**Input**: Design documents from `/specs/fix-sequential-sdd-approval/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Workflow regression coverage is required because this fix changes routing and approval behavior.

**Organization**: Tasks are grouped by user story so spec gating, plan gating, and conservative resume behavior can be validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task supports

---

## Phase 1: Foundation - Model session approval gates

**Purpose**: Introduce the workflow concepts needed for explicit stage approvals.

- [ ] T001 Extend workflow/session types to represent session-scoped approval state for spec and plan
- [ ] T002 Update phase recommendations or route modeling to distinguish generation phases from approval-waiting phases
- [ ] T003 Update shared workflow guidance so sequential stage gating is part of the canonical `/sdd` contract

**Checkpoint**: The workflow model can represent “waiting for spec approval” and “waiting for plan approval.”

---

## Phase 2: User Story 1 - Spec approval gates planning (Priority: P1) 🎯 MVP

**Goal**: The workflow stops after `spec.md` and requires approval before planning.

**Independent Test**: Generate `spec.md` in a fresh session and verify the workflow requests approval instead of generating `plan.md`.

### Tests for User Story 1

- [ ] T004 [P] [US1] Add routing tests for “spec exists but spec approval is false” in `.opencode/tests/unit/workflow/`
- [ ] T005 [P] [US1] Add guided-flow tests proving `plan.md` is blocked until current-session spec approval is true

### Implementation for User Story 1

- [ ] T006 [US1] Update `.opencode/src/workflow/session-state.ts` to model spec approval state
- [ ] T007 [US1] Update `.opencode/src/workflow/phase-router.ts` to stop at a spec-approval gate before planning
- [ ] T008 [US1] Update `.opencode/src/workflow/run-guided-sdd.ts` to pass session approval state into phase routing
- [ ] T009 [US1] Update `.opencode/command/sdd.md` so the workflow contract explicitly tells the user to approve spec before planning continues

**Checkpoint**: Spec generation and spec approval are now separate steps.

---

## Phase 3: User Story 2 - Plan approval gates task generation (Priority: P1)

**Goal**: The workflow stops after the planning package and requires approval before `tasks.md`.

**Independent Test**: Generate the planning package and verify `tasks.md` is blocked until current-session plan approval is true.

### Tests for User Story 2

- [ ] T010 [P] [US2] Add routing tests for “plan exists but plan approval is false” in `.opencode/tests/unit/workflow/`
- [ ] T011 [P] [US2] Add guided-flow tests proving `tasks.md` is blocked until current-session plan approval is true

### Implementation for User Story 2

- [ ] T012 [US2] Extend `.opencode/src/workflow/session-state.ts` to model plan approval state
- [ ] T013 [US2] Update `.opencode/src/workflow/phase-router.ts` to stop at a plan-approval gate before tasks
- [ ] T014 [US2] Update `.opencode/command/sdd.md` so task generation is described as post-approval rather than eager automatic progression
- [ ] T015 [US2] Ensure task-generation handoff guidance still uses the planning package as its declared source input

**Checkpoint**: Plan generation and task generation are now separated by explicit approval.

---

## Phase 4: User Story 3 - Resume flow stays conservative without approval state (Priority: P2)

**Goal**: Resume behavior revalidates stages instead of skipping gates when approval state is missing.

**Independent Test**: Resume a workspace with existing artifacts but no current-session approval state and verify the workflow requests reapproval at the right stage.

### Tests for User Story 3

- [ ] T016 [P] [US3] Add resume-flow tests for existing `spec.md` without current-session approval
- [ ] T017 [P] [US3] Add resume-flow tests for existing planning package without current-session approval

### Implementation for User Story 3

- [ ] T018 [US3] Update `.opencode/src/workflow/run-guided-sdd.ts` and related resume logic to prefer revalidation when session approval is unknown
- [ ] T019 [US3] Update user-facing recommendations so resumed sessions explain which stage needs reapproval and why

**Checkpoint**: Resume does not bypass approval gates based only on artifact presence.

---

## Phase 5: Polish & Cross-Cutting Verification

- [ ] T020 Run typecheck for `.opencode/`
- [ ] T021 Run workflow unit tests covering routing, guided flow, and resume behavior
- [ ] T022 Run the guided verification scenarios from `specs/fix-sequential-sdd-approval/quickstart.md`
- [ ] T023 Confirm `/sdd` now progresses as `spec -> approve -> plan package -> approve -> tasks`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies; it introduces the approval-gate model
- **Phase 2**: Depends on Phase 1 because spec gating needs the approval-state model
- **Phase 3**: Depends on Phase 1 and should follow Phase 2 so the full sequential path can be verified end to end
- **Phase 4**: Depends on Phases 2-3 because conservative resume behavior must respect both gates
- **Phase 5**: Depends on all previous phases

### Parallel Opportunities

- T004 and T005 can run in parallel
- T010 and T011 can run in parallel
- T016 and T017 can run in parallel

---

## Notes

- This fix intentionally keeps approvals session-scoped rather than persisted in the workspace
- Resume therefore favors safety and revalidation over convenience
- The command contract and routing logic must be updated together so the workflow no longer feels “all at once”
