# Spec: SDD Init and Implement Commands

**Feature Branch**: `feat-sdd-init-implement-commands`  
**Created**: 2026-03-21  
**Status**: Draft  
**Input**: Add `/sdd-init` and `/implement` commands for SDD workflow initialization and execution

> Primary guided workflow: `/sdd` (with `speckit.*` compatibility wrappers)

## Problem

The SDD workflow currently lacks dedicated commands for:
1. **Repository initialization** - Users must rely on the inline `/sdd init` flow embedded in the `/sdd` command, which doesn't clearly separate initialization from planning
2. **Implementation execution** - Users must use `/speckit.implement` to execute tasks, but there's no clear handoff from the planning phase to implementation

Additionally, the **Spec Driven agent** doesn't warn users when the repository is not initialized, leading to confusion when planning commands fail.

## Goal

Provide clear, dedicated commands for:
1. `/sdd-init` - Initialize SDD workflow with all required files, directories, and interactive constitution creation
2. `/implement` - Execute implementation with automatic agent handoff to default agent for code execution
3. **Spec Driven agent warning** - Block planning with clear instructions when repository is not initialized

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize SDD Workflow (Priority: P1)

A developer setting up a new repository runs `/sdd-init` to create all required SDD files and directories in a single command. The command switches to the default agent (with full permissions), creates the directory structure, copies templates, and interactively collects constitution values.

**Why this priority**: Without initialization, no other SDD workflow features work. This is the foundation.

**Independent Test**: Can be fully tested by running `/sdd-init` in a fresh repository and verifying all directories, files, and constitution are created correctly.

**Acceptance Scenarios**:

1. **Given** a fresh repository without `.specify/`, **When** user runs `/sdd-init`, **Then** `.specify/` directory is created with `scripts/bash/` and `templates/` subdirectories
2. **Given** a fresh repository without `.opencode/`, **When** user runs `/sdd-init`, **Then** `.opencode/` directory is created with `command/` and `plugin/` subdirectories
3. **Given** a fresh repository, **When** user runs `/sdd-init`, **Then** `AGENTS.md` is created in repository root
4. **Given** a fresh repository, **When** user runs `/sdd-init`, **Then** `specs/` directory is created for feature workspaces
5. **Given** `/sdd-init` starts, **When** constitution template is loaded, **Then** user is prompted for PROJECT_NAME interactively
6. **Given** constitution values collected, **When** constitution is written, **Then** `.specify/memory/constitution.md` contains no `[BRACKETED_TOKENS]` placeholders
7. **Given** `/sdd-init` completes, **When** user sees output, **Then** clear instructions to "switch back to Spec Driven agent" are displayed

---

### User Story 2 - Automatic Planning Artifacts Creation (Priority: P1)

When a user plans a feature using `/sdd`, all complementary files are created automatically without manual intervention. The planning workflow produces: spec.md, plan.md, research.md, data-model.md, quickstart.md, and tasks.md.

**Why this priority**: Planning artifacts are essential context for implementation. Without them, implementation lacks necessary research decisions and usage patterns.

**Independent Test**: Can be tested by running `/sdd` to plan a feature and verifying all 6 artifacts are created in the feature workspace.

**Acceptance Scenarios**:

1. **Given** user starts planning with `/sdd`, **When** spec is approved, **Then** `plan.md` is created automatically
2. **Given** plan is generated, **When** planning phase completes, **Then** `research.md` is created with technical decisions
3. **Given** feature involves data entities, **When** planning phase completes, **Then** `data-model.md` is created with entity definitions
4. **Given** planning is complete, **When** final phase reached, **Then** `quickstart.md` is created with usage guide
5. **Given** all planning artifacts exist, **When** final phase reached, **Then** `tasks.md` is created with implementation breakdown
6. **Given** user does NOTneed to manually ask for files, **When** planning completes, **Then** all files exist without manual creation

---

### User Story 3 - Execute Implementation Using Planning Artifacts (Priority: P2)

A developer with completed planning artifacts runs `/implement` to start code execution. The command loads all planning artifacts (research.md, data-model.md, quickstart.md) as context for implementation decisions.

**Why this priority**: Implementation is the end goal of planning. This bridges the gap between planning and execution with proper context.

