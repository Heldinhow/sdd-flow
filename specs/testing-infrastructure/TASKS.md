# Testing Infrastructure - Tasks

## Task List

### Pre-requisites
- [ ] Task 0.1: Run existing tests to establish baseline

### Test Coverage

#### Task 1.1: Fix discoverCommands redundant calls
**File:** `implement-regression.test.ts`
**Description:** Call discoverCommands once and reuse instead of 4x
**Verification:** Test file passes, single call

#### Task 1.2: Add tests for multi-repo-workspace
**Files:** `tests/unit/workflow/multi-repo-workspace.test.ts` (new)
**Description:** Cover all exported functions
**Verification:** `bun test multi-repo-workspace`

#### Task 1.3: Add tests for export/import workspace
**Files:** `tests/unit/workflow/export-workspace.test.ts` (new)
**Files:** `tests/unit/workflow/import-workspace.test.ts` (new)
**Description:** Cover bundle creation and extraction
**Verification:** `bun test export-workspace import-workspace`

#### Task 1.4: Add tests for spec-quality-review
**File:** `tests/unit/workflow/spec-quality-review.test.ts` (new)
**Description:** Test score calculation and criteria checking
**Verification:** `bun test spec-quality-review`

### Test Quality

#### Task 2.1: Add test helpers module
**File:** `tests/helpers/index.ts` (new)
**Description:** Shared utilities for mocking git, fs, etc.
**Verification:** Helpers can be imported and used

#### Task 2.2: Add integration tests for CLI
**File:** `tests/integration/cli.test.ts` (new)
**Description:** Test full CLI workflows
**Verification:** Integration tests pass

### Performance

#### Task 3.1: Mark parallelizable tests with [P]
**Description:** Identify tests that can run in parallel
**Verification:** Tests marked appropriately

#### Task 3.2: Add test timing benchmarks
**Description:** Track test execution times
**Verification:** Benchmark report generated
