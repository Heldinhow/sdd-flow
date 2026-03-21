# sdd-flow

<div align="center">
  <h3><em>Spec-Driven Development for OpenCode, from one visible agent.</em></h3>
</div>

<p align="center">
  <strong>Add <code>Spec Driven</code> to OpenCode, bootstrap SDD assets inside any repository, and keep planning output in markdown.</strong>
</p>

`sdd-flow` is an OpenCode-focused Spec-Driven Development workflow plugin and repository bootstrap kit.

It provides:
- a visible `Spec Driven` primary agent in OpenCode for guided SDD
- a repo-local `/sdd` backend for init, specify, clarify, plan, and tasks
- compatibility wrappers for `speckit.specify`, `speckit.clarify`, `speckit.plan`, and `speckit.tasks`
- repo bootstrap that installs and merges managed `.opencode/` and `.specify/` assets
- a markdown-only planning flow with typed branch prefixes like `feat-short-name`

## Get Started

### 1. Install the plugin globally

```bash
npm install -g @helldinhow/sdd-flow-opencode-plugin@latest
```

This also installs the `sdd-artifact-guard` skill to `~/.opencode/skills/`.

### 2. Add the plugin to OpenCode

Recommended for personal use: add the plugin to `~/.config/opencode/opencode.json`.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@helldinhow/sdd-flow-opencode-plugin"]
}
```

For a repo-shared setup, use the same `plugin` entry in a project-level `opencode.json` at the repository root. That file is separate from the managed `.opencode/` directory that `sdd-flow` bootstraps later.

> [!IMPORTANT]
> OpenCode installs npm plugins automatically at startup with Bun and caches their dependencies. Normal plugin usage does not require running `npm install` inside the target repository.



After saving the config, start or restart OpenCode in a repository so it can install the package and load the plugin.

### 3. Open any repository in OpenCode

```bash
opencode /path/to/your-repo
```

### 4. Select `Spec Driven`

- `Spec Driven` is the user-facing SDD entrypoint
- it runs in plan mode
- it only authors markdown planning artifacts under `specs/**/*.md`
- it relies on `/sdd` as the repo-local backend after bootstrap

After OpenCode loads the plugin, `Spec Driven` should appear in the available agent list. If it does not appear, restart OpenCode and confirm that the package name in your config is exactly `@helldinhow/sdd-flow-opencode-plugin`. If the package is still unpublished, use the Local Development flow below instead.

### 5. Let the repository bootstrap itself when needed

If the repository is missing SDD workflow assets, `Spec Driven` is designed to route you into the managed init path so the workflow can install or merge the stack non-destructively.

### 6. Continue the guided planning flow

After bootstrap:
- keep using `Spec Driven` as the conversational entrypoint
- let `/sdd` remain the canonical repo-local backend command
- expect repository state to drive resume behavior
- keep planning outputs in markdown artifacts under `specs/<feature>/`

## What It Does

- registers a visible `Spec Driven` primary agent in OpenCode
- keeps the guided agent in plan mode with markdown-only output
- bootstraps repo-local `.opencode/` and `.specify/` assets when they are missing
- preserves compatibility with the existing `speckit.*` command surface
- uses typed branch prefixes like `feat-short-name` instead of numeric-only names

## How It Works

1. Add the plugin package to OpenCode config.
2. Open a repository in OpenCode.
3. Select `Spec Driven`.
4. Bootstrap `.opencode/` and `.specify/` if the repository is not initialized yet.
5. Continue specification, clarification, planning, and task preparation through one guided flow.

## Repository Bootstrap

Managed assets currently include:

- `.opencode/command/` with `/sdd` and `speckit.*` wrappers
- `.opencode/plugin/`, `.opencode/plugins/`, and `.opencode/src/`
- `.opencode/package.json`, `.opencode/bun.lock`, `.opencode/tsconfig.json`, and `.opencode/.gitignore`
- `.specify/scripts/bash/`, `.specify/templates/`, and `.specify/memory/constitution.md`
- `AGENTS.md`

Bootstrap rules:

- preserve existing compatible user customizations in `.opencode/` and `.specify/`
- install or merge missing managed files non-destructively
- keep `Spec Driven` as the primary entrypoint while `/sdd` remains the repo-local backend

## Local Development

Use this path when contributing to the plugin itself or validating the flow before the public npm release is available.

```bash
git clone https://github.com/Heldinhow/sdd-flow.git
cd sdd-flow
opencode .
```

Then:

- OpenCode auto-loads `.opencode/plugins/sdd.ts`
- select `Spec Driven`
- the existing repo-local `.opencode/`, `.specify/`, and `specs/` assets let the workflow resume from the current planning state

If OpenCode does not install dependencies automatically for this cloned development repository on first load, run this once:

```bash
cd .opencode && bun install
```

## Project Layout

```text
.opencode/
.specify/
specs/
AGENTS.md
README.md
```

Main implementation paths:

- plugin runtime: `.opencode/src/`
- project plugin loader: `.opencode/plugins/sdd.ts`
- package export entrypoint: `.opencode/plugin/sdd.ts`
- command surface: `.opencode/command/`
- tests: `.opencode/tests/`
- workflow backend scripts and templates: `.specify/`

## Verification

Run from the repository root:

```bash
cd .opencode && bun test
cd .opencode && bunx tsc --noEmit
```

## Current Status

Validated today:

- OpenCode can auto-load the local project plugin from `.opencode/plugins/`
- the `Spec Driven` agent is registered and visible to OpenCode
- `Spec Driven` stays in plan mode and is permission-restricted to markdown planning artifacts
- the repo-local `/sdd` backend remains the workflow anchor

In progress:

- broader first-run bootstrap UX for arbitrary external repositories
- final end-user distribution polish around npm-based plugin installation plus repo bootstrap

## Goal

The long-term goal is to make OpenCode feel like a simpler, repo-local version of Spec Kit: one visible planning agent, guided clarification, typed branch naming, and reproducible markdown planning artifacts.
