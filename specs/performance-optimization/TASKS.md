# Tasks: Performance Optimization

**Feature Branch**: `feat-performance-optimization`
**Created**: 2026-03-22

## Phase 1: Hoist `discoverCommands` Out of the Hook Closure

- [ ] PERF001 In `src/plugin/index.ts`, move the `discoverCommands(projectRoot)` call from inside the `PreScriptRunner` callback to before the `runner` construction, storing the result in a `const commands` variable
- [ ] PERF002 Update the `PreScriptRunner` callback to use the hoisted `commands` Map
  [depends on: PERF001]
- [ ] PERF003 In `tests/unit/plugin/index.test.ts`, add a test that verifies the `runner` closure references the pre-computed `commands` Map (assert via module import or by confirming the existing `implement-regression.test.ts` still passes)
  [depends on: PERF001]

**Verification**: `cd .opencode && bun test tests/unit/plugin/ tests/unit/workflow/implement-regression.test.ts`

## Phase 2: Module-Level Approval State Cache

- [ ] PERF004 In `src/workflow/approval-state.ts`, add a `const _approvalCache = new Map<string, FeatureApprovals>()` at module scope
- [ ] PERF005 Modify `loadApprovals` to return `_approvalCache.get(repoRoot)` if present; otherwise read the file, store in cache, and return
  [depends on: PERF004]
- [ ] PERF006 Modify `saveApprovals` to update `_approvalCache.set(repoRoot, approvals)` after the `writeFileSync` call
  [depends on: PERF004]
- [ ] PERF007 Export a `_clearApprovalCacheForTesting()` function from `approval-state.ts` that calls `_approvalCache.clear()`; call it in `beforeEach` of `tests/unit/workflow/approval-state.test.ts`
  [depends on: PERF005, PERF006]
- [ ] PERF008 Add a test: call `loadFeatureApproval` 5 times; spy on `readFileSync` and assert it is called at most once
  [depends on: PERF007]
- [ ] PERF009 Add a test: after `saveFeatureApproval`, a subsequent `loadFeatureApproval` returns the updated value without re-reading the file
  [depends on: PERF007]

**Verification**: `cd .opencode && bun test tests/unit/workflow/approval-state.test.ts`

## Phase 3: Early-Exit in `detectActiveWorkspace`

- [ ] PERF010 In `src/workflow/detect-active-workspace.ts`, replace the `entries.filter(hasUncommittedChanges)` call with a `for` loop that tracks `firstUncommitted` and `uncommittedCount`, breaking as soon as `uncommittedCount > 1`
- [ ] PERF011 Apply the same early-exit pattern to the `hasRecentEdits` fallback loop
  [depends on: PERF010]
- [ ] PERF012 In `tests/unit/workflow/detect-active-workspace.test.ts`, add a test: with a single workspace that has a `spec.md`, confirm `detectActiveWorkspace` returns it without needing to call `hasUncommittedChanges` (assert via spy or by checking return value matches `workspace-a` in sorted order)
  [depends on: PERF010]

**Verification**: `cd .opencode && bun test tests/unit/workflow/detect-active-workspace.test.ts`

## Phase 4: Full Suite Verification

- [ ] PERF013 [P] Run `bunx tsc --noEmit` to confirm no new type errors from the cache export
- [ ] PERF014 [P] Run `bun test` and confirm all tests pass with zero regressions
  [depends on: PERF001–PERF012]

**Verification**: `cd .opencode && bunx tsc --noEmit && bun test`
