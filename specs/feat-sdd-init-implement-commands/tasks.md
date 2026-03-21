# Tasks: Package and Bootstrap the SDD Command Scaffold

**Input**: Design documents from `/specs/feat-sdd-init-implement-commands/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Packaging/bootstrap regression coverage is required because the failure escaped through a publish/install gap.

**Organization**: Tasks are grouped by user story so the first-install command discovery fix can land independently from broader bootstrap hardening.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task supports

---

## Phase 1: Foundation - Make the scaffold publishable

**Purpose**: Ensure the npm package can actually ship every managed asset the runtime depends on.

- [ ] T001 Create a package-local managed asset bundle directory inside `.opencode/` that mirrors the required repo-local scaffold paths
- [ ] T002 [P] Populate the bundled scaffold with command markdown for `/sdd-init`, `/sdd`, `/implement`, and supported `speckit.*` commands
- [ ] T003 [P] Populate the bundled scaffold with required `.specify/scripts/bash/*`, `.specify/templates/*`, and `AGENTS.md`
- [ ] T004 Update `.opencode/package.json` `files` and related package metadata so the bundled scaffold is included in the publishable artifact

**Checkpoint**: The package boundary now contains every managed asset required for command discovery and bootstrap.

---

## Phase 2: User Story 1 - Commands appear after normal installation (Priority: P1) 🎯 MVP

**Goal**: The installed plugin registers the full SDD command set even when the consumer repo has no local `.opencode/command/` yet.

**Independent Test**: Load the plugin against a clean fixture repo and verify the command palette contains `/sdd-init`, `/sdd`, `/implement`, and the supported `speckit.*` commands.

### Tests for User Story 1

- [ ] T005 [P] [US1] Extend `.opencode/tests/unit/plugin/command-registry.test.ts` to cover command discovery from the packaged scaffold when repo-local command files are absent
- [ ] T006 [P] [US1] Add a package-shaped plugin initialization test that proves command metadata is registered from bundled command markdown

### Implementation for User Story 1

- [ ] T007 [US1] Update `.opencode/src/plugin/command-registry.ts` to resolve command templates from repo-local scaffold first and packaged scaffold second
- [ ] T008 [US1] Update `.opencode/src/plugin/index.ts` so command registration uses the bootstrap-aware source resolution during normal plugin startup
- [ ] T009 [US1] Verify bundled command registration preserves descriptions and handoff agent metadata from frontmatter

**Checkpoint**: First-install command discovery works without requiring a pre-created consumer `.opencode/command/` directory.

---

## Phase 3: User Story 2 - Bootstrap/init materializes the scaffold safely (Priority: P1)

**Goal**: Repo bootstrap/init copies missing scaffold assets from the packaged bundle without overwriting customized local files.

**Independent Test**: Run bootstrap/init against a fixture repo with missing and customized scaffold files, then verify missing files were added and differing files were preserved for review.

### Tests for User Story 2

- [ ] T010 [P] [US2] Update `.opencode/tests/unit/init/repo-init.test.ts` to validate managed asset manifests built from the packaged scaffold source
- [ ] T011 [P] [US2] Add a test that exercises bootstrap/init from the packaged scaffold into a clean consumer repo fixture
- [ ] T012 [P] [US2] Add a test that preserves customized consumer files while still copying other missing scaffold assets

### Implementation for User Story 2

- [ ] T013 [US2] Update `.opencode/src/init/managed-assets.ts` so the managed asset source resolves from the package-local scaffold bundle while keeping repo-relative target paths
- [ ] T014 [US2] Update `.opencode/src/init/run-init.ts` to copy missing assets from the packaged bundle into the consumer repository
- [ ] T015 [US2] If needed, update `.opencode/scripts/install-skill.js` or replace it with a broader bootstrap helper without coupling repo bootstrap to destructive postinstall behavior
- [ ] T016 [US2] Verify bootstrap still reports differing existing files as review items instead of overwriting them

**Checkpoint**: The packaged bundle can materialize a safe repo-local scaffold for later SDD flows.

---

## Phase 4: User Story 3 - Packaging regressions are blocked before release (Priority: P2)

**Goal**: Release verification fails if the publishable package no longer contains or exposes the scaffold required by command discovery and bootstrap.

**Independent Test**: Run the package-focused verification suite and confirm it fails when any required bundled scaffold path is removed.

### Tests for User Story 3

- [ ] T017 [P] [US3] Add a packaging verification test that asserts the publishable scaffold contains command markdown, `.specify` assets, and `AGENTS.md`
- [ ] T018 [P] [US3] Add a regression test that fails when command discovery is attempted against a package-shaped install missing a required bundled command file

### Implementation for User Story 3

- [ ] T019 [US3] Add or update package/build verification hooks so maintainers can validate the bundled scaffold before release
- [ ] T020 [US3] Document the release-time expectation for refreshing or validating the bundled scaffold in the relevant maintainer-facing docs if the workflow requires a sync step

**Checkpoint**: Packaging regressions are caught by automated verification before publish.

---

## Phase 5: Polish & Cross-Cutting Verification

- [ ] T021 Run typecheck for `.opencode/`
- [ ] T022 Run the full `.opencode/` test suite
- [ ] T023 Run the package/bootstrap-focused verification commands from `quickstart.md`
- [ ] T024 Confirm the final packaged flow covers `/sdd-init`, `/sdd`, `/implement`, and supported `speckit.*` commands end to end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies; it establishes the publishable asset source used everywhere else
- **Phase 2**: Depends on Phase 1 because command registration fallback needs the bundled scaffold
- **Phase 3**: Depends on Phase 1 and shares the same bundled scaffold source for bootstrap/init
- **Phase 4**: Depends on Phases 1-3 so tests can validate the final package/install behavior
- **Phase 5**: Depends on all previous phases

### Parallel Opportunities

- T002 and T003 can run in parallel once the bundle directory exists
- T005 and T006 can run in parallel
- T010, T011, and T012 can run in parallel
- T017 and T018 can run in parallel

---

## Notes

- The key architectural change is making the managed scaffold publishable from within the `.opencode/` package boundary
- Repo-local scaffold remains the steady-state source after bootstrap, but packaged fallback is required for first-install discovery
- Non-destructive merge behavior is a hard requirement and must not regress while fixing packaging
