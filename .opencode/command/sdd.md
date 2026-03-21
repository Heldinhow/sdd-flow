---
description: Unified SDD workflow entrypoint — guides users through specification, clarification, planning, and automatic task preparation from a single OpenCode command. Handles repository initialization, new feature planning, and resume-from-state scenarios. Tasks are generated automatically once planning artifacts are complete.
handoffs:
  - label: Run Task Generation
    agent: speckit.tasks
    prompt: Generate task breakdown for the current feature workspace. Context: feature planning is complete and tasks.md needs to be produced. Only invoke this after confirming that spec.md, plan.md, research.md, data-model.md, and quickstart.md are all present and complete.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before SDD workflow)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_sdd` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the SDD workflow.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

This command is the single entrypoint for the guided SDD workflow. It handles three scenarios:

1. **Repository initialization** — when `.opencode` or `.specify` assets are missing or need merging
2. **New feature planning** — when a user wants to plan a new feature from scratch
3. **Resume planning** — when a user returns to a feature workspace that already has partial artifacts

### Step 1: Detect repository state

Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from the repository root to determine:
- Whether `.opencode` and `.specify` managed assets are present
- Whether an active feature workspace exists
- What phase the active workspace is in

Parse the JSON output to determine the next recommended action.

### Step 2: Route by detected state

**IMPORTANT — Session-scoped workspace rule**: Every new Spec Driven session starts a new feature workspace by default. Do NOT reuse an existing workspace just because one is present. Resume is only for explicit user requests.

**If the repository is not initialized** (managed assets missing or incomplete):
- Route to **repository initialization flow**
- Offer to install or merge the managed workflow assets non-destructively
- After init completes, recommend starting the planning flow

**If the user explicitly asks to resume a named feature workspace**:
- Route to **resume flow**
- Detect the current phase from artifact presence
- Recommend the next logical phase

**In all other cases** (including when an active workspace already exists):
- Route to **new feature planning flow**
- Recommend a branch prefix and short name
- Guide through specify → clarify → plan → tasks (tasks generated automatically, no manual command needed)
- A new session means a new workspace — do not enter resume mode automatically

### Step 3: Repository Initialization Flow (when needed)

When the user invokes `/sdd init` or the system detects uninitialized repository state:

1. **Detect current state**: Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` to determine what managed assets are present or missing
2. **Plan the merge**: Use the non-destructive merge strategy:
   - Identify which managed asset files are present
   - Identify which are missing or stale
   - Preserve any existing compatible customizations
   - Do NOT overwrite files with newer managed versions without user consent
3. **Execute the merge**: Copy or merge the managed assets into the repository
4. **Report**: Show what was installed/merged and confirm the workflow is ready
5. **Recommend next step**: Direct the user to start the planning flow with `/sdd`

**Key rules for initialization**:
- Always preserve user-managed customizations in `.specify/` and `.opencode/`
- Only install missing managed files; do not replace existing ones unless the user explicitly approves
- `AGENTS.md` is the primary development guidelines; constitution (`.specify/memory/constitution.md`) is only created explicitly via `/speckit.constitution`
- Ensure `AGENTS.md` is created or updated with the current planning stack
- Expose one clear user-facing entrypoint through the `Spec Driven` agent while keeping `/sdd` as the guided workflow backend

### Step 4: New Feature Planning Flow

When the user provides a new feature request:

1. **Suggest branch prefix and short name**:
   - Infer the best prefix from the feature intent:
     - `feat` — new capability or behavior
     - `fix` — bug fix or correctness repair
     - `refactor` — internal restructure, no behavior change
     - `init` — first-time setup or bootstrap
     - `test` — tests-first or test-only work
   - Generate a 2-4 word short name in kebab-case
   - Format: `<prefix>-<short-name>` (e.g., `feat-opencode-sdd-agent`)
   - Ask the user to confirm or adjust before proceeding

2. **Run `.specify/scripts/bash/create-new-feature.sh`** with the confirmed prefix and short name to create the feature workspace

3. **Guided specify**: Create or update `spec.md` in the feature workspace:
   - Extract actors, actions, data, and constraints from the feature request
   - Generate user stories with clear acceptance scenarios
   - Identify edge cases and success criteria
   - When ambiguous: ask focused clarification questions sequentially, recommend answers, record accepted responses

4. **Guided plan**: After spec is approved:
   - Run `.specify/scripts/bash/setup-plan.sh --json` to prepare the planning package
   - Generate `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and any relevant markdown contracts inside the feature workspace
   - Fill Technical Context, Constitution Check, Project Structure, and Complexity Tracking

5. **Guided task preparation**: After planning is complete:
   - Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` to verify readiness
   - The workflow automatically generates `tasks.md` using the planning artifacts once they are complete
   - Do NOT ask the user to run a separate task-generation command

6. **Present next step**: Always end with a clear, specific recommendation for what to do next

### Step 5: Resume Flow

When the user returns to a feature workspace that already has partial artifacts:

1. **Detect active workspace**: Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` to find the current feature workspace
2. **Evaluate artifact state**: Check which artifacts exist and are current:
   - `spec.md` only → recommend starting planning
   - `spec.md` + `plan.md` → automatically generate tasks (no manual command needed)
   - Partial artifacts → recommend resuming from the missing/outdated one
3. **Resume from correct phase**: Do not recreate existing valid artifacts
4. **Report state**: Clearly show what exists, what is missing, and what will be produced next
5. **Present next step**: Recommend the specific next action

### Key Behavioral Rules

- **Slash commands execute first**: When user input starts with `/`, treat it as a registered command invocation before any other interpretation. Do not re-read the command file or explain the command.
- **User-facing entrypoint**: `Spec Driven` is the primary OpenCode agent for this workflow; `/sdd` is the repo-local backend it relies on.
- **Plan mode only**: This command produces planning artifacts (markdown files). It does not generate source code.
- **Markdown-only outputs**: All artifacts created by this workflow are markdown files in the feature workspace.
- **Managed init backend**: If non-markdown workflow assets must be installed, do that through the managed repository-init backend rather than by agent-authored code generation.
- **Sequential clarification**: Ask one question at a time. Recommend the best answer. Record accepted answers in the relevant artifact.
- **No destructive operations**: Never overwrite existing user-managed files without explicit user consent.
- **Traceability**: Every artifact update must preserve the link back to the original feature request and any clarification answers.
- **Non-interactive detection**: When `sdd` is invoked with explicit arguments, use those directly without prompting for missing information.
- **Automatic task generation**: After `spec.md`, `plan.md`, `research.md`, `data-model.md`, and `quickstart.md` are complete, the workflow automatically generates `tasks.md` without requiring the user to run a separate command.

### After SDD workflow completes

Check for extension hooks under `hooks.after_sdd` in `.specify/extensions.yml` (if present) and execute any mandatory hooks before returning control to the user.

Context for SDD workflow: $ARGUMENTS
