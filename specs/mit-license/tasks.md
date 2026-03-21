# Task Breakdown: MIT License Adoption

## Overview

**Feature**: MIT License Adoption
**Total Tasks**: 5
**Estimated Duration**: Less than half a day

## Phase 1: Canonical License Publication

- [X] **T001**: Create the root `LICENSE` file with the canonical MIT text and the approved holder/year.
  - **Type**: documentation
  - **Priority**: high
  - **Dependencies**: none
  - **Verification**: Confirm `LICENSE` exists and includes standard MIT wording plus `Copyright (c) 2026 Heldinhow`.

## Phase 2: Repository Discoverability

- [X] **T002**: Add a concise `License` section to `README.md` that points readers to the root `LICENSE` file.
  - **Type**: documentation
  - **Priority**: high
  - **Dependencies**: T001
  - **Verification**: Confirm `README.md` includes a short `License` section referencing `LICENSE`.

## Phase 3: Package Metadata Alignment

- [X] **T003**: Add or update the `license` field in `.opencode/package.json` to `MIT`.
  - **Type**: config
  - **Priority**: high
  - **Dependencies**: T001
  - **Verification**: Confirm `.opencode/package.json` contains `"license": "MIT"` and no unrelated metadata changed.

## Phase 4: Consistency Verification

- [X] **T004 [P]**: Review `LICENSE`, `README.md`, and `.opencode/package.json` together for consistent MIT wording and scope.
  - **Type**: testing
  - **Priority**: medium
  - **Dependencies**: T002, T003
  - **Verification**: Confirm all three surfaces reference the same MIT licensing decision and approved holder/year.

## Phase 5: Final Documentation Checkpoint

- [X] **T005**: Perform a final change review to ensure the implementation stayed within the approved spec and plan.
  - **Type**: documentation
  - **Priority**: medium
  - **Dependencies**: T004
  - **Verification**: Confirm only `LICENSE`, `README.md`, and `.opencode/package.json` require implementation changes for this feature.

## Execution Order

```text
T001 → T002 + T003 → T004 → T005
```

## Checkpoints

- **Checkpoint 1**: `T001` complete before any discoverability or metadata changes.
- **Checkpoint 2**: `T002` and `T003` complete before consistency review.
- **Checkpoint 3**: `T004` and `T005` complete before implementation handoff.

## Notes

- `T002` and `T003` may proceed in parallel after `T001` because both depend only on the canonical license decision.
- No source-code behavior changes, per-file headers, or broader legal-policy work are included in this task set.
