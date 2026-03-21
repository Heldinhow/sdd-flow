# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-03-21] New SDD session = new workspace by default**
   Do instead: every new Spec Driven session creates a fresh workspace in `specs/`, unless user explicitly asks to resume.

## SDD Workflow Rules
1. **[2026-03-21] Session-scoped workspace rule**
   Do instead: routing never auto-resumes based on active workspace presence alone. Resume requires explicit user intent.
1. **[2026-03-21] Build agent handoff uses `agent: build`, not `default`**
   Do instead: all execution-mode commands (`sdd-init`, `implement`) must declare `agent: build` in frontmatter handoffs.

## Shell & Command Reliability
1. **[2026-03-21] `rg` fails on giant expanded path lists**
   Do instead: run `rg` on directory roots or iterate files via `while IFS= read -r`.

## User Directives
1. **[2026-03-21] Do not use worktrees for this repo**
   Do instead: implement directly in current branch.
