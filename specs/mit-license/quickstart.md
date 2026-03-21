# Quickstart: MIT License Adoption

## Summary of Planned Change

This feature adds standard MIT licensing to the repository through three conventional surfaces:

1. root `LICENSE`
2. `README.md` `License` section
3. `.opencode/package.json` `license` field

## Implementation Targets

- `LICENSE`
- `README.md`
- `.opencode/package.json`

## Verification Checklist

1. Open `LICENSE` and confirm it contains the standard MIT license text.
2. Confirm the copyright line is `Copyright (c) 2026 Heldinhow`.
3. Open `README.md` and confirm it has a short `License` section pointing to `LICENSE`.
4. Open `.opencode/package.json` and confirm it contains `"license": "MIT"`.
5. Confirm no unrelated repository files were changed as part of the implementation.

## Expected Outcome

- Repository visitors can discover the license quickly.
- Package tooling can report the project license correctly.
- The implementation remains limited to documentation and metadata.

## Breaking Changes

- None.
