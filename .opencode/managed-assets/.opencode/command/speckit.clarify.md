---
description: Compatibility wrapper for the unified `/sdd` workflow during clarification.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Continue the unified SDD workflow into the planning phase after clarification.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Compatibility Mode

`/speckit.clarify` is now a compatibility wrapper for `/sdd`.

### Required behavior

- Continue the unified `/sdd` workflow in the **clarification phase** for the active feature workspace.
- Ask only high-impact clarification questions that materially affect scope, behavior, validation, or user experience.
- Present one question at a time, recommend the best-fit answer, and record accepted answers in the relevant planning artifact.
- Preserve wording consistency across the updated artifacts and remove contradictory assumptions when clarification answers supersede them.
- End by recommending the next step, typically `/speckit.plan` or `/sdd`.

### Artifact rules

- Keep all authored outputs limited to markdown artifacts.
- Preserve traceability from each clarification answer to the artifact it changed.
- Avoid destructive changes to existing managed workflow assets.

Context for compatibility routing: $ARGUMENTS
