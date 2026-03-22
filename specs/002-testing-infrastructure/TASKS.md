# Testing Infrastructure - Tasks

## Task 1: Fix discoverCommands 4x calls
**File:** `implement-regression.test.ts`
**Issue:** discoverCommands called 4x redundantly
**Fix:** Call once and reuse
**Verification:** Single call in test

## Task 2: Add multi-repo-workspace tests
**File:** `tests/unit/workflow/multi-repo-workspace.test.ts` (new)
**Verification:** `bun test multi-repo-workspace`

## Task 3: Add export/import workspace tests
**Files:** `tests/unit/workflow/export-workspace.test.ts` (new)
**Files:** `tests/unit/workflow/import-workspace.test.ts` (new)
**Verification:** `bun test export-workspace import-workspace`
