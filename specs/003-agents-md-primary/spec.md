# Spec: AGENTS.md as Primary Reference

## Problem

The Spec Driven agent currently:
1. Auto-creates `.specify/memory/constitution.md` from template during `/sdd init`
2. Treats the unfilled template as if it contains actual governance principles
3. References constitution.md in analyze commands even when it's just placeholder text

**Reality**: constitution.md is still an unfilled template (per 002-opencode-sdd-agent/plan.md line 29), containing only placeholder tokens like `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`.

## Goal

Make `AGENTS.md` the authoritative source for development guidelines. Constitution should only exist when explicitly created via `/speckit.constitution` with real filled principles.

## Scope

### In Scope
- Update `managed-assets.ts` to NOT auto-create constitution.md
- Update `command/sdd.md` init instructions
- Update `command/speckit.analyze.md` to check AGENTS.md first, constitution only if exists with real content
- Ensure AGENTS.md has all core conventions

### Out of Scope
- Changing `/speckit.constitution` command (still works when user explicitly wants to create constitution)
- Modifying templates

## User Stories

### US1: Init does not create blank constitution
**As a** developer running `/sdd init`  
**I want** the system to NOT create an empty constitution.md template  
**So that** I don't have governance files with placeholder text treated as real constraints

### US2: Spec Driven agent references AGENTS.md
**As a** developer using Spec Driven agent  
**I want** the agent to consult AGENTS.md for development conventions  
**So that** I get guidance based on actual filled content, not template placeholders

## Technical Notes

- AGENTS.md is already well-filled with real content
- constitution.md is just a template with `[BRACKETED_PLACEHOLDERS]`
- The change is additive: removes auto-creation, doesn't break explicit constitution creation
