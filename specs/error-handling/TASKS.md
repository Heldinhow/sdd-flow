# Error Handling - Tasks

## Task List

### Critical Fixes

#### Task 1.1: Fix approval-state data loss
**File:** `approval-state.ts:47-49`
**Issue:** Silently discards corrupted JSON
**Fix:** Create backup before overwrite, log error clearly
**Verification:** Corrupted JSON creates backup + error log

#### Task 1.2: Fix execSync error handling
**File:** `detect-active-workspace.ts:12-14`
**Issue:** Errors return false, indistinguishable from "not available"
**Fix:** Return structured result with error info
**Verification:** Errors are distinguishable

#### Task 1.3: Fix sdd-pr-check exit codes
**File:** `.github/workflows/sdd-pr-check.yml`
**Issue:** Exit 0 on failure, runs from wrong directory
**Fix:** Exit 1 on failure, run from repo root
**Verification:** CI properly fails when prerequisites missing

### Error Infrastructure

#### Task 2.1: Add Result type pattern
**File:** `src/lib/result.ts` (new)
**Description:** Type-safe error handling
**Verification:** Can be used in place of throwing

#### Task 2.2: Add structured logging
**File:** `src/lib/logger.ts` (new)
**Description:** JSON logging with levels
**Verification:** Logs are structured and informative

#### Task 2.3: Add error boundary for recovery
**File:** `src/lib/error-boundary.ts` (new)
**Description:** Wrap operations with automatic backup/recovery
**Verification:** Operations have fallback behavior
