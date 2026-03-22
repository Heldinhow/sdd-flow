# Multi-Repo - Tasks

## Task 1: Fix getRepoRootForFeature
**File:** `multi-repo-workspace.ts:130-139`
**Issue:** Always returns primary repo, ignores multi-repo config
**Fix:** Use workspace.config.json to find correct repo
**Verification:** Multi-repo features resolve to correct paths

## Task 2: Remove or use unused exports
**File:** `multi-repo-workspace.ts`
**Issue:** Functions never called
**Fix:** Either implement or remove dead code
**Verification:** All exports are used or removed
