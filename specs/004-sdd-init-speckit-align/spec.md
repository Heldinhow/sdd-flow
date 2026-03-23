# Feature Specification: sdd-init Speckit Alignment

**Feature Branch**: `004-sdd-init-speckit-align`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "preciso remover a criação do agents.md do fluxo do /sdd-init, não acho que faz mais sentido. precisamos garantir o fluxo que é seguido pelo speckit nativamente. outra coisa, precisamos garantir que as pastas sejam praticamente as mesmas. mesma estrutura. se tiver algo fora do padrao do speckit, precisamos saber e ajustar."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove AGENTS.md From Init Bootstrap (Priority: P1)

A developer runs `/sdd-init` on a repository and the bootstrap does **not** create or
manage `AGENTS.md`. The init process completes successfully with only speckit-aligned
scaffold assets installed.

**Why this priority**: AGENTS.md is the most concrete and immediately confusing
deviation. Removing it is a clear, self-contained change with no ambiguity about
desired outcome. It unblocks the structural alignment work.

**Independent Test**: Run `/sdd-init` on a clean repository. Verify no `AGENTS.md`
is created or referenced in the init output. Confirm the init summary shows no GUIDE
asset group.

**Acceptance Scenarios**:

1. **Given** a repository with no `AGENTS.md`, **When** `/sdd-init` runs,
   **Then** no `AGENTS.md` is created and no init step references it.
2. **Given** a repository that already has a custom `AGENTS.md`, **When** `/sdd-init`
   runs, **Then** the existing file is left completely untouched (no REVIEW prompt, no
   diff, no mention in the summary).
3. **Given** the managed-assets bundle, **When** it is inspected, **Then** `AGENTS.md`
   does not appear in the asset list or classification output.

---

### User Story 2 - Align Managed-Asset Folder Structure With Speckit Standard (Priority: P2)

A developer inspects the files that `/sdd-init` installs and finds the folder layout
exactly matches what native speckit expects, with no extra top-level directories or
files outside the speckit standard.

**Why this priority**: Structural alignment ensures that the `sdd-flow` plugin is a
natural extension of speckit rather than a parallel system, reducing confusion for
teams already familiar with speckit.

**Independent Test**: Compare the file tree installed by `/sdd-init` against the
speckit reference structure. Every installed path falls within `.specify/`, `.opencode/`,
or `specs/`. No extra root-level files appear.

**Acceptance Scenarios**:

1. **Given** the managed-assets bundle, **When** listed, **Then** all paths are under
   `.specify/`, `.opencode/`, or `specs/` with no root-level files outside those
   directories.
2. **Given** the `.specify/` subtree, **When** compared to speckit's standard layout,
   **Then** `templates/`, `scripts/bash/`, and `memory/` are present and no extra
   subdirectories exist beyond those speckit defines.
3. **Given** a repository after `/sdd-init`, **When** the developer runs any native
   `speckit.*` command (e.g., `/speckit.specify`), **Then** it works without errors
   referencing missing files or unexpected paths.

---

### User Story 3 - Audit and Document All Remaining Deviations (Priority: P3)

After removal of AGENTS.md and folder alignment, all remaining intentional deviations
from speckit's native flow are documented in one place so the team can make conscious
decisions about each one.

**Why this priority**: Some deviations (like the agent orchestration layer) are
intentional product decisions, not bugs. Documenting them separately prevents
unnecessary churn while surfacing any unintentional drift.

**Independent Test**: A deviation audit document exists in the feature workspace
listing every identified deviation with a status of KEEP, REMOVE, or REVIEW.

**Acceptance Scenarios**:

1. **Given** the audit document, **When** read, **Then** every deviation is classified
   as KEEP (intentional, by design), REMOVE (to be eliminated), or REVIEW (needs decision).
2. **Given** any deviation marked REMOVE, **When** this feature is implemented,
   **Then** the deviation has been eliminated or a follow-up spec exists for it.
3. **Given** any deviation marked KEEP, **When** read, **Then** the rationale explains
   why it is intentionally different from speckit.

---

### Edge Cases

- What if the target repository already uses `AGENTS.md` for a different purpose (e.g., GitHub Copilot agent instructions)? — Since we are removing AGENTS.md from init entirely, the existing file is never touched. No action needed.
- What happens to existing repositories that already had `AGENTS.md` installed by a prior version of `/sdd-init`? — Those files remain in place; sdd-flow stops managing them going forward. No migration step is required.
- What if a future asset or command still imports or references AGENTS.md by name? — Any such reference must be updated as part of this feature. The audit (US3) should catch residual references.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `/sdd-init` command MUST NOT create, update, or prompt for review of
  `AGENTS.md` during repository bootstrap.
- **FR-002**: The managed-assets classification MUST NOT include `AGENTS.md` as a
  managed asset of any group (GUIDE, CORE, or otherwise).
- **FR-003**: The repo-state detection logic MUST NOT check for the presence of
  `AGENTS.md` (no `hasAgentsFile` flag or equivalent).
- **FR-004**: The `Spec Driven` agent plugin MUST NOT reference `AGENTS.md` in its
  initialization messaging or context injection.
- **FR-005**: The `.specify/` folder layout installed by `/sdd-init` MUST match the
  speckit standard: `templates/`, `scripts/bash/`, and `memory/` only — no extra
  subdirectories.
- **FR-006**: All managed assets MUST reside under `.specify/`, `.opencode/`, or
  `specs/` — no root-level files installed by `/sdd-init` outside those paths.
- **FR-007**: All native `speckit.*` commands (specify, clarify, plan, tasks, implement,
  constitution, analyze, checklist, taskstoissues) MUST remain functional after these
  changes.
- **FR-008**: A deviation audit document MUST be produced listing every identified
  sdd-flow vs speckit structural difference, each classified as KEEP, REMOVE, or REVIEW.

### Key Entities

- **Managed Asset**: A file that `/sdd-init` installs or merges into a target
  repository, classified as ADD, KEEP, or REVIEW during bootstrap.
- **Asset Group**: A logical grouping of managed assets (currently CORE and GUIDE).
  The GUIDE group is eliminated by this feature if AGENTS.md is its only member.
- **Deviation**: Any intentional or unintentional difference between sdd-flow's
  installed structure/workflow and the native speckit standard.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After running `/sdd-init` on a clean repository, zero new root-level
  files exist outside `.specify/`, `.opencode/`, and `specs/`.
- **SC-002**: `AGENTS.md` does not appear anywhere in the init output, asset manifest,
  managed-assets bundle, or plugin runtime code.
- **SC-003**: All speckit compatibility commands (`speckit.*`) complete without error
  after the structural changes are applied.
- **SC-004**: The deviation audit document covers 100% of the structural differences
  identified during research, with each one explicitly classified as KEEP, REMOVE,
  or REVIEW.
- **SC-005**: No references to `AGENTS.md` remain in any plugin runtime file, init
  script, command definition, or managed-assets bundle after implementation.
