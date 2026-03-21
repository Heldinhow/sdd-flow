# Implementation Plan: Package and Bootstrap the SDD Command Scaffold

**Branch**: `feat-sdd-init-implement-commands` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/feat-sdd-init-implement-commands/spec.md`

## Summary

Fix the normal-install experience for `@helldinhow/sdd-flow-opencode-plugin` by shipping a publishable managed-asset bundle inside the package, using that bundle as the bootstrap/init source of truth, and registering commands from bundled assets when a consumer repo has not yet materialized its local scaffold.

## Technical Context

**Language/Version**: TypeScript 5.8 with strict mode  
**Primary Dependencies**: `@opencode-ai/plugin` 1.2.27, `@opencode-ai/sdk` 1.2.27, Bun runtime  
**Storage**: Filesystem-managed scaffold assets bundled in the npm package and copied into consumer repositories  
**Testing**: Bun's built-in `bun:test`  
**Target Platform**: OpenCode plugin system, normal npm package installation flow  
**Project Type**: Publishable OpenCode plugin package with managed repo scaffold  
**Performance Goals**: Command discovery and bootstrap should stay file-system bound with negligible startup overhead for the small asset bundle  
**Constraints**: The publishable package boundary is `.opencode/`, so sibling repo assets like `.specify/*` and root `AGENTS.md` must be mirrored into a package-local bundle before release/runtime use  
**Scale/Scope**: Package manifest updates, asset-bundle source resolution, bootstrap wiring, command registration fallback, and packaging/bootstrap regression tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ AGENTS.md exists with current development guidance
- ✅ Change stays within the existing Bun + TypeScript plugin stack
- ✅ Behavior remains non-destructive for repo-local managed assets
- ✅ Plan preserves the existing guided SDD architecture instead of introducing a second workflow

## Files to Modify

| File | Change |
|------|--------|
| `.opencode/package.json` | **MODIFY** - Publish the bundled scaffold assets and any packaging/bootstrap script support |
| `.opencode/src/init/managed-assets.ts` | **MODIFY** - Resolve managed assets from a package-local bundled source instead of assuming repo-root siblings |
| `.opencode/src/init/run-init.ts` | **MODIFY** - Copy missing assets from the packaged bundle into the consumer repo |
| `.opencode/src/plugin/command-registry.ts` | **MODIFY** - Register commands from bundled assets when repo-local command markdown is absent |
| `.opencode/src/plugin/index.ts` | **MODIFY** - Wire bootstrap-aware command registration and any startup scaffold sync needed before discovery |
| `.opencode/scripts/install-skill.js` or a replacement bootstrap script | **MODIFY/REPLACE** - Expand install/bootstrap behavior if runtime bootstrap needs a package-side helper |
| `.opencode/tests/unit/init/repo-init.test.ts` | **MODIFY** - Cover bundled asset manifest resolution and non-destructive bootstrap from package assets |
| `.opencode/tests/unit/plugin/command-registry.test.ts` | **MODIFY** - Cover command registration from the packaged scaffold when the consumer repo is empty |
| `.opencode/tests/integration/...` | **CREATE/MODIFY** - Add package-shaped install/bootstrap regression coverage if unit tests alone are insufficient |
| `.opencode/<package-local-bundle>/**` | **CREATE** - Store publishable copies of `.opencode/command`, `.specify`, and `AGENTS.md` inside the package boundary |

## File Details

### 1. Package-local bundled scaffold

**Purpose**: Make every managed repo asset publishable from the `.opencode/` package boundary.

**Planned shape**:

```text
.opencode/
├── managed-assets/
│   ├── .opencode/
│   │   └── command/
│   ├── .specify/
│   │   ├── scripts/bash/
│   │   └── templates/
│   └── AGENTS.md
```

**Decision**: Use a package-local mirrored bundle instead of relying on repo siblings, because npm publication from `.opencode/package.json` cannot safely include `../.specify` or `../AGENTS.md`.

### 2. `.opencode/package.json`

**Purpose**: Publish the bundle and protect it from being omitted again.

**Changes**:
- Add the bundled scaffold directory to `files`
- Keep the plugin entrypoint export unchanged
- If needed, replace the narrow `postinstall` behavior with a bootstrap-oriented script contract that does more than install one skill

### 3. `.opencode/src/init/managed-assets.ts`

**Purpose**: Treat the bundled scaffold as the canonical source of truth.

**Changes**:
- Point `MANAGED_ASSET_ROOT` at the package-local bundle
- Keep the emitted `relativePath` values repo-relative (for example `.opencode/command/sdd.md`)
- Preserve asset grouping behavior used by init/merge logic

### 4. `.opencode/src/plugin/command-registry.ts`

**Purpose**: Decouple command discovery from the presence of pre-existing repo-local command files.

**Changes**:
- Resolve command templates from repo-local scaffold first when present
- Fall back to the packaged command bundle when the consumer repo is empty or incomplete
- Keep command descriptions and handoff metadata sourced from the same markdown templates that will later be materialized into the repo

### 5. `.opencode/src/plugin/index.ts`

**Purpose**: Ensure command discovery works during the first normal install experience.

**Changes**:
- Wire the command registry against the bootstrap-aware source resolver
- If required, run a non-destructive startup sync for missing `.opencode/command` files before command registration
- Preserve current Spec Driven agent behavior and repo initialization checks

### 6. Tests

**Purpose**: Block regressions at the package boundary.

**Coverage targets**:
- Bundled asset manifest contains command markdown, `.specify` scripts/templates, and `AGENTS.md`
- Bootstrap/init copies missing assets from the bundle without overwriting customized local files
- Command registration works against a package-shaped install where the consumer repo starts empty
- Packaging verification fails when the bundle omits any required scaffold path

## Project Structure

### Documentation (this feature)

```text
specs/feat-sdd-init-implement-commands/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
.opencode/
├── package.json
├── managed-assets/               # NEW publishable scaffold bundle
├── command/                      # Existing authoring source for command markdown
├── scripts/
│   └── install-skill.js
├── src/
│   ├── init/
│   │   ├── managed-assets.ts
│   │   └── run-init.ts
│   └── plugin/
│       ├── command-registry.ts
│       └── index.ts
└── tests/
    ├── integration/
    └── unit/
        ├── init/repo-init.test.ts
        └── plugin/command-registry.test.ts
```

**Structure Decision**: Keep the package rooted at `.opencode/`, but introduce a mirrored bundle directory inside that boundary so npm publication and runtime bootstrap can both rely on files that actually ship in the package.

## Complexity Tracking

> No constitution violations. The added complexity is limited to making the package boundary explicit and testable.

| Aspect | Status |
|--------|--------|
| Package boundary explicitly modeled | ✅ Required to publish `.specify` and `AGENTS.md` safely |
| Repo-local bootstrap remains non-destructive | ✅ Preserves current merge semantics |
| Command discovery no longer depends on pre-existing consumer scaffold | ✅ Fixes first-install failure mode |

## Implementation Phases

### Phase 1: Bundle the managed scaffold inside the package

**Outcome**: Every repo-init asset needed by the workflow exists inside the publishable `.opencode/` boundary.

### Phase 2: Make bootstrap/init consume the bundle

**Outcome**: `runInit` and manifest generation copy from bundled assets instead of repo-root sibling files.

### Phase 3: Make command discovery work before local scaffold exists

**Outcome**: `/sdd-init`, `/sdd`, `/implement`, and `speckit.*` register from bundled assets on first install, while repo-local scaffold remains the long-term source after bootstrap.

### Phase 4: Add packaging/bootstrap regression coverage

**Outcome**: Release-time tests fail if the package no longer contains or exposes the scaffold correctly.

## Dependencies

- Phase 1 is foundational; later phases depend on the bundle existing inside the package
- Phase 2 depends on Phase 1 because bootstrap/init must read from the new bundled source
- Phase 3 depends on Phase 1 and may share source-resolution helpers with Phase 2
- Phase 4 depends on all earlier phases so it can exercise the final publish/install behavior

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Bundle diverges from authoring sources | Generate or mirror the bundle from a single canonical source and cover it with tests |
| Startup bootstrap becomes destructive | Reuse existing merge plan semantics and keep differing files in review state |
| Commands register from the wrong source | Prefer repo-local scaffold when present, packaged fallback only when needed |
| Package fix only covers commands, not init assets | Explicitly test `.specify` and `AGENTS.md` coverage in the packaged bundle |

## Verification Checklist

- [ ] Packaged bundle contains the full SDD command scaffold
- [ ] Packaged bundle contains required `.specify` scripts/templates and `AGENTS.md`
- [ ] `runInit` copies missing assets from the bundled source
- [ ] Existing customized managed files are preserved for review
- [ ] Command registration works when the consumer repo starts without `.opencode/command/`
- [ ] `/sdd-init`, `/sdd`, `/implement`, and supported `speckit.*` commands appear in the first-install flow
- [ ] Packaging/bootstrap regression tests fail when a required bundled asset is removed
