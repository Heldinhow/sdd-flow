# Quickstart: Package and Bootstrap the SDD Command Scaffold

## Goal

Validate that a normal npm installation of `@helldinhow/sdd-flow-opencode-plugin` exposes the full SDD command set and can materialize the repo-local scaffold non-destructively.

## Prerequisites

- OpenCode is installed and configured to load `@helldinhow/sdd-flow-opencode-plugin`
- The package build used for validation includes the package-local managed asset bundle
- A clean fixture repository is available for first-install testing

## Scenario 1: First-install command discovery

1. Start OpenCode in a clean repository with no local `.opencode/command/` directory.
2. Let OpenCode install/load `@helldinhow/sdd-flow-opencode-plugin` normally.
3. Open the slash-command palette.
4. Verify `/sdd-init`, `/sdd`, `/implement`, and the supported `speckit.*` commands appear.

**Expected result**: The plugin registers the full command set even though the consumer repo has not yet materialized local scaffold files.

## Scenario 2: Bootstrap/init materializes missing scaffold assets

1. In the same clean repository, run the bootstrap/init path exposed by the plugin.
2. Verify missing `.opencode/command/*` files are copied into the repo.
3. Verify required `.specify/scripts/bash/*`, `.specify/templates/*`, and `AGENTS.md` are also copied from the packaged bundle.

**Expected result**: The consumer repo receives the managed scaffold from the packaged bundle and is ready for normal repo-local SDD workflows.

## Scenario 3: Non-destructive merge behavior

1. Edit one managed scaffold file in the fixture repo to simulate a user customization.
2. Re-run bootstrap/init.
3. Verify the customized file remains unchanged.
4. Verify only missing assets are added and the customized file is reported for review.

**Expected result**: Bootstrap stays safe for brownfield repositories and does not silently overwrite customizations.

## Scenario 4: Packaging regression protection

1. Run the package/bootstrap-focused test suite.
2. Confirm it validates the bundled scaffold contents and package-shaped command registration.
3. Remove one required bundled asset path in a temporary test branch.
4. Re-run the same tests.

**Expected result**: The verification fails when a required scaffold asset is missing from the publishable package.

## Follow-Up

- After this fix lands, implementation should verify both the package boundary and the repo-local bootstrap path before release.
- If the package adds a generated bundle step, release documentation should note how maintainers refresh or validate the bundled scaffold.
