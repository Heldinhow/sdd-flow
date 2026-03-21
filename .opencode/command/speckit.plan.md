---
description: Compatibility wrapper for the unified `/sdd` workflow during technical planning.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Continue the unified SDD workflow into task generation for the current feature.
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Compatibility Mode

`/speckit.plan` is now a compatibility wrapper for `/sdd`.

### Required behavior

- Continue the unified `/sdd` workflow in the **planning phase** for the active feature workspace.
- If no active feature workspace exists, instruct the user to start with `/sdd` or `/speckit.specify`.
- Preserve the standard planning package: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and relevant contracts.
- Reuse the existing `.specify` templates and scripts as the deterministic backend for planning artifacts.
- Keep branch naming recommendations aligned with the conventional English change-type prefixes approved by the specification.
- End by recommending the next step, typically `/speckit.tasks` or `/sdd`.

### Artifact rules

- Keep all authored outputs limited to markdown artifacts.
- Preserve compatibility with the existing feature workspace layout under `specs/`.
- Avoid destructive changes to existing managed workflow assets.

Context for compatibility routing: $ARGUMENTS
