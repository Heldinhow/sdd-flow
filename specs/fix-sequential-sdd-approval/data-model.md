# Data Model: Require Sequential Approval Between Spec, Plan, and Tasks

**Feature Branch**: `fix-sequential-sdd-approval`
**Date**: 2026-03-21

## Status: Workflow-state model only

This change does not introduce application entities or persistence schemas. It extends the workflow state model used by the guided SDD flow.

## Workflow Entities

### Specification Stage

- **Output**: `spec.md`
- **Approval requirement**: Must be explicitly approved in the current session before planning can begin
- **Key rule**: Artifact existence alone is not enough to unlock planning

### Planning Stage

- **Outputs**: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`
- **Approval requirement**: Must be explicitly approved in the current session before task generation can begin
- **Key rule**: The planning package is treated as one reviewable unit for progression purposes

### Task Preparation Stage

- **Output**: `tasks.md`
- **Input dependency**: Requires approved planning-stage artifacts
- **Key rule**: Must not auto-generate only because plan files exist

### Session Approval State

- **Purpose**: Tracks whether the current session has approved the specification stage and the planning stage
- **Fields**:
  - `specApproved: boolean`
  - `planApproved: boolean`
- **Key rule**: Missing session approval state forces conservative resume behavior

## Relationships

- The **Specification Stage** feeds the **Planning Stage**
- The **Planning Stage** feeds the **Task Preparation Stage**
- The **Session Approval State** gates transitions between the stages

## Invariants

- `plan.md` must never be generated before `spec.md` is approved in the current session
- `tasks.md` must never be generated before the planning package is approved in the current session
- Resume logic must favor revalidation over auto-progression when approval state is unavailable
