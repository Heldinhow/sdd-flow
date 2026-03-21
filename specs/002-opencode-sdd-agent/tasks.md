# Tasks: Unified SDD Agent for OpenCode

**Input**: Design documents from `/specs/002-opencode-sdd-agent/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/  
**Tests**: No explicit test tasks are included because the feature specification does not require TDD or mandatory test-first delivery.  
**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the unified command surface and plugin package entrypoints.

- [x] T001 Create the unified SDD command entrypoint in `.opencode/command/sdd.md`
- [x] T002 Create the plugin registration entrypoint in `.opencode/src/plugin/index.ts`
- [x] T003 Register the plugin runtime and developer commands in `.opencode/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core branch, path, and workflow infrastructure that MUST exist before any user story can ship.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 [P] Update repository-root, branch validation, and feature workspace lookup in `.specify/scripts/bash/common.sh`
- [x] T005 [P] Update feature creation naming and feature-directory initialization in `.specify/scripts/bash/create-new-feature.sh`
- [x] T006 [P] Update planning and prerequisite path resolution in `.specify/scripts/bash/setup-plan.sh` and `.specify/scripts/bash/check-prerequisites.sh`
- [x] T007 Create shared workflow session state in `.opencode/src/workflow/session-state.ts`
- [x] T008 [P] Create phase routing logic in `.opencode/src/workflow/phase-router.ts`
- [x] T009 [P] Create allowed branch-prefix definitions in `.opencode/src/branching/prefixes.ts`
- [x] T010 Create the `.specify` artifact backend adapter in `.opencode/src/workflow/artifact-backend.ts`

**Checkpoint**: Foundation ready - repository init, guided planning, clarification, and resume flows can now be implemented.

---

## Phase 3: User Story 1 - Initialize a repository for guided SDD (Priority: P1)

**Goal**: Enable first-time and brownfield repositories to install or merge the managed SDD workflow assets safely.

**Independent Test**: Start from a repository without the workflow assets, run the init path, and verify that `.opencode`, `.specify`, the primary SDD entrypoint, and the managed guidance assets are installed or merged non-destructively.

### Implementation for User Story 1

- [x] T011 [P] [US1] Create the managed asset manifest in `.opencode/src/init/managed-assets.ts`
- [x] T012 [P] [US1] Create repository state detection in `.opencode/src/init/detect-repo-state.ts`
- [x] T013 [US1] Implement non-destructive asset merge planning in `.opencode/src/init/merge-managed-assets.ts`
- [ ] T014 [US1] Implement the repository initialization flow in `.opencode/src/init/run-init.ts`
- [x] T015 [US1] Update `.opencode/command/sdd.md` to expose init mode and post-init guidance

**Checkpoint**: Repository initialization works for both fresh and partially configured repositories.

---

## Phase 4: User Story 2 - Produce core planning artifacts from one guided conversation (Priority: P1)

**Goal**: Let a feature author move from feature request to planning package through one guided OpenCode entrypoint.

**Independent Test**: Start the unified SDD entrypoint with a new feature request, accept or adjust the recommended branch prefix and short name, and verify that the active feature workspace receives the expected planning artifacts without manual phase switching.

### Implementation for User Story 2

- [x] T016 [P] [US2] Create the active context loader in `.opencode/src/workflow/context-loader.ts`
- [x] T017 [P] [US2] Create the branch recommendation service in `.opencode/src/branching/recommend-branch.ts`
- [x] T018 [P] [US2] Create the guided planning runner in `.opencode/src/workflow/run-guided-sdd.ts`
- [ ] T019 [US2] Implement phase sequencing for planning artifact generation in `.opencode/src/workflow/orchestrate-planning.ts`
- [x] T020 [US2] Update `.opencode/command/sdd.md` to route new feature requests through the guided planning flow
- [x] T021 [US2] Update `.opencode/command/speckit.specify.md`, `.opencode/command/speckit.plan.md`, and `.opencode/command/speckit.tasks.md` as compatibility wrappers for the unified entrypoint

**Checkpoint**: A user can produce the planning package from one guided conversation.

---

## Phase 5: User Story 3 - Resolve ambiguity without leaving the workflow (Priority: P2)

**Goal**: Detect material ambiguity, ask focused clarification questions, and integrate accepted answers without breaking flow continuity.

**Independent Test**: Start the unified SDD flow with an ambiguous feature request, answer the clarification prompts, and verify that the accepted answers appear in the resulting planning artifacts without contradictory wording.

### Implementation for User Story 3

