# CLI Improvements - Tasks

## Task List

### Pre-requisites
- [ ] Task 0.1: Ensure clean test baseline

### CLI Fixes

#### Task 1.1: Fix `--bootstrap` flag handling
**File:** `cli/sdd.ts:170`
**Description:** Remove or fix the `--bootstrap` flag that create-new-feature.sh doesn't recognize
**Verification:** `sdd init --bootstrap` should work without errors

#### Task 1.2: Fix cmdWorkspaces dead code
**File:** `cli/sdd.ts:225-249`
**Description:** Remove empty `entries` array or fix the logic to populate it
**Verification:** `sdd workspaces list` shows correct workspace list

#### Task 1.3: Fix getScriptPath return value
**File:** `cli/lib/script-resolver.ts`
**Description:** Return `null` instead of non-existent path when scripts are missing
**Verification:** Missing scripts return `null`, not invalid path

### Testing

#### Task 2.1: Add CLI integration tests
**File:** `cli/**/*.test.ts` (new)
**Description:** Add unit tests for CLI commands
**Verification:** `bun test cli/` passes

#### Task 2.2: Add script resolver tests
**File:** `cli/lib/script-resolver.test.ts` (new)
**Description:** Test script resolution edge cases
**Verification:** All resolution scenarios covered

### Documentation

#### Task 3.1: Update CLI documentation
**File:** `README.md` or `docs/cli.md`
**Description:** Document all CLI commands and options
**Verification:** Documentation matches actual behavior
