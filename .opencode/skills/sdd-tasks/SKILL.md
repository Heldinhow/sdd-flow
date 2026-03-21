---
name: sdd-tasks
description: >
  Generates tasks.md from the approved planning package in the repo-local SDD workflow.
  Trigger: When Spec Driven enters the task generation phase.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Use only after the plan package is explicitly approved.
- Use when validating readiness for implementation and generating `tasks.md`.

## Critical Patterns

- Verify the active workspace contains the required planning artifacts before generating tasks.
- Create a task breakdown that follows story slices, dependency order, and clear validation checkpoints.
- Keep tasks actionable for `/implement`; avoid vague reminders.
- Treat `tasks.md` as the handoff artifact from planning to build execution.

## Required Inputs

- `spec.md`
- `plan.md`
- `research.md`
- `quickstart.md`
- `data-model.md` when relevant

## Commands

```bash
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```
