# Contract: Repository Initialization

## Purpose

Define the user-visible behavior of repository initialization for the unified SDD workflow.

## Inputs

| Field | Description |
|-------|-------------|
| Repository state | Whether `.opencode`, `.specify`, `specs/`, and agent guidance files already exist |
| Invocation mode | First-time install or upgrade/merge into an existing repository |
| User intent | Whether the user wants to initialize, repair, or upgrade the managed workflow assets |

## Required Behavior

| Requirement | Contract |
|-------------|----------|
| Managed asset install | The workflow installs the required `.opencode` and `.specify` asset sets when missing |
| Merge policy | Existing managed assets are merged non-destructively and compatible customizations are preserved |
| Primary entrypoint | The repository exposes `/sdd` as the primary guided SDD entrypoint for OpenCode users |
| Compatibility | Existing phase-based compatibility commands remain available unless explicitly retired |
| Next step | The user receives a clear recommendation for how to begin the guided planning flow |

## Outputs

| Output | Description |
|--------|-------------|
| Repository setup state | Repository is marked ready for guided SDD use |
| Managed workflow assets | Required prompts, templates, scripts, and guidance files are present |
| Agent guidance | Repo-local `AGENTS.md` exists or is updated with the current planning stack |

## Error Conditions

| Condition | Expected handling |
|-----------|-------------------|
| Repository is not writable | Stop initialization and explain what blocked setup |
| Managed asset conflict cannot be safely merged | Stop destructive changes, preserve existing files, and ask the user to resolve the conflict deliberately |
| Required managed assets are incomplete after merge | Report the missing asset set and keep the next-step recommendation blocked until setup is repaired |
