# Implementation Plan: MIT License Adoption

## Overview

**Feature**: MIT License Adoption
**Status**: Draft for Approval
**Created**: 2026-03-21
**Approved Input**: `specs/mit-license/spec.md`

This plan introduces standard MIT licensing metadata to the repository without changing runtime behavior. The work is limited to conventional discovery points: root license text, README license documentation, and package manifest metadata.

## Goals

- Publish a canonical MIT license at the repository root.
- Make license discovery obvious in repository documentation.
- Ensure package metadata reports `MIT` consistently for tooling.

## Non-Goals

- Adding license headers to source files.
- Changing runtime code, APIs, or plugin behavior.
- Introducing alternative licenses, dual licensing, or contributor agreements.

## Technical Context

- Repository type: OpenCode plugin/workflow repository with markdown planning artifacts and a Bun-based package in `.opencode/`.
- Affected documentation surface: root `README.md`.
- Affected metadata surface: `.opencode/package.json`.
- New required governance artifact: root `LICENSE`.
- Verification style: direct file inspection and manifest consistency checks.

## Constitution Check

- Markdown-only planning flow is preserved; this plan defines only markdown artifacts.
- The eventual implementation remains documentation/governance-only and avoids application behavior changes.
- No destructive repository changes are required.
- The plan maintains traceability to the original request and accepted clarifications.

## Project Structure

### Files to Create

- `LICENSE`

### Files to Modify

- `README.md`
- `.opencode/package.json`

### Planning Artifacts

- `specs/mit-license/spec.md`
- `specs/mit-license/plan.md`
- `specs/mit-license/research.md`
- `specs/mit-license/data-model.md`
- `specs/mit-license/quickstart.md`

## Approach

### Architecture

Use conventional open source repository locations so humans and tooling both detect the license with no custom logic. The implementation centers on one source of legal text (`LICENSE`) and two discoverability mirrors: the README section for readers and the package manifest `license` field for ecosystem tooling.

### Alternatives Considered

1. **License file only** - rejected because it leaves README readers and package tooling with weaker discoverability.
2. **Per-file license headers everywhere** - rejected because it expands scope substantially without being required for standard MIT publication in this repository.
3. **Custom license text variant** - rejected because standard MIT wording is clearer and better recognized by tooling.

## Implementation Details

### Phase 1: Publish canonical license text

**Duration**: Short
**Dependencies**: Approved spec

#### Tasks

- [ ] Create a root-level `LICENSE` file using the standard MIT text.
- [ ] Set the copyright line to `Copyright (c) 2026 Heldinhow`.
- [ ] Confirm the final text is unmodified beyond year and holder replacement.

### Phase 2: Expose license in repository documentation

**Duration**: Short
**Dependencies**: Phase 1

#### Tasks

- [ ] Add a concise `License` section to `README.md`.
- [ ] Link the section to the root `LICENSE` file.
- [ ] Keep the README change minimal and aligned with the existing documentation tone.

### Phase 3: Align package metadata

**Duration**: Short
**Dependencies**: Phase 1

#### Tasks

- [ ] Add or update the `license` field in `.opencode/package.json` to `MIT`.
- [ ] Ensure the manifest value matches the repository license exactly.
- [ ] Avoid unrelated package metadata changes.

### Phase 4: Verify consistency

**Duration**: Short
**Dependencies**: Phases 1-3

#### Tasks

- [ ] Re-read `LICENSE`, `README.md`, and `.opencode/package.json` for consistency.
- [ ] Confirm the README and manifest both point to the same MIT licensing decision.
- [ ] Confirm no additional legal/governance surfaces were unintentionally changed.

## Data Model Impact

- New artifact: repository-level `LICENSE` text document.
- Existing metadata updated: `.opencode/package.json` `license` field.
- No runtime data models, schemas, or APIs are affected.

## Complexity Tracking

| Area | Complexity | Notes |
|------|------------|-------|
| Legal text insertion | Low | Standard MIT template with only holder/year substitution |
| README update | Low | Single small section addition |
| Package metadata alignment | Low | One-field manifest change |
| Regression risk | Low | No code-path changes |

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Incorrect MIT wording | Medium | Low | Use canonical MIT text and only substitute year/holder |
| Manifest/documentation mismatch | Medium | Low | Verify `LICENSE`, `README.md`, and `.opencode/package.json` together |
| Over-scoping into broader legal policy | Low | Medium | Keep implementation constrained to approved spec and explicit out-of-scope items |

## Testing Strategy

- Use direct content verification rather than runtime tests because the change is documentation/metadata-only.
- Validate that `LICENSE` contains recognizable MIT wording and the approved holder/year.
- Validate that `README.md` and `.opencode/package.json` both reflect MIT licensing.

## Success Metrics

- `LICENSE` exists at the repository root with standard MIT content.
- `README.md` contains a discoverable `License` section.
- `.opencode/package.json` declares `MIT` in its `license` field.

## Open Questions

- None at planning time.
