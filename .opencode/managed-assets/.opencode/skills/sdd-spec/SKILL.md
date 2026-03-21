---
name: sdd-spec
description: >
  Writes and refines spec.md for the repo-local SDD workflow.
  Trigger: When Spec Driven is in the specify or clarify phase.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Use after the branch workspace exists.
- Use when creating or revising `spec.md`.
- Use during clarification loops that feed accepted answers back into the spec.

## Critical Patterns

- Write only to `specs/<branch>/spec.md`.
- Turn the request into user stories, acceptance criteria, constraints, edge cases, and success criteria.
- Ask one focused clarification question at a time when ambiguity materially affects scope or validation.
- Recommend an answer when helpful and record accepted answers in the spec.
- Stop after the spec package is ready and ask for explicit approval.

## Outputs

- `spec.md`

## Commands

```bash
test -f specs/<branch>/spec.md
```