**Independent Test**: Can be tested by completing planning for a feature and running `/implement` to verify agent receives all artifact context.

**Acceptance Scenarios**:

1. **Given** feature workspace with `tasks.md`, **When** user runs `/implement`, **Then** command validates `tasks.md` exists
2. **Given** `/implement` starts, **When** context is loaded, **Then** `research.md` decisions are available for reference
3. **Given** `/implement` starts, **When** context is loaded, **Then** `quickstart.md` usage patterns are available
4. **Given** `/implement` starts, **When** feature has data entities, **Then** `data-model.md` is loaded for reference
5. **Given** `/implement` starts, **When** handoff occurs, **Then** default agent receives full implementation context
6. **Given** default agent executing tasks, **When** tasks complete successfully, **Then** tasks are marked with `[X]` in `tasks.md`
7. **Given** no active feature workspace, **When** user runs `/implement`, **Then** clear error message instructs user to run planning first

---

### User Story 4 - Spec Driven Warning for Uninitialized Repos (Priority: P1)

A developer using the Spec Driven agent in an uninitialized repository sees a clear warning message instructing them to run `/sdd-init` first. The agent refuses to proceed with planning until initialization is complete.

**Why this priority**: Prevents user confusion and provides clear guidance on required setup steps.

**Independent Test**: Can be tested by using Spec Driven agent in a fresh repository without `.specify/` and verifying the warning message appears.

**Acceptance Scenarios**:

1. **Given** repository without `.specify/` or `specs/`, **When** user uses Spec Driven agent, **Then** warning message appears stating "Repository notinitialized"
2. **Given** uninitialized repo warning, **When** user reads message, **Then** clear instructions show: "Switch to default agent, run `/sdd-init`, then return to Spec Driven"
3. **Given** Spec Driven in uninitialized repo, **When** user attempts planning, **Then** agent does not proceed with planning workflow
4. **Given** initialized repo (`.specify/` and `specs/` exist), **When** user uses Spec Driven agent, **Then** normal planning workflow proceeds

---

### User Story 5 - Command Discovery and Registration (Priority: P0)

**CRITICAL**: Command files exist in `.opencode/command/` but are NOT registered with OpenCode. The plugin must register commands via `config.command` for them to be discoverable.

A developer installs the SDD plugin and expects all commands (`/sdd-init`, `/sdd`, `/implement`, `speckit.*`) to be available in OpenCode. Without command registration, commands are invisible to OpenCode and cannot be invoked.

**Why this priority**: This is a BLOCKER. Without command registration, no commands work at all.

**Independent Test**: After plugin loads, typing `/` in OpenCode shows `/sdd-init`, `/sdd`, `/implement`, and all `speckit.*` commands.

**Acceptance Scenarios**:

1. **Given** plugin loads, **When** OpenCode initializes, **Then** `config.command` contains all commands from `.opencode/command/`
2. **Given** command file has `description` in frontmatter, **When** command is registered, **Then** `description` is included in `config.command[name]`
3. **Given** command file has `handoffs[].agent` in frontmatter,**When** command is registered, **Then** `agent` is included in `config.command[name]`
4. **Given** user types `/` in OpenCode, **When** command palette opens, **Then** `/sdd-init`, `/sdd`, `/implement` appear in the list
5. **Given** user runs `/sdd-init`, **When** OpenCode processes command, **Then** command template is loaded and agent handoff occurs

---

### User Story 4 - Complete Workflow (Priority: P3)

A developer follows the complete workflow: initialize → plan → implement, with clear agent handoffs at each stage.

**Why this priority**: End-to-end validation that all pieces work together.

**Independent Test**: Can be tested by following the complete workflow from `/sdd-init` through `/implement` in a fresh repository.

**Acceptance Scenarios**:

1. **Given** fresh repository, **When** user runs `/sdd-init`, **Then** all directories and constitution are created
2. **Given** initialized repo, **When** user switches to Spec Driven agent, **Then** planning workflow begins normally
3. **Given** completed planning (`tasks.md` exists), **When** user runs `/implement`, **Then** implementation executes successfully

---

### Edge Cases

