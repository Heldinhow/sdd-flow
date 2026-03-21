# Research: Package and Bootstrap the SDD Command Scaffold

**Feature Branch**: `feat-sdd-init-implement-commands`
**Date**: 2026-03-21

## Research Questions

### Q1: What is the current publish-time root cause?

**Finding**: `.opencode/package.json` publishes only `plugin/**/*.ts`, `src/**/*.ts`, `skills/**/*.md`, and `scripts/**/*.js`. It does not publish the command markdown scaffold, and it cannot directly publish sibling repo assets like `.specify/*` or root `AGENTS.md` because the package root is `.opencode/`.

**Evidence**:
- `.opencode/package.json` `files` list omits `command/**/*.md`
- `.opencode/package.json` is itself inside `.opencode/`, so repo siblings are outside the package boundary

**Decision**: Introduce a package-local managed-asset bundle inside `.opencode/` and publish that bundle explicitly.

---

### Q2: Why is command registration alone not enough?

**Finding**: `registerCommands(config, projectRoot)` currently discovers commands only from `projectRoot/.opencode/command`. If the consumer repo has never been bootstrapped, discovery returns nothing even though the plugin loaded correctly.

**Evidence**:
- `.opencode/src/plugin/index.ts` calls `registerCommands(config, projectRoot)`
- `.opencode/src/plugin/command-registry.ts` reads only `path.join(projectRoot, ".opencode", "command")`

**Decision**: Add a packaged-asset fallback so the plugin can register commands before repo-local scaffold exists.

---

### Q3: What does repo init already do well that should be preserved?

**Finding**: `runInit()` already builds a manifest, computes a merge plan, adds only missing files, and preserves customized files by marking them for review.

**Evidence**:
- `.opencode/src/init/run-init.ts` copies only `MERGE_ACTION.ADD` assets
- `.opencode/src/init/merge-managed-assets.ts` returns `REVIEW` when source and target contents differ

**Decision**: Keep the existing non-destructive merge semantics and only change the managed asset source.

---

### Q4: What is missing from the current managed asset source model?

**Finding**: `buildManagedAssetManifest(sourceRoot)` assumes the source root contains repo-local paths like `.opencode/command`, `.specify/templates`, and `AGENTS.md`. That works in this repository, but not in a published package rooted at `.opencode/` unless those assets are mirrored into a package-local bundle.

**Evidence**:
- `.opencode/src/init/managed-assets.ts` enumerates `.opencode/command`, `.specify/scripts/bash`, `.specify/templates`, and `AGENTS.md`

**Decision**: Make the bundle the canonical runtime source and keep emitted `relativePath` values repo-relative.

---

### Q5: Should bootstrap rely on `postinstall` alone?

**Finding**: The current `postinstall` script only copies the `sdd-artifact-guard` skill into the user's home directory. It does not materialize repo-local scaffold assets or help command discovery in the consumer repo.

**Evidence**:
- `.opencode/package.json` runs `node scripts/install-skill.js`
- `.opencode/scripts/install-skill.js` installs a skill but does not inspect or modify the active project repo

**Decision**: Do not depend on the current `postinstall` behavior for repo bootstrap. The runtime/plugin layer must handle first-install command discovery, and the init backend must handle repo-local scaffold materialization.

---

### Q6: What release guard was missing?

**Finding**: Existing tests cover repo init merge behavior and command registration behavior, but they do not validate the package boundary or a package-shaped installation where repo-local scaffold is initially absent.

**Evidence**:
- `.opencode/tests/unit/init/repo-init.test.ts` validates merge behavior against this repo root
- `.opencode/tests/unit/plugin/command-registry.test.ts` exists, but packaging failure still escaped

**Decision**: Add coverage that exercises package-shaped asset resolution and empty-consumer-repo command registration.

---

## Technical Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Bundle managed assets inside `.opencode/` | npm publication cannot rely on sibling repo files outside the package root |
| Keep repo-local relative paths in the manifest | Init/merge logic already expects target paths like `.opencode/command/...` and `.specify/...` |
| Register commands from repo-local scaffold first, packaged bundle second | Preserves local customization while fixing the first-install experience |
| Preserve existing non-destructive merge semantics | Current merge behavior already protects customized consumer files |
| Add package-boundary regression tests | Prevents runtime fixes from shipping without the scaffold assets they depend on |

## Risks Identified

1. **Risk**: The bundle becomes stale relative to the authoring sources  
   **Mitigation**: Make the bundle generation/update path explicit and cover required file presence in tests

2. **Risk**: A packaged fallback registers commands that differ from later repo-local copies  
   **Mitigation**: Source both from the same bundled markdown templates and keep repo-local copies aligned with the bundle

3. **Risk**: The fix patches only `.opencode/command` and misses `.specify` or `AGENTS.md`  
   **Mitigation**: Treat the full managed scaffold as the package contract, not just the command directory

## References

- `.opencode/package.json`
- `.opencode/src/plugin/index.ts`
- `.opencode/src/plugin/command-registry.ts`
- `.opencode/src/init/managed-assets.ts`
- `.opencode/src/init/run-init.ts`
- `.opencode/src/init/merge-managed-assets.ts`
- `.opencode/scripts/install-skill.js`
- `.opencode/tests/unit/init/repo-init.test.ts`
