---
description: Initialize SDD workflow in a repository — creates all required directories, files, templates, and constitution interactively. Must be run before Spec Driven agent can be used.
handoffs:
  - label: Initialize Repository
    agent: build
    prompt: |
      Initialize SDD workflow in this repository. Follow the mandatory checklist below to create all required directories, files, and constitution.
---

## User Input

```text
$ARGUMENTS
```

## Pre-Execution Checks

**Check for extension hooks (before SDD init)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_sdd_init` key
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

    Wait for the result of the hook command before proceeding.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

You are initializing the SDD (Spec-Driven Development) workflow in this repository. This creates all required directory structure, template files, shell scripts, and constitution.

**IMPORTANT**: This command MUST be executed by the BUILD agent (not Spec Driven) because it requires full file system and edit permissions. The `build` agent is the available execution agent in this environment.

## MANDATORY CHECKLIST

You MUST complete ALL items in this checklist. Do not skip any phase.

---

### Phase 1: Directory Structure Creation

Create the following directories:

- [ ] 1.1 Create `.specify/` directory
- [ ] 1.2 Create `.specify/scripts/` directory
- [ ] 1.3 Create `.specify/scripts/bash/` directory
- [ ] 1.4 Create `.specify/templates/` directory
- [ ] 1.5 Create `.specify/memory/` directory
- [ ] 1.6 Create `.opencode/` directory
- [ ] 1.7 Create `.opencode/command/` directory
- [ ] 1.8 Create `.opencode/plugin/` directory
- [ ] 1.9 Create `.opencode/src/` directory
- [ ] 1.10 Create `specs/` directory

---

### Phase 2: Template Files

Copy/create template files in `.specify/templates/`:

- [ ] 2.1 Create `agent-file-template.md` (agent file template)
- [ ] 2.2 Create `checklist-template.md` (checklist template)
- [ ] 2.3 Create `constitution-template.md` (constitution template with placeholders)
- [ ] 2.4 Create `plan-template.md` (plan template)
- [ ] 2.5 Create `spec-template.md` (spec template)
- [ ] 2.6 Create `tasks-template.md` (tasks template)

**Template Content Guidelines**:
- `agent-file-template.md`: Template for agent-specific files
- `checklist-template.md`: Template for task checklists
- `constitution-template.md`: Must include `[PROJECT_NAME]`, `[PRINCIPLE_X_NAME]`, `[PRINCIPLE_X_DESCRIPTION]`, `[SECTION_X_NAME]`, `[SECTION_X_CONTENT]`, `[GOVERNANCE_RULES]`, `[CONSTITUTION_VERSION]`, `[RATIFICATION_DATE]`, `[LAST_AMENDED_DATE]` placeholders
- `plan-template.md`: Implementation plan structure
- `spec-template.md`: Feature specification structure
- `tasks-template.md`: Task breakdown structure

---

### Phase 3: Shell Scripts

Copy/create shell scripts in `.specify/scripts/bash/`:

- [ ] 3.1 Create `common.sh` (shared shell functions)
- [ ] 3.2 Create `check-prerequisites.sh` (prerequisite checking)
- [ ] 3.3 Create `create-new-feature.sh` (feature workspace creation)
- [ ] 3.4 Create `setup-plan.sh` (planning setup)
- [ ] 3.5 Create `update-agent-context.sh` (agent context update)

**Script Requirements**:
- All scripts must be executable (`chmod +x`)
- Scripts must be POSIX-compatible (bash/dash)
- `check-prerequisites.sh` must support `--json --paths-only` flags
- `create-new-feature.sh` must support `--type` and `--short-name` flags
- `setup-plan.sh` must support `--json` flag

---

### Phase 4: OpenCode Integration

Create OpenCode configuration files:

- [ ] 4.1 Create `AGENTS.md` in repository root with development guidelines
- [ ] 4.2 Ensure `.opencode/command/` has existing commands or create placeholder
- [ ] 4.3 Create `.opencode/plugin/index.ts` or ensure exists
- [ ] 4.4 Create `.opencode/tsconfig.json` if TypeScript files present
- [ ] 4.5 Create `.opencode/package.json` if needed

**AGENTS.md Requirements**:
- Must include: Active technologies, Build/test commands, Project layout
- Must include: TypeScript conventions, Plugin architecture, Testing conventions
- Must include: Git branch naming conventions, SDD workflow commands

---

### Phase 5: Constitution Creation (Interactive)

This phase collects values for the constitution interactively.

**Steps**:
- [ ] 5.1 Load template from `.specify/templates/constitution-template.md`
- [ ] 5.2 Ask user for `PROJECT_NAME` (e.g., "MyProject Constitution")
- [ ] 5.3 Ask user for `PRINCIPLE_1_NAME` and `PRINCIPLE_1_DESCRIPTION`
- [ ] 5.4 Ask user for `PRINCIPLE_2_NAME` and `PRINCIPLE_2_DESCRIPTION`
- [ ] 5.5 Ask user for `PRINCIPLE_3_NAME` and `PRINCIPLE_3_DESCRIPTION`
- [ ] 5.6 Ask user for `SECTION_2_NAME` and `SECTION_2_CONTENT` (or skip if not needed)
- [ ] 5.7 Ask user for `SECTION_3_NAME` and `SECTION_3_CONTENT` (or skip if not needed)
- [ ] 5.8 Ask user for `GOVERNANCE_RULES`
- [ ] 5.9 Set `CONSTITUTION_VERSION` to "1.0.0" (initial version)
- [ ] 5.10 Set `RATIFICATION_DATE` to today's date (YYYY-MM-DD format)
- [ ] 5.11 Set `LAST_AMENDED_DATE` to today's date (YYYY-MM-DD format)
- [ ] 5.12 Write filled constitution to `.specify/memory/constitution.md`
- [ ] 5.13 Verify NO `[BRACKETED_TOKENS]` remain in the constitution

---

### Phase 6: Verification

Verify all created items:

- [ ] 6.1 Verify `.specify/` directory exists
- [ ] 6.2 Verify `.specify/scripts/bash/` contains all 5 shell scripts
- [ ] 6.3 Verify `.specify/templates/` contains all 6 template files
- [ ] 6.4 Verify `.specify/memory/constitution.md` exists with no placeholders
- [ ] 6.5 Verify `.opencode/` directory exists
- [ ] 6.6 Verify `specs/` directory exists
- [ ] 6.7 Verify `AGENTS.md` exists in repository root
- [ ] 6.8 Verify all shell scripts are executable

---

## Completion Report

After ALL checklist items are complete, output:

```markdown
## SDD Initialization Complete

### Directories Created
- `.specify/` - SDD workflow root
- `.specify/scripts/bash/` - Shell scripts
- `.specify/templates/` - Template files
- `.specify/memory/` - Constitution storage
- `.opencode/` - OpenCode configuration
- `specs/` - Feature workspaces

### Files Created
- 5 shell scripts in `.specify/scripts/bash/`
- 6 template files in `.specify/templates/`
- `AGENTS.md` - Development guidelines
- `.specify/memory/constitution.md` - Project constitution

### Next Steps

1. **Switch back to Spec Driven agent** to start planning features
2. Run `/sdd` to begin feature specification and planning
3. After planning complete, run `/implement` to execute implementation

Your repository is now initialized for SDD workflow.
```

## Error Handling

- If any directory creation fails, report the error and stop
- If constitution creation is interrupted, allow resuming from last completed step
- If existing files are found, preserve them (non-destructive merge)
- If permission errors occur, inform user and suggest checking agent permissions

## After SDD Init Completes

Check for extension hooks under `hooks.after_sdd_init` in `.specify/extensions.yml` (if present) and execute any mandatory hooks before returning control to the user.