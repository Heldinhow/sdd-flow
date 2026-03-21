# Contract: Unified SDD Workflow

## Purpose

Define the guided planning behavior for the single-entry OpenCode SDD flow exposed through `/sdd`.

## Phases

| Phase | Required behavior | Output |
|-------|-------------------|--------|
| Start or resume | Detect whether the user is starting a new feature or resuming an existing one | Active feature context |
| Branch recommendation | Recommend a conventional English change-type prefix and short name before the feature context is finalized | Proposed branch name |
| Specify | Capture the feature request and produce or update `spec.md` | Feature specification |
| Clarify | Ask focused sequential questions only for high-impact ambiguity and integrate accepted answers into the right artifact | Updated planning context |
| Plan | Produce `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and relevant contract documents | Planning package |
| Handoff | Recommend the next action, typically task generation | Clear next-step recommendation |

## Inputs and Outputs

| Input | Description |
|-------|-------------|
| Feature request | User goal expressed in natural language |
| Existing repository state | Current managed assets and feature workspaces |
| Clarification answers | Accepted user choices that affect scope, behavior, or validation |

| Output | Description |
|--------|-------------|
| Feature workspace | Canonical location for all planning artifacts |
| Planning artifacts | Markdown outputs that stay traceable to the feature request and clarification answers |
| Next recommendation | Suggested follow-up phase or command |

## Behavioral Guarantees

- The workflow remains centered on `/sdd` as the primary OpenCode entrypoint, with `speckit.*` commands acting as compatibility wrappers.
- The agent stays in planning scope and limits its authored outputs to markdown artifacts.
- Clarification is only triggered for high-impact ambiguity.
- Accepted clarification answers are reflected in the appropriate artifact without leaving contradictory wording behind.
- The workflow preserves compatibility with the existing planning artifact set and repository layout.

## Failure Handling

| Condition | Expected handling |
|-----------|-------------------|
| Missing managed workflow assets | Pause the guided flow and direct the user to repository initialization or repair |
| Ambiguous feature state | Recommend the best matching active feature workspace and surface the ambiguity clearly |
| Planning artifact missing or outdated | Regenerate or update only the affected artifact while preserving the rest of the feature workspace |
