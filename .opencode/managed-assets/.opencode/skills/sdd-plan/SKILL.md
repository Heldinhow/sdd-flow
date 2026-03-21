---
name: sdd-plan
description: >
  Produces the planning package after spec approval in the repo-local SDD workflow.
  Trigger: When Spec Driven enters the planning phase.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Use only after `spec.md` has explicit approval.
- Use when generating or revising implementation planning artifacts.

## Critical Patterns

- Run the planning backend before drafting final artifacts.
- Produce the planning package inside the active workspace:
  - `plan.md`
  - `research.md`
  - `data-model.md` when applicable
  - `quickstart.md`
- Capture technical context, project structure, tradeoffs, constraints, and verification guidance.
- Stop after the planning package is coherent and ask for explicit approval before tasks.

## Commands

```bash
.specify/scripts/bash/setup-plan.sh --json
```
