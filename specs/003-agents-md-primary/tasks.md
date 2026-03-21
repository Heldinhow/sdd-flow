# Tasks: AGENTS.md as Primary Reference

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel

## Implementation Tasks

### T001 [P] [DONE] Remove constitution from managed-assets.ts

**File**: `.opencode/src/init/managed-assets.ts`

Removed `SPECIFY_MEMORY: ".specify/memory/constitution.md"` from `MANAGED_ASSET_ROOT`.

**Verification**: Typecheck passes ✓

### T002 [P] [DONE] Update sdd.md init instructions

**File**: `.opencode/command/sdd.md`

Updated init instructions to reference AGENTS.md as primary guidelines and noted constitution is only created via `/speckit.constitution`.

**Verification**: Documentation updated ✓

### T003 [P] [DONE] Update speckit.analyze.md references

**File**: `.opencode/command/speckit.analyze.md`

Updated to load AGENTS.md first, constitution only if exists with real content.

**Verification**: Typecheck passes ✓

## Dependencies

- T001, T002, T003 were parallelizable (different files)

## Execution Order

1. T001, T002, T003 in parallel — COMPLETED
2. Typecheck verification — PASSED ✓
