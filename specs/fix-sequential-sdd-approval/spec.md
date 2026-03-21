# Spec: Require Sequential Approval Between Spec, Plan, and Tasks

**Feature Branch**: `fix-sequential-sdd-approval`  
**Created**: 2026-03-21  
**Status**: Draft  
**Input**: User description: "faça um ajuste, na etapa de spec, plan e tasks devem ser executadas na sequência, ou seja, um arquivo deve ser usado como referencia para gerar o proximo. o comportamento visto tem sido fazer tudo meio que junto. acho que faz sentido abrir a possibilidade para validar cada etapa junto ao usuário." with clarifications: approval is `obrigatório` and approval tracking uses option `A` (session-controlled approval)

> Primary guided workflow: `/sdd` (with `speckit.*` compatibility wrappers)

## Problem

The current `/sdd` workflow describes a logical order of `spec -> plan -> tasks`, but in practice the experience still feels too eager and bundled together. The workflow can progress based mostly on artifact existence, which makes it easier for planning stages to blur together instead of clearly using one artifact as the approved input for the next stage.

That weakens user review, makes the generated plan feel less deliberate, and makes `tasks.md` look auto-produced from incomplete or unvalidated planning context. The user wants each stage to stop, be reviewed, and only then unlock the next stage.

## Goal

Make the guided SDD flow strictly sequential so `spec.md`, `plan.md`, and `tasks.md` are generated in order, with mandatory user approval checkpoints between `spec -> plan` and `plan -> tasks` within the active session.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Spec approval gates planning (Priority: P1)

A user starts `/sdd` for a new feature and wants the workflow to stop after `spec.md` so they can validate the specification before any planning package is generated.

**Why this priority**: This is the first required gate and fixes the main complaint that spec and plan currently feel blended together.

**Independent Test**: Start a guided planning session, let `/sdd` produce `spec.md`, and verify the workflow recommends spec review/approval instead of generating `plan.md` immediately.

**Acceptance Scenarios**:

1. **Given** a new feature workspace with no artifacts, **When** `/sdd` completes the specify step, **Then** `spec.md` is generated and the workflow stops to request explicit user approval before planning
2. **Given** `spec.md` exists but the current session has no recorded spec approval, **When** `/sdd` runs again, **Then** it recommends reviewing and approving the spec instead of generating `plan.md`
3. **Given** the user explicitly approves the spec in the active session, **When** `/sdd` continues, **Then** the planning package is generated using `spec.md` as the input reference

---

### User Story 2 - Plan approval gates task generation (Priority: P1)

A user reviews the planning package and wants `tasks.md` to be generated only after they have explicitly approved the plan stage.

**Why this priority**: The plan-to-tasks boundary is where downstream execution quality is decided, so it must be gated just as strongly as the spec-to-plan boundary.

**Independent Test**: Generate `plan.md`, `research.md`, `data-model.md`, and `quickstart.md`, then verify `/sdd` requests plan approval and does not generate `tasks.md` until approval is recorded in the current session.

**Acceptance Scenarios**:

1. **Given** the planning package exists and no plan approval is recorded in the current session, **When** `/sdd` runs, **Then** it recommends reviewing and approving the plan stage instead of generating `tasks.md`
2. **Given** the user approves the plan stage in the active session, **When** `/sdd` continues, **Then** `tasks.md` is generated using `plan.md` and the planning artifacts as its source inputs
3. **Given** `tasks.md` has not been generated yet, **When** the plan stage has not been approved, **Then** the workflow must not auto-progress to tasks based only on file existence

---

### User Story 3 - Resume flow stays conservative without approval state (Priority: P2)

A user resumes planning in a later interaction and needs the workflow to behave safely when the session cannot prove prior approvals.

**Why this priority**: Session-based approvals are simpler to implement, but they require clear fallback behavior so resume does not silently skip review gates.

**Independent Test**: Create a workspace with `spec.md` or the planning package present, clear session approval state, and verify the workflow asks for revalidation instead of jumping ahead.

**Acceptance Scenarios**:

1. **Given** `spec.md` exists from a previous session and no approval state is available now, **When** the workflow resumes, **Then** it asks for spec approval again before planning
2. **Given** `plan.md`, `research.md`, `data-model.md`, and `quickstart.md` exist from a previous session and no approval state is available now, **When** the workflow resumes, **Then** it asks for plan approval again before tasks
3. **Given** the user wants to continue a partially completed workspace, **When** session approval state is missing, **Then** the workflow favors revalidation over automatic progression

---

### Edge Cases

- The user edits `spec.md` after first approval in the same session; the workflow should treat that as requiring renewed review before planning continues
- The user edits `plan.md` or derived planning artifacts after plan approval in the same session; the workflow should require renewed review before generating tasks
- The workflow resumes in a later interaction where the files exist but the in-session approval state does not
- The user explicitly asks to inspect current state rather than continue; the workflow should report the pending approval gate clearly
- Clarification loops must still complete before an approval gate is considered satisfied for the current stage

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `/sdd` workflow MUST treat `spec.md`, `plan.md`, and `tasks.md` as sequential outputs where each stage depends on the approved output of the prior stage
- **FR-002**: The workflow MUST stop after generating `spec.md` and require explicit user approval before generating `plan.md` or any derived planning artifacts
- **FR-003**: The workflow MUST generate `plan.md`, `research.md`, `data-model.md`, and `quickstart.md` only after `spec.md` has been approved in the active session
- **FR-004**: The workflow MUST stop after generating the planning package and require explicit user approval before generating `tasks.md`
- **FR-005**: The workflow MUST generate `tasks.md` only after the plan stage has been approved in the active session and must use `plan.md` plus supporting planning artifacts as inputs
- **FR-006**: Resume behavior MUST not infer stage approval only from artifact existence; when current-session approval state is absent, the workflow MUST request revalidation of the latest completed stage
- **FR-007**: The next-step recommendation returned by the workflow MUST clearly indicate whether the user needs to review/approve spec, review/approve plan, or proceed to the next artifact-generation stage
- **FR-008**: Clarification handling MUST remain sequential and MUST complete before a stage can be considered ready for approval
- **FR-009**: The updated workflow contract and command guidance MUST explicitly describe the mandatory approval gates between `spec -> plan` and `plan -> tasks`

### Key Entities

- **Session Approval State**: In-memory workflow state that records whether the current session has explicitly approved the spec stage and the plan stage
- **Specification Stage**: The phase that produces `spec.md` and must be reviewed before any planning package is generated
- **Planning Stage**: The phase that produces `plan.md`, `research.md`, `data-model.md`, and `quickstart.md`, and must be reviewed before tasks are generated
- **Task Preparation Stage**: The phase that produces `tasks.md` from the approved planning package

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a guided planning session, `plan.md` is never generated before `spec.md` exists and receives explicit approval in that same session
- **SC-002**: In a guided planning session, `tasks.md` is never generated before the planning package exists and receives explicit approval in that same session
- **SC-003**: Resume-flow tests prove that artifact existence alone does not auto-advance the workflow past a required approval gate
- **SC-004**: Workflow messaging consistently tells the user which stage is waiting for approval and what explicit action is needed to continue
