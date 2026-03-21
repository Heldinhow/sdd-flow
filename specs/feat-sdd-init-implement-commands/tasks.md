# Tasks: SDD Init and Implement Commands

**Input**: Design documents from `/specs/feat-sdd-init-implement-commands/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Unit tests are included for the plugin changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Create command file structure

- [ ] T001 Create `.opencode/command/sdd-init.md` command file with YAML frontmatter
- [ ] T002 [P] Create `.opencode/command/implement.md` command file with YAML frontmatter

---

## Phase 2: User Story 1 - Initialize SDD Workflow (Priority: P1)

**Goal**: `/sdd-init` creates all required directories, files, and constitution interactively

**Independent Test**: Run `/sdd-init` in a fresh repository and verify all artifacts are created

### Implementation for User Story 1

- [ ] T003 [US1] Add handoff configuration to `sdd-init.md` for default agent
- [ ] T004 [US1] Write Phase 1 checklist: Directory Structure (`.specify/`, `.opencode/`, `specs/`)
- [ ] T005 [US1] Write Phase 2 checklist: Template Files (copy from `.specify/templates/`)
- [ ] T006 [US1] Write Phase 3 checklist: Shell Scripts (copy to `.specify/scripts/bash/`)
- [ ] T007 [US1] Write Phase 4 checklist: OpenCode Integration (AGENTS.md, command files)
- [ ] T008 [US1] Write Phase 5 checklist: Constitution Creation (interactive prompting)
- [ ] T009 [US1] Write Phase 6 checklist: Verification (all files exist, no placeholders)
- [ ] T010 [US1] Add user instructions: "Switch back to Spec Driven agent after completion"

**Checkpoint**: `/sdd-init` command is complete and ready for testing

---

## Phase 3: User Story 2 - Automatic Planning Artifacts (Priority: P1)

**Goal**: Planning workflow automatically creates research.md, data-model.md, quickstart.md without manual intervention

**Independent Test**: Run `/sdd` for a new feature and verify all complementary files are created

**Note**: This is already implemented in the existing `/sdd` workflow (Step 4 in sdd.md). This phase verifies integration with `/implement`.

### Verification for User Story 2

- [ ] T011 [P] [US2] Verify `/sdd` creates `research.md` automatically during planning
- [ ] T012 [P] [US2] Verify `/sdd` creates `data-model.md` when feature involves data entities
- [ ] T013 [P] [US2] Verify `/sdd` creates `quickstart.md` with usage guide
- [ ] T014 [P] [US2] Verify `/sdd` creates `tasks.md` automatically after planning

**Checkpoint**: Planning flow creates all required artifacts automatically

---

## Phase 4: User Story 3 - Execute Implementation (Priority: P2)

**Goal**: `/implement` hands off to default agent and loads all planning artifacts as context

**Independent Test**: Complete planning for a feature and run `/implement` to verify handoff and artifact loading

### Implementation for User Story 3

- [ ] T015 [US3] Add handoff configuration to `implement.md` for default agent
- [ ] T016 [US3] Add tasks.md validation step to `implement.md`
- [ ] T017 [US3] Add loading of `research.md` for technical decision context
- [ ] T018 [US3] Add loading of `quickstart.md` for usage pattern context
- [ ] T019 [US3] Add loading of `data-model.md` for entity context (conditional - if exists)
- [ ] T020 [US3] Add loading of `plan.md` for implementation plan context
- [ ] T021 [US3] Reference `/speckit.implement` logic for task execution flow
- [ ] T022 [US3] Add error handling for missing feature workspace
- [ ] T023 [US3] Add completion status reporting

**Checkpoint**: `/implement` command is complete and ready for testing

---

## Phase 5: User Story 4 - Spec Driven Warning (Priority: P1)

**Goal**: Spec Driven agent detects uninitialized repos and shows clear warning

**Independent Test**: Use Spec Driven in a fresh repository and verify warning message appears

### Tests for User Story 4

- [ ] T024 [P] [US4] Add test case: initialized repo returns normal prompt in `tests/unit/plugin/spec-driven-agent.test.ts`
- [ ] T025 [P] [US4] Add test case: uninitialized repo returns warning prompt

### Implementation for User Story 4

- [ ] T026 [US4] Modify `buildSpecDrivenPrompt()` in `.opencode/src/plugin/spec-driven-agent.ts`
- [ ] T027 [US4] Add early return for `repoInitialized === false`
- [ ] T028 [US4] Add warning message structure with clear instructions
- [ ] T029 [US4] Add instruction to run `/sdd-init` first
- [ ] T030 [US4] Add instruction to switch to default agent and back

**Checkpoint**: Spec Driven agent shows proper warning for uninitialized repos

---

## Phase 6: Integration & Polish

**Purpose**: Cross-cutting concerns and verification

- [ ] T031 Verify `/sdd-init` creates all 7 required directories/files
- [ ] T032 [P] Verify `/implement` handoff works with existing tasks.md
- [ ] T033 [P] Verify `/implement` loads all planning artifacts (research.md, quickstart.md, data-model.md)
- [ ] T034 [P] Run all unit tests: `cd .opencode && bun test`
- [ ] T035 Update AGENTS.md with new commands documentation
- [ ] T036 Run typecheck: `cd .opencode && bunx tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - creates command files
- **User Story 1 (Phase 2)**: Depends on T001 from Setup
- **User Story 2 (Phase 3)**: No implementation tasks - verification only
- **User Story 3 (Phase 4)**: Depends on T002 from Setup
- **User Story 4 (Phase 5)**: No dependencies on other phases - can run in parallel
- **Polish (Phase 6)**: Depends on Phases 2,4, 5 completion

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T011-T014 can run in parallel (verification tasks)
- T024 and T025 can run in parallel (different test cases)
- T032, T033, T034 can run in parallel (different verification)

---

## Notes

- All command files use existing OpenCode handoff mechanism
- TypeScript changes follow strict mode conventions
- Tests verify both positive and negative cases
- Commands are additive - no breaking changes to existing functionality
- Planning artifacts (research.md, data-model.md, quickstart.md) are created by existing `/sdd` workflow
- `/implement` loads these artifacts automatically as context for implementation