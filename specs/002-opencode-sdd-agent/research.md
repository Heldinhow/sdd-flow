# Research: Unified SDD Agent for OpenCode

## Runtime and Package Model

- **Decision**: Build the runtime as a TypeScript ESM package inside `.opencode/`, using Bun as the primary runtime and maintaining Node 22 compatibility.
- **Rationale**: The local workspace already contains `.opencode/package.json`, `.opencode/bun.lock`, and the `@opencode-ai/plugin` package, which exposes a plugin contract aligned with Bun and modern TypeScript. This keeps the implementation consistent with the current repository shape and avoids introducing a parallel runtime stack.
- **Alternatives considered**:
  - **Node-only runtime**: Rejected because the existing local package evidence points to Bun-first workflows and there is no current Node-only setup to align with.
  - **Shell-only orchestration**: Rejected because the unified agent needs richer session, tool, and command coordination than shell scripts alone can safely provide.

## Workflow Orchestration Strategy

- **Decision**: Keep `.specify/scripts/bash/*` and `.specify/templates/*` as the deterministic backend, and add one OpenCode entrypoint that orchestrates the full guided workflow.
- **Rationale**: The repository already models the phased workflow through `.opencode/command/speckit.specify.md`, `.opencode/command/speckit.clarify.md`, `.opencode/command/speckit.plan.md`, and `.opencode/command/speckit.tasks.md`. Reusing those templates and scripts preserves compatibility with existing artifacts while simplifying the user experience around a single entrypoint.
- **Alternatives considered**:
  - **Rewrite the full flow from scratch**: Rejected because it would discard proven artifact conventions and increase migration risk.
  - **Keep only separate phase commands**: Rejected because the approved specification requires a unified guided flow.

## Branch Naming and Feature Resolution

- **Decision**: Adopt filesystem-safe branch names in the form `<type>-<short-name>`, for example `feat-opencode-sdd-agent`, and update feature resolution logic to recognize conventional change-type prefixes instead of numeric-only prefixes.
- **Rationale**: The user explicitly rejected numeric-first branch names and asked for English change-type prefixes such as `feat`, `fix`, `refactor`, `init`, and `test`. A hyphenated format keeps the branch name easy to map to feature workspaces and environment variables without introducing slash-handling edge cases.
- **Alternatives considered**:
  - **`type/short-name` format**: Rejected for the first release because current workflow assets frequently derive paths and identifiers from branch-like strings, and a slash separator would require extra normalization logic.
  - **Keep numeric prefixes and add type labels elsewhere**: Rejected because it would not satisfy the approved branch naming requirement.
  - **Use separate numeric feature IDs plus typed alias branches**: Rejected for the first release because it adds coordination overhead before the unified flow proves out.

## Repository Initialization Policy

- **Decision**: Initialize repositories by merging managed `.opencode` and `.specify` assets non-destructively, preserving compatible customizations and only replacing managed content when the migration logic can do so safely.
- **Rationale**: The approved specification requires brownfield-safe initialization, and the current spec-kit-style assets are already organized as managed templates, scripts, and command files. A non-destructive merge policy reduces adoption risk and keeps local overrides viable.
- **Alternatives considered**:
  - **Overwrite managed assets**: Rejected because it risks deleting local customizations.
  - **Install only into missing paths**: Rejected because it would leave stale managed files untouched and create inconsistent workflow states.

## Planning Artifact Set

- **Decision**: Generate `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and contract documents during planning, while leaving `tasks.md` for the later task-generation phase.
- **Rationale**: The existing `/speckit.plan` workflow expects the planning package to include those supporting artifacts, and the approved feature specification explicitly requires the unified workflow to support them when relevant.
- **Alternatives considered**:
  - **Create only `plan.md`**: Rejected because it would weaken compatibility with the current flow and remove inputs needed by downstream task generation.
  - **Create `tasks.md` during planning**: Rejected because the existing workflow clearly separates planning and task decomposition into different phases.

## Agent Context Update Strategy

- **Decision**: Create or update a repo-local `AGENTS.md` during the planning phase using the same managed-asset policy and only add technology/context introduced by this plan.
- **Rationale**: The existing automation expects an agent-context update after planning, and the repository currently lacks a repo-local `AGENTS.md`. Creating it now documents the new planning stack and keeps future agent sessions aligned with the intended runtime.
- **Alternatives considered**:
  - **Skip the agent context file**: Rejected because the current flow expects agent guidance to evolve with the plan.
  - **Write agent context outside the repository**: Rejected because the workflow needs repo-local, shareable guidance.
