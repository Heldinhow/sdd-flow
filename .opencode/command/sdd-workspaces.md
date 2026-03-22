---
description: List all SDD workspaces with their state, phase, and artifacts. Provides options to archive or delete old workspaces.
---

## SDD Workspaces

Run `.specify/scripts/bash/list-workspaces.sh --json` from the repository root to enumerate all workspaces.

Parse the JSON output and display a **table of all workspaces** with columns:

| Workspace | Phase | Active | Uncommitted | Artifacts |
|-----------|-------|--------|-------------|-----------|
| name | phase | ✓/- | ✓/- | spec/plan/tasks |

### Workspace States

- **Phase**: The most advanced artifact present (spec → plan → tasks)
- **Active**: Currently checked-out workspace
- **Uncommitted**: Has uncommitted changes in git
- **Artifacts**: Which planning documents are present

### Actions

After displaying the list, ask the user if they want to:

1. **Switch to a workspace** — `git checkout <workspace-name>` to activate it
2. **Archive a workspace** — Move it to `specs/.archive/<workspace-name>`
3. **Delete a workspace** — Remove the directory (requires confirmation)
4. **Do nothing** — Exit

Do not perform any action without explicit user confirmation.

$ARGUMENTS
