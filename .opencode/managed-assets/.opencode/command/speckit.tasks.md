---
description: Compatibility wrapper for the unified `/sdd` workflow during task generation.
handoffs:
  - label: Implement Project
    agent: speckit.implement
    prompt: Continue from the generated tasks for the current feature.
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Compatibility Mode

`/speckit.tasks` is now a compatibility wrapper for `/sdd`.

### Required behavior

- Continue the unified `/sdd` workflow in the **task-generation phase** for the active feature workspace.
- Load the current planning package and generate a dependency-ordered `tasks.md` organized by user story.
- Preserve the strict checklist task format and exact file-path references expected by downstream implementation.
- Keep user story independence explicit through independent validation criteria, dependency notes, and parallel markers where appropriate.
- End by recommending the next step, typically implementation or analysis for the generated task list.

### Artifact rules

- Keep all authored outputs limited to markdown artifacts.
- Preserve compatibility with the existing planning package under `specs/`.
- Avoid destructive changes to existing managed workflow assets.

Context for compatibility routing: $ARGUMENTS
