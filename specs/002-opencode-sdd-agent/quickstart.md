# Quickstart: Unified SDD Agent for OpenCode

## Goal

Validate that a repository can be initialized for the unified SDD workflow and that the planning phase produces the expected artifact package without requiring manual phase switching.

## Prerequisites

- OpenCode is available in the target repository.
- The repository contains the managed `.opencode` and `.specify` asset sets after initialization.
- The feature specification already exists at `specs/002-opencode-sdd-agent/spec.md`.

## Scenario 1: Initialize a Repository

1. Open the target repository in OpenCode.
2. Start `/sdd` in repository-init mode.
3. Confirm that the repository receives the managed `.opencode` command assets and `.specify` planning assets.
4. If the repository already contained compatible managed files, confirm that the initialization keeps those customizations intact instead of replacing them destructively.
5. Confirm that the workflow exposes one clear primary entrypoint for guided SDD.

**Expected result**: The repository is ready for guided planning, the managed assets are installed or merged safely, and the user can proceed without manually assembling prompts or scripts.

## Scenario 2: Run the Planning Phase from One Guided Flow

1. Start `/sdd` with a new feature request.
2. Confirm that the workflow recommends a branch prefix and short name before feature context is finalized.
3. Answer clarification questions if any high-impact ambiguity is detected.
4. Continue through the planning flow until the planning package is generated.
5. Verify that the active feature workspace contains `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and the contract documents relevant to the feature.

**Expected result**: The user reaches a complete planning package from one guided interaction, with no need to manually invoke separate phase commands.

## Scenario 3: Resume an Existing Feature Workspace

1. Re-open a repository that already contains a partially completed feature workspace.
2. Start `/sdd` again.
3. Confirm that the workflow detects the existing planning state and resumes from the next missing or outdated phase.
4. Verify that existing valid artifacts remain intact while only the needed planning outputs are updated.

**Expected result**: The workflow resumes from repository state instead of restarting from scratch.

## Follow-Up

After the planning package is validated, proceed to `/speckit.tasks` or continue through `/sdd` to produce `tasks.md` for the active feature workspace.
