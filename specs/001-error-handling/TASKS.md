# Error Handling - Tasks

## Task 1: Fix approval-state data loss
**File:** `approval-state.ts:47-49`
**Issue:** Silently discards corrupted JSON
**Fix:** Create backup before overwrite, log error clearly
**Verification:** `bun test approval-state.test.ts`

## Task 2: Fix sdd-pr-check exit codes
**File:** `.github/workflows/sdd-pr-check.yml`
**Issue:** Exit 0 on failure
**Fix:** Exit 1 when prerequisites missing
**Verification:** CI properly fails

## Task 3: Add structured error logging
**File:** `src/lib/logger.ts` (new)
**Description:** JSON logging with levels
**Verification:** Errors are structured
