# Feature Specification: MIT License Adoption

## Summary

**Feature Name**: MIT License Adoption
**Type**: Enhancement
**Status**: Draft for Approval
**Created**: 2026-03-21
**Source Request**: "como adicionar uma licença MIT nesse repo open source?"
**Clarifications**:
- Documentation scope approved: create `LICENSE`, add a short license section to `README`, and set package metadata to `MIT` when a package manifest exists.
- Copyright holder: `Heldinhow`
- Explicitly out of scope: adding source-file license headers.

## Problem Statement

The repository does not clearly publish an open source license for downstream users, contributors, and redistributors. Without an explicit MIT license file and matching repository/package metadata, users cannot easily determine their reuse rights and maintainers leave unnecessary ambiguity around distribution terms.

## User Stories

### Story 1: Discover repository licensing

**As a**: developer evaluating the repository
**I want**: to see the project license in the repository root and README
**So that**: I can quickly understand whether I may use, modify, and redistribute the project

**Acceptance Criteria**:
- [ ] A root-level `LICENSE` file contains the standard MIT license text.
- [ ] The MIT text includes `Copyright (c) 2026 Heldinhow`.
- [ ] `README.md` includes a short `License` section that points readers to the root `LICENSE` file.

### Story 2: Discover package licensing

**As a**: package consumer or tooling system
**I want**: package metadata to declare the MIT license
**So that**: ecosystem tooling can detect the license consistently

**Acceptance Criteria**:
- [ ] If a package manifest exists, it declares the license as `MIT`.
- [ ] The package metadata change aligns with the license published in the repository root.

## Requirements

### Functional Requirements

- [FR-1]: The repository must include a root-level `LICENSE` file with the standard MIT license text.
- [FR-2]: The MIT license text must name `Heldinhow` as the copyright holder.
- [FR-3]: `README.md` must expose a concise `License` section that references the MIT license.
- [FR-4]: Any existing package manifest used by the repository must declare `MIT` as its license value.

### Non-Functional Requirements

- [NFR-1]: The change must remain documentation/governance-only and must not introduce source-code behavior changes.
- [NFR-2]: The license text must be standard and recognizable by common open source tooling.
- [NFR-3]: The update must preserve discoverability by keeping licensing information in conventional locations.

## Design

### UI/UX

No application UI changes are required. The only user-facing documentation change is a short repository-level `License` section in `README.md`.

### API Design

No API changes are required.

### Data Model

No runtime data model changes are required. The relevant metadata surface is the package manifest `license` field, if present.

## Dependencies

- Existing repository documentation structure (`README.md`)
- Existing package manifest, if present (`.opencode/package.json`)

## Constraints

- Use the canonical MIT license text without custom terms.
- Do not add per-file license headers in this scope.
- Do not change project ownership history beyond the stated MIT copyright notice.

## Out of Scope

- Replacing MIT with another open source license
- Adding copyright/license headers to source files
- Broader legal policy, CLA, or contributor agreement work

## Success Criteria

- The repository root clearly publishes MIT licensing through `LICENSE`.
- Repository readers can discover licensing from `README.md` without searching.
- Package/tooling consumers can detect `MIT` from the package manifest when present.
