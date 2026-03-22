# GitHub Actions PR Check

A GitHub Actions workflow that validates SDD (Spec-Driven Development) workflow completion before allowing merge.

## Purpose

This workflow ensures that feature branches have properly completed the SDD workflow before merging to main/master/dev:

1. Validates the feature workspace exists in `specs/`
2. Checks that `spec.md`, `plan.md`, and `tasks.md` exist and are non-empty
3. Verifies all tasks in `tasks.md` are marked as completed (`[x]`)
4. Runs the SDD prerequisites check script
5. Validates all checklist files are complete (if `checklists/` exists)

## Setup

### Option 1: Copy to Your Repository

1. Copy `.github/workflows/sdd-pr-check.yml` from this repository to your project's `.github/workflows/` directory

### Option 2: Include in SDD Initialization

When initializing a new SDD repository, this workflow is automatically included in `.github/workflows/`.

## Configuration

The workflow runs on:
- Pull request events (opened, synchronize, reopened)
- Changes to `main`, `master`, or `dev` branches

### Customizing Branch Names

Edit the workflow to add your protected branches:

```yaml
on:
  pull_request:
    branches:
      - main
      - master
      - dev
      - release/*
```

## What Gets Validated

| Check | Description |
|-------|-------------|
| Workspace exists | `specs/<branch-name>/` directory exists |
| spec.md | Present and non-empty |
| plan.md | Present and non-empty |
| tasks.md | Present, non-empty, all tasks completed |
| SDD script | `check-prerequisites.sh` passes |
| Checklists | All checklist items completed (if present) |

## Example Output

```
✓ spec.md found and non-empty
✓ plan.md found and non-empty
✓ tasks.md found and non-empty
Tasks: 15/15 completed
✓ All tasks completed
✓ SDD prerequisites check passed
  security.md: ✓ PASS (8/8 completed)
  test.md: ✓ PASS (12/12 completed)
✓ All checklists passed

========================================
SDD PR Check Summary
========================================
Workspace: feat-my-feature
Status: ✓ ALL CHECKS PASSED
========================================
```

## Failure Modes

| Error | Cause | Resolution |
|-------|-------|------------|
| `spec.md not found` | Feature workspace not initialized | Run `/sdd` to create workspace |
| `tasks.md not found` | Planning phase incomplete | Complete planning to generate tasks |
| `Only X of Y tasks completed` | Implementation incomplete | Complete all tasks before merge |
| `check-prerequisites.sh` fails | Prerequisites not met | Run the script locally to debug |

## Integration with SDD Workflow

This workflow is the final gate in the SDD workflow:

```
/sdd → /speckit.spec → /speckit.plan → /speckit.tasks → /implement → [PR] → MERGE
                                                                             ↑
                                                              GitHub Actions validates
                                                              SDD completion here
```
