# Research: AGENTS.md as Primary Reference

## Background

The current SDD workflow auto-creates `.specify/memory/constitution.md` from a template during repository initialization. However, this file remains an unfilled template with placeholder tokens, not actual governance principles.

## Key Findings

### Finding 1: AGENTS.md Contains Real Content
The `AGENTS.md` file at repository root is well-populated with:
- Active technologies (Bun, TypeScript 5.8 strict, zod 4.x)
- Build/test commands
- Project layout
- TypeScript conventions
- Plugin architecture
- Testing conventions
- Git workflow
- SDD phase flow

### Finding 2: constitution.md is Just a Template
The `.specify/memory/constitution.md` file contains only template placeholders:
- `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`, `[PRINCIPLE_1_DESCRIPTION]`
- No actual filled principles

### Finding 3: Init Flow Auto-Creates Blank Constitution
Per `.opencode/command/sdd.md` line 102, the init flow creates constitution.md if it doesn't exist — even as a blank template.

### Finding 4: Analyze Commands Reference Constitution
Per `.opencode/command/speckit.analyze.md`, analysis validates against constitution principles, but with unfilled template this provides no real value.

## Options Considered

### Option A: Keep Constitution as Optional (Recommended)
- Remove auto-creation from init
- Keep `/speckit.constitution` for explicit creation
- Make analyze check AGENTS.md first, constitution only if exists with real content

**Pros**: Simple change, maintains explicit constitution creation path
**Cons**: None significant

### Option B: Require Constitution Completion Before Workflow
- Force users to fill constitution before using SDD workflow
- Block init until constitution is complete

**Pros**: Ensures governance exists
**Cons**: Adds friction, constitution may not be needed for all projects

### Option C: Merge Constitution into AGENTS.md
- Deprecate separate constitution file
- Fold principles into AGENTS.md

**Pros**: Single source of truth
**Cons**: Constitution serves different purpose (governance vs development guidelines)

## Decision

**Option A** is recommended: Keep AGENTS.md as primary reference, make constitution creation explicit only.

## Risks

- None significant — this is a clarification of existing behavior
- Existing explicit constitution creation via `/speckit.constitution` still works
