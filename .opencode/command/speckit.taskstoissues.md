---
description: Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts.
tools: ['github/github-mcp-server/issue_write']
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Check: Verify GitHub Remote

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and TASKS path. All paths must be absolute.
1. Get the Git remote by running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED IF THE REMOTE IS A GITHUB URL (e.g., github.com/owner/repo)

1. Extract the owner and repo from the GitHub URL (e.g., `https://github.com/owner/repo` → owner=`owner`, repo=`repo`)

## Parse Tasks

1. Read the tasks file at the path returned by check-prerequisites.sh
1. Parse all task items from the markdown. Tasks follow the format:
   - `- [ ] T001 Description` (unchecked task)
   - `- [x] T001 Description` (completed task — skip these)
1. Extract from each task:
   - **Task ID**: The T-prefixed identifier (e.g., `T001`)
   - **Description**: The task text (everything after the ID)
   - **Phase**: The section/phase this task belongs to (e.g., "Phase 1: Setup", "Phase 3: User Story 1")
   - **User Story**: The [USn] label if present (e.g., [US1], [US2])
   - **Parallel marker**: [P] if present

## Create GitHub Issues

For each parsed task, use the GitHub MCP `issue_write` tool to create an issue:

**issue_write parameters:**
- `owner`: The GitHub repo owner (from remote URL)
- `repo`: The GitHub repo name (from remote URL)
- `title`: `${TASK_ID}: ${DESCRIPTION}` (e.g., "T001: Create project structure")
- `body`: Include:
  - Task description
  - Phase: `${phase}`
  - User Story: `${userStory}` (or "General" if not assigned)
  - File path references from the description
- `labels`: Array containing:
  - `"task"` (always)
  - `"${phase}"` (normalized, e.g., "phase-1", "phase-3- user-story-1")
  - `"parallel"` if [P] marker present
  - The user story label if assigned (e.g., "user-story-1")

**Example issue_write call:**
```
use github/github-mcp-server/issue_write
{
  "owner": "owner",
  "repo": "repo",
  "title": "T001: Create project structure per implementation plan",
  "body": "## Task\nCreate project structure per implementation plan\n\n**Phase**: Phase 1: Setup\n**User Story**: General\n**File**: src/",
  "labels": ["task", "phase-1", "setup"]
}
```

## Dependency Ordering

Create issues in the order they appear in tasks.md. GitHub will maintain the creation order, and labels preserve the dependency grouping.

## Output

After all issues are created, output a summary:

```markdown
## GitHub Issues Created

| Issue # | Task ID | Title | Labels |
|---------|---------|-------|--------|
| #123 | T001 | Create project structure | task, phase-1 |
| #124 | T002 | Initialize project | task, phase-1, parallel |

Created ${count} issues in ${owner}/${repo}
```

$ARGUMENTS

