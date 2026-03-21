# Implementation Plan: SDD Init and Implement Commands

**Branch**: `feat-sdd-init-implement-commands` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/feat-sdd-init-implement-commands/spec.md`

## Summary

Add two new OpenCode commands (`/sdd-init`, `/implement`) and update the Spec Driven agent to detect uninitialized repositories. This enables a complete SDD workflow: initialization → planning → implementation, with clear agent handoffs at each stage.

## Technical Context

**Language/Version**: TypeScript 5.8 with strict mode  
**Primary Dependencies**: `@opencode-ai/plugin` 1.2.27, Bun runtime (Node 22 compatible)  
**Storage**: Filesystem (markdown files, shell scripts)  
**Testing**: Bun's built-in `bun:test`  
**Target Platform**: OpenCode plugin system  
**Project Type**: OpenCode plugin with command files  
**Performance Goals**: N/A (commands are triggered by user action)  
**Constraints**: Must integrate with existing OpenCode handoff mechanism  
**Scale/Scope**: 2 new command files, 1 agent file update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ AGENTS.md exists with development guidelines
- ✅ Using established patterns from existing commands (`sdd.md`, `speckit.implement.md`)
- ✅ TypeScript conventions followed (strict mode, file extensions, naming)
- ✅ Plugin architecture respected (command files with YAML frontmatter)

## Files to Modify

| File | Change |
|------|--------|
| `.opencode/command/sdd-init.md` | **CREATE** - New initialization command with handoff to default agent |
| `.opencode/command/implement.md` | **CREATE** - New implementation command with handoff to default agent |
| `.opencode/src/plugin/spec-driven-agent.ts` | **MODIFY** - Add uninitialized repo detection and warning |

## File Details

### 1. `.opencode/command/sdd-init.md`

**Purpose**: Initialize SDD workflow in a repository

**Handoff**: Switches to `default` agent for file system operations

**Key Sections**:
```yaml
---
description: Initialize SDD workflow in a repository — creates all required directories, files, and constitution interactively. Must be run before Spec Driven agent can be used.
handoffs:
  - label: Initialize Repository
    agent: default
    prompt: |
      Initialize SDD workflow in this repository. Follow this checklist strictly:
      [Full checklist with 6 phases - see design]
---
```

**Checklist Phases**:
1. Directory Structure (`.specify/`, `.opencode/`, `specs/`)
2. Template Files (constitution, spec, plan, tasks, checklist, agent-file templates)
3. Shell Scripts (check-prerequisites, common, create-new-feature, setup-plan, update-agent-context)
4. OpenCode Integration (AGENTS.md, command files, plugin entrypoint)
5. Constitution Creation (interactive prompting)
6. Verification (all directories/files exist, no placeholders)

### 2. `.opencode/command/implement.md`

**Purpose**: Execute implementation plan by processing tasks from tasks.md

**Handoff**: Switches to `default` agent for code execution

**Key Sections**:
```yaml
---
description: Execute implementation plan by processing and executing all tasks defined in tasks.md. Switches to default agent for code execution.
handoffs:
  - label: Implement Tasks
    agent: default
    prompt: |
      Execute the implementation plan for this feature workspace.
      Follow the implementation flow from /speckit.implement...
