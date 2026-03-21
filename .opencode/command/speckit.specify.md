---
description: Compatibility wrapper for the unified `/sdd` workflow during feature specification.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Continue the unified SDD workflow into the planning phase for the current feature.
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Continue the unified SDD workflow into the clarification phase for the current feature.
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Compatibility Mode

`/speckit.specify` is now a compatibility wrapper for `/sdd`.

### Required behavior

- If the user provides a new feature request, continue through the unified `/sdd` workflow as the **specification phase** for that request.
- If an active feature workspace already exists, continue the specification work inside that workspace instead of creating duplicate artifacts.
- Preserve the existing `spec.md` artifact shape and feature workspace layout expected by the planning flow.
- Ask focused clarification questions only when unresolved ambiguity would materially change scope, user experience, or validation.
- Recommend the best-fit English branch prefix and short name before the feature context is finalized.
- End by recommending the next step, typically `/speckit.clarify`, `/speckit.plan`, or `/sdd`.

### Artifact rules

- Keep all authored outputs limited to markdown artifacts.
- Preserve traceability back to the original feature request.
- Treat existing `.specify` and `.opencode` assets as managed workflow assets that must not be overwritten destructively.

Context for compatibility routing: $ARGUMENTS
