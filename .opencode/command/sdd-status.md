---
description: Show the current active workspace status — current phase, available artifacts, and last modified time.
---

## SDD Status

Run `.specify/scripts/bash/list-workspaces.sh --json` from the repository root to enumerate workspaces.

Parse the JSON output and display the **active workspace** (is_active: true) with:

- **Branch name**
- **Current phase** (spec / plan / tasks / initialized / unknown)
- **Available artifacts** (spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/)
- **Uncommitted changes** indicator

If no active workspace is found, output a friendly message explaining that no active workspace is currently detected, and recommend running `/sdd` to start a new feature workspace.

$ARGUMENTS
