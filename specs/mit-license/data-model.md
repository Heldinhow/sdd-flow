# Data Model: MIT License Adoption

## Overview

This feature does not introduce runtime entities or persistence changes. The only affected structures are repository metadata and documentation artifacts.

## Artifacts and Relationships

### `LICENSE`

- Type: root-level text artifact
- Purpose: canonical legal source for repository licensing
- Relationship: referenced by `README.md`; semantically matched by `.opencode/package.json`

### `README.md`

- Type: repository documentation artifact
- Purpose: human-readable discoverability for licensing
- Relationship: points readers to `LICENSE`

### `.opencode/package.json`

- Type: package metadata artifact
- Relevant field: `license`
- Purpose: machine-readable license declaration for tooling and package consumers
- Relationship: must align with `LICENSE`

## Field-Level Changes

| Artifact | Field / Section | Change |
|---------|------------------|--------|
| `LICENSE` | full document | Add standard MIT text |
| `README.md` | `License` section | Add concise pointer to `LICENSE` |
| `.opencode/package.json` | `license` | Add `MIT` |

## Integrity Rules

- `LICENSE` is the source of truth for repository licensing.
- `README.md` must not describe a different license than the root `LICENSE`.
- `.opencode/package.json` must declare the same license identifier as the repository license.

## API / Contract Impact

- No API endpoints change.
- No CLI behavior changes.
- No schema migrations or type updates are required.