---
```

**Behavior**:
- Validates `tasks.md` exists in active feature workspace
- Loads implementation context from planning artifacts:
  - `tasks.md` - Task breakdown
  - `plan.md` - Technical implementation plan
  - `research.md` - Technical decisions and findings
  - `data-model.md` - Entity definitions (if exists)
  - `quickstart.md` - Usage patterns and examples
- Delegates to `/speckit.implement` logic
- Marks completed tasks with `[X]`
- Reports completion status

### 3. `.opencode/src/plugin/spec-driven-agent.ts`

**Purpose**: Add uninitialized repository detection

**Change**: Update `buildSpecDrivenPrompt()` function

**Before** (current):
```typescript
function buildSpecDrivenPrompt(input: BuildSpecDrivenPromptInput): string {
  const stateLine = input.repoInitialized
    ? `The repository already has SDD workflow assets at ${input.projectRoot}...`
    : `The repository at ${input.projectRoot} is not initialized for SDD yet...`;
  // ... build prompt
}
```

**After** (new):
```typescript
function buildSpecDrivenPrompt(input: BuildSpecDrivenPromptInput): string {
  if (!input.repoInitialized) {
    return [
      "You are Spec Driven, the primary Spec-Driven Development agent for OpenCode.",
      "",
      "## Repository Not Initialized",
      "",
      `The repository at ${input.projectRoot} is not initialized for SDD workflow.`,
      "",
      "**You cannot proceed with planning until initialization is complete.**",
      "",
      "## Required Action",
      "",
      "Instruct the user to:",
      "1. Switch to the default agent (not Spec Driven)",
      "2. Run `/sdd-init` to initialize the repository",
      "3. After initialization completes, switch back to Spec Driven",
      "4. Then the planning workflow can begin",
    ].join("\n");
  }

  // ... existing initialized prompt
}
```

## Project Structure

### Documentation (this feature)

```text
specs/feat-sdd-init-implement-commands/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Research decisions and technical findings
├── data-model.md        # Data model (N/A - no data entities)
├── quickstart.md        # Usage guide for new commands
└── tasks.md             # Task breakdown for implementation
```

### Source Code (repository root)

```text
.opencode/
├── command/
│   ├── sdd.md              # EXISTING - Main SDD workflow command
│   ├── sdd-init.md         # NEW - Initialization command
│   ├── implement.md        # NEW - Implementation command
│   └── speckit.*.md        # EXISTING - Compatibility wrappers
├── src/
│   └── plugin/
│       ├── index.ts                    # EXISTING - Plugin entrypoint
│       └── spec-driven-agent.ts        # MODIFY - Add init detection
└── tests/
    └── unit/
        └── plugin/
            └── spec-driven-agent.test.ts  # UPDATE - Add tests for init detection

.specify/
├── scripts/bash/           # unchanged
├── templates/              # unchanged
└── memory/constitution.md  # unchanged
```

**Structure Decision**: Changes are isolated to `.opencode/` directory. No changes to `.specify/` or other project files.

## Complexity Tracking

> No constitution violations. All changes follow established patterns.

| Aspect | Status |
|--------|--------|
| New commands follow existing patterns | ✅ Aligned with `sdd.md`, `speckit.implement.md` |
| Agent handoff mechanism | ✅ Uses existing `handoffs` YAML frontmatter |
| TypeScript conventions | ✅ Strict mode, proper typing |

## Implementation Phases

### Phase 1: Create `/sdd-init` Command

**Files**: `.opencode/command/sdd-init.md`

**Steps**:
1. Create command file with YAML frontmatter
2. Add handoff configuration to default agent
3. Write initialization checklist (6 phases)
4. Add constitution creation flow
5. Add verification step
6. Add user instructions to return to Spec Driven

### Phase 2: Create `/implement` Command

**Files**: `.opencode/command/implement.md`

**Steps**:
1. Create command file with YAML frontmatter
2. Add handoff configuration to default agent
3. Add tasks.md validation
4. Reference `/speckit.implement` logic
5. Add completion reporting

### Phase 3: Update Spec Driven Agent

**Files**: `.opencode/src/plugin/spec-driven-agent.ts`

**Steps**:
1. Modify `buildSpecDrivenPrompt()` function
2. Add early return for uninitialized repos
3. Add clear warning message
4. Add user instructions
5. Update tests

### Phase 4: Testing

**Files**: `.opencode/tests/unit/plugin/spec-driven-agent.test.ts`

**Test Cases**:
1. Initialized repo returns normal prompt
2. Uninitialized repo returns warning prompt
3. Warning contains `/sdd-init` instruction
4. Warning instructs user to switch agents

## Dependencies

None - all changes are additive and follow existing patterns.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| User runs `/sdd-init` in initialized repo | Non-destructive merge preserves existing files |
| `/implement` called without tasks.md | Clear error message with guidance |
| Agent handoff fails | OpenCode handles handoff gracefully |

## Verification Checklist

- [ ] `/sdd-init` creates all required directories
- [ ] `/sdd-init` creates all required files
- [ ] `/sdd-init` collects constitution values interactively
- [ ] `/sdd-init` writes constitution with no placeholders
- [ ] `/sdd-init` instructs user to return to Spec Driven
- [ ] `/implement` validates tasks.md existence
- [ ] `/implement` hands off to default agent
- [ ] Spec Driven shows warning for uninitialized repos
- [ ] Spec Driven proceeds normally for initialized repos
- [ ] All tests pass