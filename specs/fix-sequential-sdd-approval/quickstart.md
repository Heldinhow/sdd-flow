# Quickstart: Require Sequential Approval Between Spec, Plan, and Tasks

## Goal

Validate that `/sdd` now enforces sequential artifact generation with mandatory approval checkpoints between spec, plan, and tasks.

## Prerequisites

- OpenCode is configured to load the SDD plugin
- The repo is already initialized for SDD workflow use
- A clean or isolated feature workspace is available for guided-flow verification

## Scenario 1: Spec generation stops for approval

1. Start a new `/sdd` planning session for a feature.
2. Let the workflow generate `spec.md`.
3. Observe the next recommendation.

**Expected result**: The workflow asks the user to review and approve `spec.md`; it does not generate planning artifacts yet.

## Scenario 2: Spec approval unlocks planning only

1. In the same session, explicitly approve the generated spec.
2. Continue the `/sdd` flow.
3. Verify `plan.md`, `research.md`, `data-model.md`, and `quickstart.md` are generated.
4. Observe the next recommendation.

**Expected result**: The planning package is generated from `spec.md`, and the workflow stops again waiting for plan approval.

## Scenario 3: Plan approval unlocks tasks only

1. In the same session, explicitly approve the planning package.
2. Continue the `/sdd` flow.
3. Verify `tasks.md` is generated.

**Expected result**: `tasks.md` is generated only after plan approval, using the planning package as its source context.

## Scenario 4: Resume without approval state is conservative

1. Start a session and generate `spec.md` or the planning package.
2. End the session without carrying approval state forward.
3. Resume the workflow later.

**Expected result**: The workflow requests revalidation of the latest completed stage instead of auto-generating the next stage.

## Follow-Up

- After this fix lands, `/sdd` becomes a gated stage-by-stage planning flow rather than a bundled multi-artifact generator
- Future work could persist approvals if resume ergonomics becomes more important than session-only simplicity
