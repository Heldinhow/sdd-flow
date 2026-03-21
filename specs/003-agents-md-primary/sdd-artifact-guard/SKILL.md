---
name: sdd-artifact-guard
description: "Guarantee the SDD artifact creation flow works correctly in OpenCode. Ensures all required artifacts are created in the correct order, with proper structure, and validates the flow end-to-end."
---

# SDD Artifact Guard

## Overview

The SDD Artifact Guard skill ensures the Spec-Driven Development artifact creation flow works correctly by:

1. **Validating prerequisites** before artifact creation
2. **Enforcing the correct creation order** (spec → plan → tasks → research/data-model/quickstart)
3. **Checking file structure** matches expected templates
4. **Guarding against incomplete artifacts** being used downstream

## When to Use This Skill

**Trigger**: When creating or resuming a feature workspace in the SDD workflow.

- Starting a new feature with `/sdd`
- Resuming an existing feature workspace
- Before running `/speckit.analyze` or `/speckit.tasks`
- After task generation to verify completeness

## Core Principles

- **Order Enforced**: Artifacts must be created in sequence: spec.md → plan.md → tasks.md (plus research.md, data-model.md, quickstart.md)
- **Completeness Checked**: Each artifact is validated for required sections before proceeding
- **Non-Destructive**: Only creates missing files; never overwrites existing valid artifacts without consent
- **Template Alignment**: Created files match the official `.specify/templates/` structure

## Preparation Checklist

- [ ] Identify the active feature workspace directory
- [ ] Verify or create the feature workspace with `/sdd`
- [ ] Ensure `.specify/templates/` contains the official templates
- [ ] Check which artifacts already exist in the workspace

## Artifact Creation Flow

### Phase 1: SPEC.md Creation

**Trigger**: New feature request received

**Required Sections**:
- Problem statement
- Goals and scope
- User stories with acceptance criteria
- Edge cases (if any)

**Validation**:
```markdown
✓ Overview/Context
✓ Functional Requirements  
✓ Non-Functional Requirements
✓ User Stories
✓ Edge Cases (optional but recommended)
```

**Output**: `specs/<feature-name>/spec.md`

---

### Phase 2: PLAN.MD Creation

**Prerequisite**: spec.md must be complete and approved

**Required Sections**:
- High-level summary
- Architecture/stack choices
- File changes list
- Dependencies
- Verification approach

**Validation**:
```markdown
✓ High-Level Summary
✓ Architecture Decisions
✓ File Changes
✓ Dependencies
✓ Verification
```

**Output**: `specs/<feature-name>/plan.md`

---

### Phase 3: TASKS.MD Creation

**Prerequisite**: plan.md must be complete

**Required Sections**:
- Task list with IDs
- Phase grouping
- Dependencies
- Parallel markers [P]
- Checkpoint markers

**Validation**:
```markdown
✓ Task IDs (T001, T002, ...)
✓ Phase groupings
✓ Dependencies declared
✓ Parallel opportunities marked [P]
✓ Checkpoint markers
```

**Output**: `specs/<feature-name>/tasks.md`

---

### Phase 4: Complementary Artifacts

**Created alongside plan.md**:
- `research.md` — Background, options considered, risks
- `data-model.md` — File relationships, data structures
- `quickstart.md` — Quick verification commands

**Validation**:
```markdown
research.md:
  ✓ Background context
  ✓ Options considered
  ✓ Decision rationale
  ✓ Risks identified

data-model.md:
  ✓ File relationships diagram
  ✓ Type changes (if any)
  ✓ API contracts

quickstart.md:
  ✓ Summary of changes
  ✓ Verification commands
  ✓ Breaking changes (if any)
```

---

## Guard Rules

### Before Creating Any Artifact

1. **Check workspace exists**: `specs/<feature>/` directory must exist
2. **Check prerequisites**: Previous-phase artifact must exist and be valid
3. **Check template exists**: `.specify/templates/<artifact>-template.md` must be available

### Before Proceeding to Next Phase

1. **Validate current artifact**: All required sections present
2. **Check completeness**: No `[TODO]` or `[PLACEHOLDER]` markers
3. **Update manifest**: Record artifact creation in feature workspace state

### Before Analysis/Implementation

1. **Run `/speckit.analyze`**: Validate consistency across all artifacts
2. **Verify tasks complete**: All T00X tasks have clear descriptions
3. **Check dependencies**: Tasks reference valid file paths

## Anti-Patterns (Blocked by Guard)

| Anti-Pattern | What Guard Does |
|--------------|-----------------|
| Creating plan.md before spec.md | Blocks; requires spec.md approval first |
| Proceeding with empty placeholder sections | Warns; requires content before approval |
| Running analyze before tasks.md exists | Blocks; requires tasks.md completion |
| Creating tasks without phase grouping | Flags; requires proper organization |
| Using custom template instead of official | Warns; suggests using `.specify/templates/` |

## Validation Commands

```bash
# Check artifact completeness
cat specs/<feature>/spec.md | grep -E "^\s*✓|^\s*#\s" | head -20

# Verify template alignment
diff specs/<feature>/spec.md .specify/templates/spec-template.md

# Run full guard validation
/sdd --verify specs/<feature>
```

## Expected Output

When guard passes:
```
✅ SPEC.md: Complete (all required sections present)
✅ PLAN.md: Complete (all required sections present)
✅ TASKS.md: Complete (all tasks have IDs and descriptions)
✅ research.md: Present
✅ data-model.md: Present  
✅ quickstart.md: Present

🎯 Ready for /speckit.analyze
```

When guard fails:
```
❌ SPEC.md: Missing required section "User Stories"
❌ PLAN.md: Contains unfilled [PLACEHOLDER] markers
❌ TASKS.md: Missing phase grouping

📋 Complete missing items before proceeding
```

## Skill Metadata

- **Category**: workflow
- **Supports**: SDD workflow, OpenCode
- **Related Skills**: `opencode-subagents`, `skill-creator`
- **Version**: 1.0.0
