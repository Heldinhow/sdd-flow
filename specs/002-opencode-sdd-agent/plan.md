# Implementation Plan: Unified SDD Agent for OpenCode

**Branch**: `[002-opencode-sdd-agent]` | **Date**: 2026-03-20 | **Spec**: `specs/002-opencode-sdd-agent/spec.md`
**Input**: Feature specification from `/specs/002-opencode-sdd-agent/spec.md`

**Note**: This plan follows the `/speckit.plan` artifact structure while keeping the current feature workspace intact during planning.

## Summary

Build a repo-local OpenCode plugin and single-entry SDD workflow that bootstraps `.opencode` and `.specify`, guides users through specify, clarify, plan, and task preparation, and keeps all generated artifacts compatible with the existing spec-kit-style workflow. The technical approach is a Bun-first TypeScript OpenCode plugin runtime that reuses the current `.specify` scripts and templates as the deterministic backend while introducing a compatibility layer for non-destructive repository init and typed branch prefixes such as `feat-short-name`, plus a public scoped npm distribution and npm-first README guidance for end users.

## Technical Context

**Language/Version**: TypeScript 5.8 with ESM modules; Bun-first runtime with Node 22 compatibility  
**Primary Dependencies**: `@opencode-ai/plugin`, `@opencode-ai/sdk`, `zod`  
**Storage**: Repository filesystem for markdown planning artifacts and managed workflow assets  
**Testing**: `bun test` with fixture-based integration scenarios and focused unit tests for workflow resolution rules  
**Target Platform**: OpenCode on local developer machines (macOS/Linux first)  
**Distribution Target**: Public scoped npm package consumed from OpenCode config and installed automatically by OpenCode/Bun  
**Project Type**: OpenCode plugin and repository bootstrap toolkit  
**Performance Goals**: Reach a usable initialized workflow in one local setup pass, keep phase transitions fast enough that users do not leave the guided flow, and support many feature workspaces in one repository without manual repair  
**Constraints**: Plan-mode only agent behavior, markdown-only artifact writes by the agent, non-destructive merge into existing `.specify` and `.opencode` assets, backward-compatible planning artifacts, conventional English change-type branch prefixes, and documentation that matches OpenCode's real npm-plugin install behavior  
**Scale/Scope**: First release for one OpenCode-focused workflow package, one managed repository asset set, and multiple concurrent feature workspaces per repository  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The current constitution file is still an unfilled template, so there are no enforceable project-specific gates yet.
- Default planning gates applied for this feature:
  - Preserve markdown-only planning output for agent-driven steps.
  - Keep compatibility with existing `.specify` artifact names and locations.
  - Avoid destructive replacement of user-managed workflow assets.
  - Keep branch naming changes compatible with feature workspace resolution.
- Phase 0 status: PASS
- Post-Phase 1 design status: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-opencode-sdd-agent/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── repo-init.md
│   └── unified-sdd-workflow.md
└── tasks.md
```

### Source Code (repository root)

```text
.opencode/
├── command/
│   ├── sdd.md
│   └── speckit.*.md
├── src/
│   ├── branching/
│   ├── init/
│   ├── plugin/
│   └── workflow/
└── tests/
    ├── fixtures/
    ├── integration/
    └── unit/

.specify/
├── memory/
├── scripts/
│   └── bash/
└── templates/

specs/
└── [feature-workspaces]/

README.md
```

**Structure Decision**: Keep the runtime and orchestration code inside `.opencode/` beside the existing command assets, reuse `.specify/` as the deterministic backend for planning artifacts, and continue storing per-feature outputs under `specs/` so downstream workflow steps stay compatible.

## Distribution & Documentation Notes

- Publish the plugin from the existing `.opencode/` package boundary under the scoped name `@helldinhow/sdd-flow-opencode-plugin`.
- Document end-user installation through the OpenCode `plugin` config array instead of manual `npm install` commands.
- Recommend a global OpenCode config example for personal installation, while noting that project-level `opencode.json` is also supported for team-shared setup.
- Keep the clone-based setup as the contributor validation path until the public package is live, then retain it as a secondary Local Development flow.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Branch naming compatibility layer | The feature must replace numeric-only branch naming with typed prefixes such as `feat-short-name` while preserving workflow continuity | Keeping numeric-only branches would directly conflict with the approved specification and user requirement |
| Non-destructive managed asset merge | Repository init must work safely in brownfield repositories that already contain `.specify` or `.opencode` assets | Installing only into missing paths would leave stale managed assets in place and full overwrite would risk erasing local customizations |
| Dual-path onboarding documentation | The public npm package flow and the contributor clone flow must both exist without confusing first-time users | Documenting only the clone flow would bury the intended install story, while documenting only npm would leave contributors without a local validation path |
