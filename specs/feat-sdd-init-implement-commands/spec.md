# Spec: Package and Bootstrap the SDD Command Scaffold

**Feature Branch**: `feat-sdd-init-implement-commands`  
**Created**: 2026-03-21  
**Status**: Draft  
**Input**: Fix the packaging/bootstrap flow in `@helldinhow/sdd-flow-opencode-plugin` so the full SDD slash command set appears in OpenCode after normal installation. Reused the active workspace instead of opening a second overlapping branch.

> Primary guided workflow: `/sdd` (with `speckit.*` compatibility wrappers)

## Problem

The plugin now loads and command registration code exists, but the packaged distribution does not carry or install the managed scaffold assets that command discovery depends on.

Today the consumer repository is missing `.opencode/command/*.md` after normal installation, so OpenCode cannot surface `/sdd-init`, `/implement`, `/sdd`, and the `speckit.*` commands from the installed workflow. The package boundary also makes this broader than command markdown alone: the init/merge backend expects `.specify` assets and `AGENTS.md`, but those assets currently live outside the publishable `.opencode` package root.

## Goal

Make the public npm package self-sufficient for SDD bootstrap by bundling the managed scaffold assets inside the published package, using that bundle as the source of truth for repo initialization/bootstrap, and ensuring the full SDD slash command set is discoverable in a normal consumer install.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Commands appear after normal installation (Priority: P1)

A developer adds `@helldinhow/sdd-flow-opencode-plugin` to OpenCode and opens a repository that does not yet contain the SDD scaffold. OpenCode should still expose the SDD slash commands that ship with the plugin instead of requiring a manual copy of `.opencode/command/*.md` first.

**Why this priority**: This is the visible user failure. If the commands are not discoverable, the plugin feels broken even though it loaded.

**Independent Test**: Install the published package into a clean fixture repo, start OpenCode/plugin initialization, and verify `/sdd-init`, `/sdd`, `/implement`, and `speckit.*` are registered.

**Acceptance Scenarios**:

1. **Given** a clean repository with no local `.opencode/command/`, **When** the installed plugin initializes, **Then** the SDD command set is still registered from packaged scaffold assets
2. **Given** the package is installed normally from npm, **When** OpenCode opens the command palette, **Then** `/sdd-init`, `/sdd`, `/implement`, and the compatibility `speckit.*` commands appear
3. **Given** the packaged scaffold includes command markdown frontmatter, **When** commands are registered, **Then** descriptions and handoff agents match the bundled command files

---

### User Story 2 - Bootstrap and init can materialize the managed scaffold safely (Priority: P1)

A developer uses the installed plugin to initialize or repair a repository. The managed init backend should copy missing scaffold files from the packaged asset bundle into the target repo without overwriting local customizations.

**Why this priority**: Discoverability alone is not enough; the repo still needs the scaffold on disk so later planning and resume flows work consistently.

**Independent Test**: Run the bootstrap/init flow against a fixture repo with missing assets and custom overrides, then verify missing managed files are added while modified local files remain flagged for review.

**Acceptance Scenarios**:

1. **Given** the published package bundle contains managed assets, **When** repo init runs, **Then** missing `.opencode/command/`, `.specify/`, and `AGENTS.md` files are copied from the bundle into the target repo
2. **Given** a target repo already contains a customized managed file, **When** bootstrap/init runs, **Then** the file is not overwritten and is reported for review instead
3. **Given** a target repo is missing only part of the scaffold, **When** bootstrap/init runs, **Then** only the missing managed files are added

---

### User Story 3 - Packaging regressions are blocked before release (Priority: P2)

A maintainer preparing a new release gets automated coverage that fails if the publishable package no longer contains the scaffold required for command discovery and bootstrap.

**Why this priority**: The current bug escaped because runtime logic existed without packaging validation. Release-time checks must guard the asset bundle.

**Independent Test**: Run package-focused tests against the package boundary and verify they fail when required bundled scaffold paths are absent.

**Acceptance Scenarios**:

1. **Given** the package manifest changes, **When** the packaging test suite runs, **Then** it verifies the bundled managed asset set includes the command scaffold and init assets
2. **Given** a required bundled asset path is removed, **When** tests run, **Then** the release is blocked by a failing packaging/bootstrap test
3. **Given** the plugin resolves its managed asset source, **When** tests run in a package-shaped fixture, **Then** the source root does not rely on sibling repo files outside the published package boundary

---

### Edge Cases

- A consumer repo has no local scaffold at all, so the plugin must still expose enough commands to let the user initialize the repo
- A consumer repo has partial scaffold content from an older plugin version
- A consumer repo has customized command markdown or templates that must not be overwritten silently
- The package boundary cannot directly publish sibling repo files like `.specify/*` or root `AGENTS.md`, so the bundle must live inside the publishable package tree

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The published npm package for `@helldinhow/sdd-flow-opencode-plugin` MUST include a package-local managed asset bundle that contains the SDD command scaffold and repo-init assets required by the workflow
- **FR-002**: The packaged managed asset bundle MUST include markdown command files for `/sdd-init`, `/sdd`, `/implement`, and all supported `speckit.*` compatibility commands
- **FR-003**: The packaged managed asset bundle MUST include the `.specify` scripts/templates and `AGENTS.md` content needed by the managed init backend
- **FR-004**: The plugin MUST resolve managed assets from the packaged bundle rather than assuming those assets exist as sibling files outside the published package root
- **FR-005**: The plugin MUST register the SDD command set even when the consumer repository does not yet contain local `.opencode/command/*.md` files
- **FR-006**: The bootstrap/init flow MUST copy missing scaffold assets from the packaged bundle into the consumer repository non-destructively
- **FR-007**: The bootstrap/init flow MUST preserve existing customized managed files by keeping them in place and reporting them for review instead of overwriting them automatically
- **FR-008**: The consumer repository MUST end up with local scaffold assets after bootstrap/init so later planning and resume flows use repo-local state consistently
- **FR-009**: Packaging/build verification MUST fail if any required bundled scaffold asset needed for command discovery or repo initialization is missing from the publishable package
- **FR-010**: The public plugin entrypoint and command metadata registration behavior MUST remain compatible with OpenCode's normal npm installation flow

### Key Entities

- **Packaged Managed Asset Bundle**: The publishable directory inside the npm package that mirrors repo-local managed assets used for bootstrap and command discovery
- **Consumer Repository Scaffold**: The `.opencode`, `.specify`, and `AGENTS.md` files materialized into the target repository from the packaged bundle
- **Command Registration Source**: The resolved set of markdown command templates used by the plugin when registering slash commands

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A package-shaped installation fixture proves the published artifact contains every required SDD command markdown file and repo-init scaffold asset
- **SC-002**: In a clean consumer repo fixture, the installed plugin registers `/sdd-init`, `/sdd`, `/implement`, and the supported `speckit.*` commands without requiring a manually pre-created `.opencode/command/` directory
- **SC-003**: In bootstrap/init tests, 100% of missing managed scaffold files are copied from the packaged bundle while differing local files remain untouched and are reported for review
- **SC-004**: A regression that removes a required bundled scaffold path causes automated packaging/bootstrap verification to fail before release
