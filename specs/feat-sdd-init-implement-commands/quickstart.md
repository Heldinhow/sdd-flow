# Quickstart: SDD Init and Implement Commands

This guide walks through using the new `/sdd-init` and `/implement` commands.

## Prerequisites

- OpenCode installed
- A git repository (new or existing)

## Workflow Overview

```
Fresh Repository → /sdd-init → Spec Driven → /sdd → Planning → /implement → Code
```

## Step 1: Initialize SDD Workflow

In a fresh repository, run:

```
/sdd-init
```

**What happens:**
1. Switches to default agent (full permissions)
2. Creates `.specify/` directory structure
3. Creates `.opencode/` command files
4. Creates `specs/` directory
5. Creates `AGENTS.md` in repository root
6. Interactively collects constitution values:
   - Project name
   - Principles (name and description for each)
   - Governance rules
7. Verifies all files created correctly
8. Instructs you to switch back to Spec Driven agent

**After completion:**
```
Repository is now initialized for SDD workflow.
Switch back to the Spec Driven agent to start planning your features.
```

## Step 2: Start Planning

Switch to **Spec Driven** agent and run:

```
/sdd
```

**What happens:**
- Guides you through feature specification
- Creates `spec.md`, `plan.md`, `tasks.md` in `specs/<feature-name>/`
- Stays in plan mode (no code execution)

## Step 3: Execute Implementation

When planning is complete, run:

```
/implement
```

**What happens:**
1. Validates `tasks.md` exists
2. Switches to default agent (full permissions)
3. Executes tasks following `/speckit.implement` logic
4. Marks completed tasks with `[X]`
5. Reports completion status

## Error Handling

### Uninitialized Repository

If you try to use **Spec Driven** before running `/sdd-init`:

```
## Repository Not Initialized

The repository is not initialized for SDD workflow.

**You cannot proceed with planning until initialization is complete.**

## Required Action

1. Switch to the default agent (not Spec Driven)
2. Run `/sdd-init` to initialize the repository
3. After initialization completes, switch back to Spec Driven
4. Then the planning workflow can begin
```

### No Active Feature

If you run `/implement` without completing planning:

```
No active feature workspace found.Run /sdd first to plan a feature, then /implement to execute.
```

## File Structure After Init

```
repository/
├── .specify/
│   ├── scripts/bash/
│   │   ├── check-prerequisites.sh
│   │   ├── common.sh
│   │   ├── create-new-feature.sh
│   │   ├── setup-plan.sh
│   │   └── update-agent-context.sh
│   ├── templates/
│   │   ├── agent-file-template.md
│   │   ├── checklist-template.md
│   │   ├── constitution-template.md
│   │   ├── plan-template.md
│   │   ├── spec-template.md
│   │   └── tasks-template.md
│   └── memory/
│       └── constitution.md
├── .opencode/
│   ├── command/
│   │   ├── sdd.md
│   │   ├── sdd-init.md
│   │   ├── implement.md
│   │   └── speckit.*.md
│   └── plugin/
│       └── index.ts
├── specs/
│   └── <feature-name>/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
└── AGENTS.md
```

## Related Commands

| Command | Purpose | Agent |
|---------|---------|-------|
| `/sdd-init` | Initialize repository | Default |
| `/sdd` | Plan features | Spec Driven |
| `/implement` | Execute tasks | Default |
| `/speckit.constitution` | Update constitution | Default |
| `/speckit.implement` | Execute tasks (legacy) | Default |