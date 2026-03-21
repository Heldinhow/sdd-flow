# Research: MIT License Adoption

## Background

The repository currently documents project purpose, installation, and workflow behavior in `README.md`, and it publishes package metadata from `.opencode/package.json`. For open source consumers, the common expectation is that licensing appears in a root `LICENSE` file, is discoverable from the README, and is machine-readable from the package manifest when the project is distributed through package tooling.

## Existing Repository Signals

- `README.md` is the main human-readable entrypoint for repository visitors.
- `.opencode/package.json` is the current package manifest and does not yet declare a `license` field.
- No separate legal or contributor-policy files are required for the requested scope.

## Options Considered

### Option 1: Add only `LICENSE`

**Pros**:
- Minimal change set
- Satisfies the core legal publication requirement

**Cons**:
- Weaker discoverability for README readers
- Package tooling may not surface the license clearly

**Decision**: Rejected in favor of better discoverability.

### Option 2: Add `LICENSE`, README section, and manifest metadata

**Pros**:
- Matches common open source repository conventions
- Covers both human readers and tooling consumers
- Keeps scope small and non-invasive

**Cons**:
- Touches three surfaces instead of one

**Decision**: Accepted.

### Option 3: Add per-file license headers too

**Pros**:
- Strong file-level attribution visibility

**Cons**:
- High churn for little practical benefit here
- Expands review surface significantly

**Decision**: Rejected as out of scope.

## Decision Rationale

Option 2 best fits the approved request because it makes licensing explicit in the standard places without changing runtime behavior or introducing legal-policy complexity. It also keeps the resulting implementation easy to review and easy for downstream tools to recognize.

## Risks Identified

- Using altered MIT text could create unnecessary ambiguity.
- Forgetting the package manifest would leave machine-readable metadata incomplete.
- Over-expanding the change into contributor/legal policy work would delay a simple repository-governance update.

## Final Decision

Proceed with:

1. Root `LICENSE` using canonical MIT text
2. `README.md` `License` section
3. `.opencode/package.json` `license: "MIT"`

Approved holder value: `Heldinhow`
