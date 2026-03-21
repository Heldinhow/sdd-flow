---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md. Switches to build agent for code execution. When invoked, this command loads the active feature workspace, locates tasks.md, and begins implementation — it does NOT explain the command markdown file.
agent: build
handoffs:
  - label: Implement Tasks
    agent: build
    prompt: |
      Execute the implementation plan for this feature workspace.
      Follow the implementation flow from /speckit.implement...
scripts:
  sh: .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
---

## Execution Posture

When `/implement` is invoked, the system enters **implementation mode** — not documentation or explanation mode.

**Expected behavior** (correct):
- Detect the active feature workspace by running the prerequisite check script
- Load `tasks.md` and supporting planning artifacts
- Report execution progress or state a concrete blocker

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before implementation)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_implement` key
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

    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

Execute the implementation plan by processing and executing all tasks defined in tasks.md.

**IMPORTANT**: This command switches to the BUILD agent (with full edit/bash permissions) for code execution. The `build` agent is the available execution agent in this environment.

---

### Step 1: Detect Active Feature Workspace

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse:
- `FEATURE_DIR` - The active feature workspace directory
- `AVAILABLE_DOCS` - List of available planning artifacts

If `FEATURE_DIR` is empty or `tasks.md` does not exist:

```markdown
## Error: No Active Feature Workspace

No active feature workspace found with tasks.md.

**To fix this:**
1. Switch to Spec Driven agent
2. Run `/sdd` to plan a feature and create tasks.md
3. Then run `/implement` to execute the implementation

Current state: tasks.md not found in any feature workspace.
```

---

### Step 2: Load Planning Artifacts

Load ALL available planning artifacts to provide full context for implementation:

**REQUIRED - Always Load**:
- [ ] **tasks.md** - Task breakdown and execution plan
- [ ] **plan.md** - Technical implementation plan (tech stack, architecture, file structure)

**IF EXISTS - Load When Available**:
- [ ] **research.md** - Technical decisions, constraints, and research findings
- [ ] **quickstart.md** - Usage patterns, integration examples, and quick reference
- [ ] **data-model.md** - Entity definitions, relationships, and data structures (if feature has data entities)

**Create Status Table**:

```markdown
## Planning Artifacts Loaded

| Artifact | Status | Path |
|----------|--------|------|
| tasks.md | ✅ Found | {FEATURE_DIR}/tasks.md |
| plan.md | ✅ Found | {FEATURE_DIR}/plan.md |
| research.md | {FOUND/NOT_FOUND} | {FEATURE_DIR}/research.md |
| quickstart.md | {FOUND/NOT_FOUND} | {FEATURE_DIR}/quickstart.md |
| data-model.md | {FOUND/NOT_FOUND} | {FEATURE_DIR}/data-model.md |
```

---

### Step 3: Checklists Status (if checklists/ exists)

If `FEATURE_DIR/checklists/` exists:

- Scan all checklist files in the checklists/ directory
- For each checklist, count:
  - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
  - Completed items: Lines matching `- [X]` or `- [x]`
  - Incomplete items: Lines matching `- [ ]`
- Create a status table:

```text
| Checklist | Total | Completed | Incomplete | Status |
|-----------|-------|-----------|------------|--------|
| ux.md     | 12    | 12        | 0          | ✓ PASS |
| test.md   | 8     | 5         | 3          | ✗ FAIL |
| security.md | 6   | 6         | 0          | ✓ PASS |
```

- Calculate overall status:
  - **PASS**: All checklists have 0 incomplete items
  - **FAIL**: One or more checklists have incomplete items

- **If any checklist is incomplete**:
  - Display the table with incomplete item counts
  - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
  - Wait for user response before continuing
  - If user says "no" or "wait" or "stop", halt execution
  - If user says "yes" or "proceed" or "continue", proceed to step 4

- **If all checklists are complete**:
  - Display the table showing all checklists passed
  - Automatically proceed to step 4

---

### Step 4: Project Setup Verification

**Create/verify ignore files based on actual project setup**:

**Detection & Creation Logic**:
- Check if the repository is a git repo:
  ```sh
  git rev-parse --git-dir 2>/dev/null
  ```
- If git repo exists → create/verify .gitignore
- Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
- Check if .eslintrc* exists → create/verify .eslintignore
- Check if eslint.config.* exists → ensure the config's `ignores` entries cover required patterns
- Check if .prettierrc* exists → create/verify .prettierignore
- Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
- Check if terraform files (*.tf) exist → create/verify .terraformignore
- Check if .helmignore needed (helm charts present) → create/verify .helmignore

**If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
**If ignore file missing**: Create with full pattern set for detected technology

---

### Step 5: Parse tasks.md Structure

Extract from tasks.md:
- **Task phases**: Setup, Tests, Core, Integration, Polish
- **Task dependencies**: Sequential vs parallel execution rules
- **Task details**: ID, description, file paths, parallel markers [P]
- **Execution flow**: Order and dependency requirements

---

### Step 6: Execute Implementation

Execute implementation following the task plan:

- **Phase-by-phase execution**: Complete each phase before moving to the next
- **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together
- **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
- **File-based coordination**: Tasks affecting the same files must run sequentially
- **Validation checkpoints**: Verify each phase completion before proceeding

**Implementation execution rules**:
- **Setup first**: Initialize project structure, dependencies, configuration
- **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
- **Core development**: Implement models, services, CLI commands, endpoints
- **Integration work**: Database connections, middleware, logging, external services
- **Polish and validation**: Unit tests, performance optimization, documentation

---

### Step 7: Progress Tracking and Error Handling

- Report progress after each completed task
- Halt execution if any non-parallel task fails
- For parallel tasks [P], continue with successful tasks, report failed ones
- Provide clear error messages with context for debugging
- Suggest next steps if implementation cannot proceed
- **IMPORTANT**: For completed tasks, mark the task off as [X] in the tasks file

---

### Step 8: Completion Validation

- Verify all required tasks are completed
- Check that implemented features match the original specification
- Validate that tests pass and coverage meets requirements
- Confirm the implementation follows the technical plan
- Report final status with summary of completed work

---

### Step 9: Check for Extension Hooks

After completion validation, check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.after_implement` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

---

## Notes

- This command assumes a complete task breakdown exists in tasks.md
- If tasks are incomplete or missing, suggest running `/sdd` to regenerate the task list
- All planning artifacts (research.md, quickstart.md, data-model.md) are loaded as context
- Implementation follows the same flow as `/speckit.implement`