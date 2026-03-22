# Plan: Performance Optimization

**Feature Branch**: `feat-performance-optimization`
**Created**: 2026-03-22

## Architecture Overview

Three targeted optimizations address real, observable call-frequency issues found in the
source code. A fourth (streaming export) is a NICE improvement deferred to a later cycle.

All changes are local to the affected module. No new shared state modules or caching layers
are introduced.

## File Structure

```
.opencode/
  src/
    plugin/
      index.ts                   # Modified: hoist discoverCommands out of hook closure
    workflow/
      approval-state.ts          # Modified: add module-level cache with invalidation
      detect-active-workspace.ts # Modified: early-exit after first uncommitted match
  tests/
    unit/
      plugin/
        index.test.ts            # Modified: assert discoverCommands called once
      workflow/
        approval-state.test.ts   # Modified: add cache hit/invalidation assertions
        detect-active-workspace.test.ts  # Modified: assert no extra git calls
```

## Technical Decisions

### TD-1: Hoist `discoverCommands` in `src/plugin/index.ts`

Current code:
```ts
const runner = new PreScriptRunner((name) => {
  const commands = discoverCommands(projectRoot);  // called every execution
  const entry = commands.get(name);
  return entry?.scripts ?? null;
});
```

Change to:
```ts
const commands = discoverCommands(projectRoot);  // called once at plugin init
const runner = new PreScriptRunner((name) => {
  const entry = commands.get(name);
  return entry?.scripts ?? null;
});
```

This is a one-line hoist. The `commands` Map is immutable after init, so it is safe to
reuse across invocations. The existing test in `implement-regression.test.ts` already
asserts this behavior and was fixed once before — the fix belongs in the source, not just
the test comment.

### TD-2: Module-level cache in `approval-state.ts`

Add a `Map<string, FeatureApprovals>` keyed by `repoRoot` at module scope:
```ts
const _cache = new Map<string, FeatureApprovals>();
```

`loadApprovals` checks the cache first; `saveApprovals` updates the cache after writing.
The cache key is the absolute `repoRoot` path.

This is safe for single-process use (standard plugin execution). Concurrent multi-process
access is not in scope.

Cache invalidation: `saveApprovals` updates `_cache.set(repoRoot, approvals)` immediately
after `writeFileSync`, ensuring the next `loadApprovals` in the same process sees the
updated value.

Tests that call `saveApprovals` implicitly invalidate the cache. Tests that write directly
to the file (bypassing `saveApprovals`) will see stale cache — this is acceptable and
documented as a known limitation.

### TD-3: Early-exit in `detectActiveWorkspace` after first uncommitted match

Current logic:
```ts
const withUncommitted = entries.filter((entry) =>
  hasUncommittedChanges(path.join(specsRoot, entry)),
);
if (withUncommitted.length === 1) return withUncommitted[0];
```

`Array.filter` always evaluates the predicate for every element. Replace with a `for` loop
that `break`s after finding one match:
```ts
let firstUncommitted: string | null = null;
let uncommittedCount = 0;
for (const entry of entries) {
  if (hasUncommittedChanges(path.join(specsRoot, entry))) {
    firstUncommitted = entry;
    uncommittedCount++;
    if (uncommittedCount > 1) break;  // ambiguous — fall through
  }
}
if (uncommittedCount === 1 && firstUncommitted) return firstUncommitted;
```

This short-circuits after finding one match in the common case. It still detects ambiguity
(multiple matches) without running the full filter.

## Dependencies

- No new npm dependencies.
- TD-1 must be validated against the existing `implement-regression.test.ts` test which
  already asserts `discoverCommands` is called once.
- TD-2 and TD-3 require updating existing test files to account for cache state between
  tests — use `afterEach` to clear the module-level cache if the cache is exported for
  testing.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Module-level cache in `approval-state.ts` leaks state between test cases | Medium | Export a `_clearApprovalCache()` function (or clear via `saveApprovals`) and call it in `beforeEach` |
| Hoisting `discoverCommands` means a newly added command file during a long session is not picked up | Very Low | SDD workflow does not hot-add commands; documentation note is sufficient |
| The `detectActiveWorkspace` loop change alters behavior for repos with exactly 2 workspaces having uncommitted changes | Low | Existing test asserts `workspace-a` is returned first; the loop preserves this by processing entries in sorted order |
