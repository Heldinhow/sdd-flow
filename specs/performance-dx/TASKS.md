# Performance & DX - Tasks

## Task List

### Performance Fixes

#### Task 1.1: Fix N+1 file stats in detect-active-workspace
**File:** `detect-active-workspace.ts:63-65`
**Issue:** readdirSync + existsSync per file
**Fix:** Single pass with proper stat
**Verification:** Single directory scan

#### Task 1.2: Batch git commands in detect-active-workspace
**Files:** `detect-active-workspace.ts:17-44, 76-89`
**Issue:** Multiple execSync calls
**Fix:** Compound git commands or single process
**Verification:** Single git process per detection

#### Task 1.3: Optimize merge-managed-assets comparison
**File:** `merge-managed-assets.ts:37-38`
**Issue:** Full file read for comparison
**Fix:** Check size/mtime first
**Verification:** Files compared by metadata first

#### Task 1.4: Add file locking to approval-state
**File:** `approval-state.ts:52-55`
**Issue:** Concurrent writes can race
**Fix:** Atomic writes with rename
**Verification:** Concurrent saves don't corrupt

### DX Improvements

#### Task 2.1: Add progress indicator to long operations
**Description:** Show progress for:
- Test suite execution
- Bundle export/import
- Multi-repo operations
**Verification:** Progress visible for long ops

#### Task 2.2: Add operation timing
**Description:** Log execution time for operations
**Verification:** Times appear in logs

#### Task 2.3: Add parallel task marker support
**File:** `load-tasks.ts`
**Issue:** Only checks [P], not [PARALLEL]
**Fix:** Support both markers
**Verification:** [PARALLEL] tasks run concurrently
