# README & npm Distribution Design

**Feature**: `[002-opencode-sdd-agent]`  
**Date**: 2026-03-20  
**Status**: Approved

## Context

- The repository currently documents a clone-first contributor flow, but the intended product direction is a public npm plugin that OpenCode can load from config.
- The approved public package name is `@helldinhow/sdd-flow-opencode-plugin`.
- The README should feel more like `github/spec-kit`: short hero, quick onboarding, and scannable sections.

## Approved Decisions

### 1. Official distribution path

- Publish a public scoped npm package named `@helldinhow/sdd-flow-opencode-plugin`.
- Tell end users to add the package to the OpenCode `plugin` array.
- Do not make manual `npm install` commands part of the normal user path.

### 2. Installation model

- Recommend global OpenCode config for personal installation.
- Note that project-level `opencode.json` is also supported for team-shared setup.
- State clearly that OpenCode installs npm plugins automatically at startup and caches dependencies with Bun.

### 3. README information architecture

- Add a short hero with a clear OpenCode-focused value proposition.
- Put Get Started near the top with the OpenCode config snippet for `@helldinhow/sdd-flow-opencode-plugin`.
- Follow that with short sections for What It Does, How It Works, Repository Bootstrap, Local Development, and Verification.
- Keep internal implementation details and clone-based setup below the primary onboarding path.

### 4. Temporary status messaging before publication

- Until the npm package is published, keep a visible note that the npm flow is the target distribution model.
- Keep the current clone-based setup available for contributors and local validation.
- After publication, make the npm flow the default current path and keep cloning as a secondary contributor workflow.

### 5. Implementation impacts

- `.opencode/package.json` must become publish-ready for the scoped public package.
- The published package must expose a plugin entrypoint that OpenCode can import.
- `README.md` must be rewritten to lead with config-based installation instead of clone-first setup.

## Validation Signals

- A user can add `@helldinhow/sdd-flow-opencode-plugin` to OpenCode config and see `Spec Driven` after OpenCode starts.
- The README lets a first-time user understand the npm install flow without reading contributor setup instructions.
- Contributors can still clone the repository and validate the local plugin flow.