- **Partial initialization**: If `/sdd-init` is interrupted (e.g., network failure),user can re-run to complete
- **Existing files**: `/sdd-init` preserves existing user files - non-destructive merge
- **No active feature**: `/implement` fails gracefully with message to run planning first
- **Constitution already exists**: `/sdd-init` offers to update or keep existing constitution
- **User switches agents mid-flow**: Commands state is preserved, user can resume from last checkpoint

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create `.specify/scripts/bash/` directory with all shell scripts
- **FR-002**: System MUST create `.specify/templates/` directory with all template files
- **FR-003**: System MUST create `.specify/memory/` directory for constitution
- **FR-004**: System MUST create `.opencode/command/` directory with command files
- **FR-005**: System MUST create `.opencode/plugin/` directory for plugin entrypoint
- **FR-006**: System MUST create `specs/` directory for feature workspaces
- **FR-007**: System MUST create `AGENTS.md` in repository root
- **FR-008**: `/sdd-init` MUST switch to default agent with full edit/bash permissions
- **FR-009**: `/sdd-init` MUST interactively collect constitution values (PROJECT_NAME, principles, governance)
- **FR-010**: `/sdd-init` MUST write constitution with no `[BRACKETED_TOKENS]` placeholders remaining
- **FR-011**: `/sdd-init` MUST instruct user to return to Spec Driven agent after completion- **FR-012**: `/sdd` (planning flow) MUST automatically create `research.md` with technical decisions
- **FR-013**: `/sdd` (planning flow) MUST automatically create `data-model.md` when feature involves data entities
- **FR-014**: `/sdd` (planning flow) MUST automatically create `quickstart.md` with usage guide
- **FR-015**: `/sdd` (planning flow) MUST automatically create `tasks.md` with implementation breakdown
- **FR-016**: User MUST NOT need to manually request complementary files - they are created automatically
- **FR-017**: `/implement` MUST validate `tasks.md` exists in active feature workspace
- **FR-018**: `/implement` MUST load `research.md` for technical decision context
- **FR-019**: `/implement` MUST load `quickstart.md` for usage pattern context
- **FR-020**: `/implement` MUST load `data-model.md` for entity context (if exists)
- **FR-021**: `/implement` MUST hand off to default agent with full implementation context
- **FR-022**: `/implement` MUST follow `/speckit.implement` logic for task execution
- **FR-023**: Spec Driven agent MUST detect uninitialized repos via `hasSddMarkers()` check
- **FR-024**: Spec Driven agent MUST display warning message for uninitialized repos
- **FR-025**: Spec Driven agent MUST NOT proceed with planning until initialized
- **FR-026**: Plugin MUST register all commands in `.opencode/command/` via `config.command` hook
- **FR-027**: Plugin MUST parse YAML frontmatter from command files to extract `description` and `handoffs[].agent`
- **FR-028**: Commands `/sdd-init`, `/sdd`, `/implement`, and all `speckit.*` commands MUST be discoverable in OpenCode

### Key Entities

- **Command File**: Markdown file in `.opencode/command/` with YAML frontmatter and handoff configuration
- **Feature Workspace**: Directory in `specs/` containing planning artifacts (spec.md, plan.md, tasks.md)
- **Constitution**: Project governance document at `.specify/memory/constitution.md`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/sdd-init` creates all 7 required directories/files in a single run
- **SC-002**: `/sdd-init` constitution creation completes with zero placeholder tokens remaining
- **SC-003**: `/implement` successfully hands off to default agent in 100% of cases where `tasks.md` exists
- **SC-004**: Spec Driven agent shows warning in100% of uninitialized repo cases
- **SC-005**: Complete workflow (init → plan → implement) succeeds without manual agent switching by user

## Scope

### In Scope

- Create `.opencode/command/sdd-init.md` command file
- Create `.opencode/command/implement.md` command file
- **Create `.opencode/src/plugin/command-registry.ts` to register commands with OpenCode**
- **Update `.opencode/src/plugin/index.ts` to call `registerCommands()` in config hook**
- Update `.opencode/src/plugin/spec-driven-agent.ts` to detect uninitialized repos and provide warning

### Out of Scope

- Modifying `/speckit.constitution` or `/speckit.implement` (they remain as-is)
- Changing the existing `/sdd` command behavior (it continues as the planning entrypoint)
- Creating new agents (uses existing default agent handoff mechanism)