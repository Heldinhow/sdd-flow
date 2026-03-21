# Data Model: Package and Bootstrap the SDD Command Scaffold

**Feature Branch**: `feat-sdd-init-implement-commands`
**Date**: 2026-03-21

## Status: Lightweight filesystem model only

This fix does not introduce application data entities or persistence schemas, but it does rely on a small filesystem-facing model that should stay explicit during implementation.

## File-Oriented Entities

### Packaged Managed Asset Bundle

- **Purpose**: Publishable source of truth for scaffold files that must ship with the npm package
- **Contents**: Mirrored `.opencode/command/*`, `.specify/scripts/bash/*`, `.specify/templates/*`, and `AGENTS.md`
- **Key rule**: Every bundled file maps to a repo-relative target path in the consumer repository

### Consumer Repository Scaffold

- **Purpose**: Repo-local materialized copy of managed assets used by normal SDD workflows after bootstrap/init
- **Contents**: `.opencode/command/*`, `.specify/*`, `AGENTS.md`, and any other managed files copied from the package
- **Key rule**: Missing files can be added automatically; differing existing files are preserved and reported for review

### Command Registration Source

- **Purpose**: The resolved markdown template set used when populating `config.command`
- **Resolution order**:
  1. Repo-local scaffold when present
  2. Packaged managed asset bundle when repo-local command files are absent
- **Key rule**: Metadata for descriptions and handoffs must come from the same template source that OpenCode will execute

## Relationships

- The **Packaged Managed Asset Bundle** is the upstream source used by both command registration fallback and repo bootstrap/init
- The **Consumer Repository Scaffold** is the downstream materialized state created from the bundle
- The **Command Registration Source** resolves to either the repo-local scaffold or the packaged bundle depending on repository state

## Invariants

- Bundled asset relative paths must remain stable repo-relative targets
- Repo bootstrap must never overwrite a customized consumer scaffold file automatically
- Command discovery must not fail solely because the consumer repo has not yet materialized `.opencode/command/*.md`
