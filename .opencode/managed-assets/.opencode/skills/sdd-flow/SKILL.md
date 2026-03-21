---
name: sdd-flow
description: >
  Orchestrates the repo-local SDD workflow for OpenCode.
  Trigger: When the Spec Driven agent starts or advances a planning interaction.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Use at the start of every new Spec Driven interaction.
- Use before moving between specify, clarify, plan, and tasks.
- Use whenever branch/workspace creation or approval gating is involved.

## Critical Patterns

- Every new interaction creates a fresh typed branch workspace before planning begins.
- Infer one of: `feat`, `fix`, `refactor`, `init`, `test`.
- Confirm the recommended branch name briefly, then create the workspace.
- Keep the user in one conversation; do not ask them to run internal planning commands.
- Respect approval gates strictly:
  - `spec.md` must be approved before plan artifacts.
  - plan artifacts must be approved before `tasks.md`.
- Use repo-local assets only:
  - `.opencode/command/sdd.md`
  - `.specify/scripts/bash/create-new-feature.sh`
  - `.specify/scripts/bash/setup-plan.sh`
  - `.specify/scripts/bash/check-prerequisites.sh`

## Phase Order

1. Create branch workspace
2. Run specify
3. Clarify if ambiguity remains
4. Wait for spec approval
5. Run plan
6. Wait for plan approval
7. Run tasks
8. Hand off to `/implement` only after planning is complete

## Commands

```bash
.specify/scripts/bash/create-new-feature.sh "feature description" --json --type feat --short-name auth-flow
.specify/scripts/bash/setup-plan.sh --json
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```