- [x] T022 [P] [US3] Create ambiguity detection rules in `.opencode/src/workflow/detect-ambiguity.ts`
- [ ] T023 [P] [US3] Create clarification integration logic in `.opencode/src/workflow/apply-clarifications.ts`
- [x] T024 [US3] Implement sequential clarification orchestration in `.opencode/src/workflow/run-clarify-loop.ts`
- [x] T025 [US3] Update `.opencode/src/workflow/run-guided-sdd.ts` to pause and resume around clarification decisions
- [x] T026 [US3] Update `.opencode/command/speckit.clarify.md` as a compatibility wrapper for in-flow clarification

**Checkpoint**: Clarification happens inside the guided flow and updates the right planning artifacts.

---

## Phase 6: User Story 4 - Resume from repository state (Priority: P3)

**Goal**: Resume the workflow from the current repository state instead of restarting feature planning from scratch.

**Independent Test**: Re-open a repository with a partial feature workspace, start the unified SDD entrypoint, and verify that the workflow continues from the next missing or outdated phase.

### Implementation for User Story 4

- [x] T027 [P] [US4] Create active workspace discovery in `.opencode/src/workflow/detect-active-workspace.ts`
- [x] T028 [P] [US4] Create artifact freshness evaluation in `.opencode/src/workflow/evaluate-artifact-state.ts`
- [ ] T029 [US4] Implement resume routing in `.opencode/src/workflow/resume-flow.ts`
- [x] T030 [US4] Update `.opencode/command/sdd.md` to recommend the next phase from repository state

**Checkpoint**: The unified workflow can resume reliably from existing planning artifacts.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize metadata, templates, and documentation that affect multiple user stories.

- [x] T031 [P] Update `.specify/scripts/bash/update-agent-context.sh` and `AGENTS.md` for unified runtime metadata and typed branch prefixes
- [x] T032 [P] Update `.specify/templates/spec-template.md`, `.specify/templates/plan-template.md`, and `.specify/templates/tasks-template.md` for unified-entrypoint guidance and typed branch prefixes
- [x] T033 Update `specs/002-opencode-sdd-agent/quickstart.md` with final command names and validation notes
- [x] T034 Update `specs/002-opencode-sdd-agent/contracts/repo-init.md` and `specs/002-opencode-sdd-agent/contracts/unified-sdd-workflow.md` to match shipped behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: Depend on Foundational completion
- **Polish (Phase 7)**: Depends on the user stories targeted for the release being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational and delivers repository initialization
- **User Story 2 (P1)**: Starts after Foundational and delivers the core guided planning flow
- **User Story 3 (P2)**: Depends on User Story 2 because clarification must run inside the guided planning flow
- **User Story 4 (P3)**: Depends on User Stories 1 and 2; it also benefits from User Story 3 when clarification state already exists

### Within Each User Story

- Shared detectors, catalogs, and loaders come before orchestrators that consume them
- Orchestration logic comes before command-surface wiring
- Command updates come after the underlying workflow behavior exists
- Complete one story checkpoint before promoting it as independently usable

### Parallel Opportunities

- T004, T005, and T006 can run in parallel after Setup
- T008 and T009 can run in parallel once T007 defines the shared session model inputs
- T011 and T012 can run in parallel for repository init
- T016, T017, and T018 can run in parallel for guided planning
- T022 and T023 can run in parallel for clarification
- T027 and T028 can run in parallel for resume support
- T031 and T032 can run in parallel during Polish

---

## Parallel Example: User Story 2

```bash
# Launch the independent guided-planning building blocks together:
Task: "Create the active context loader in .opencode/src/workflow/context-loader.ts"
Task: "Create the branch recommendation service in .opencode/src/branching/recommend-branch.ts"
Task: "Create the guided planning runner in .opencode/src/workflow/run-guided-sdd.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Confirm repository init and guided planning both work end to end

### Incremental Delivery

1. Complete Setup + Foundational -> foundation ready
2. Add User Story 1 -> validate repository initialization
3. Add User Story 2 -> validate one-entry guided planning
4. Add User Story 3 -> validate in-flow clarification
5. Add User Story 4 -> validate resume from repository state
6. Finish Polish -> validate templates, contracts, and agent metadata

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. After User Story 2 stabilizes:
   - Developer C: User Story 3
   - Developer D: User Story 4
4. Finish with shared Polish tasks

---

## Notes

- [P] tasks touch different files with no incomplete dependencies
- [Story] labels map each task back to the user story for traceability
- No explicit test tasks were added because the feature specification does not require them
- Keep file-path changes aligned with the nested `.opencode/` and `.specify/` structure defined in `plan.md`
- The current prerequisite scripts resolve the git root above `/Users/helder/sdd-flow`; T004-T006 should remove that mismatch before relying on automated path discovery
- Post-implementation review: `T014`, `T019`, `T023`, and `T029` remain open because end-to-end init success reporting, full planning artifact generation, clarification rewrites, and resume edge cases still need follow-up work.
