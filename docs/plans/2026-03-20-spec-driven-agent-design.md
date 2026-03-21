# Spec Driven Agent Design

## Context

This design refines the active OpenCode SDD workflow so installation exposes a visible OpenCode agent named `Spec Driven` while keeping the repo-local `/sdd` command as the canonical workflow backend.

## Approved Decisions

- `Spec Driven` is the primary user-facing entrypoint in OpenCode and is configured as a primary plan-mode agent.
- Repository initialization still installs `/sdd` into `.opencode/command/` as the repo-local, versionable workflow backend.
- The visible agent does not fork the workflow logic; it routes into the same guided SDD flow used by `/sdd`.
- Existing compatibility commands `speckit.specify`, `speckit.clarify`, `speckit.plan`, and `speckit.tasks` remain available.
- The workflow stays plan-mode only and is limited to markdown artifact generation.
- Direct `Spec Driven` edits are restricted to markdown planning artifacts only.
- Non-markdown managed assets are installed by the managed init backend, not authored by the agent.

## Installation Experience

After plugin installation, OpenCode shows an agent named `Spec Driven` in the agent picker. A user should be able to select that agent without needing prior knowledge of `/sdd`. That agent behaves like a restricted planning agent: it can guide the workflow and author markdown planning artifacts, but it should not generate source code.

When `Spec Driven` starts inside a repository that is not yet prepared for SDD, it detects missing managed assets and enters the non-destructive initialization flow. That flow installs the managed workflow assets, including `/sdd`, `speckit.*` compatibility wrappers, `.specify` templates, scripts, and supporting guidance files.

## Runtime Architecture

The OpenCode plugin remains responsible for registering the visible agent and injecting the base SDD context. The repo-local `/sdd` command remains the single source of truth for workflow orchestration, including init, specify, clarify, plan, tasks, and completion routing.

`Spec Driven` should be configured with granular edit permissions that deny non-markdown paths and only allow markdown planning artifacts such as `specs/**/*.md`. Its bash access should also be constrained to the minimal repo-inspection commands and managed SDD workflow scripts needed for planning. If repository bootstrap needs non-markdown files such as `.specify` scripts or runtime assets, that work must happen through the managed init backend rather than through agent-authored edits.

This keeps the UX simple while preserving repository-local traceability and compatibility. The agent becomes the entry surface, while `/sdd` remains the durable workflow contract stored with the repository.

## Workflow Routing

`Spec Driven` resolves the repository root, inspects the managed workflow markers, detects the active feature workspace, and then routes to the next phase based on artifact state:

- missing repo setup -> `init`
- missing `spec.md` -> `specify`
- outstanding material ambiguity -> `clarify`
- missing `plan.md` -> `plan`
- missing `tasks.md` -> `tasks`
- complete artifact package -> `complete`

The workflow persists state in repository markdown artifacts, not in the live conversation. This allows safe resumption when the session ends and the user later selects `Spec Driven` again.

## Error Handling And Limits

- Missing repo setup should never surface as an opaque failure; the flow should fall back to guided init.
- Existing `.specify` or `.opencode` assets must be merged non-destructively.
- Clarification must remain sequential and only trigger for high-impact ambiguity.
- Existing active feature workspaces should be reused instead of creating duplicates.
- The agent must not generate source code or non-markdown implementation artifacts.
- Any non-markdown workflow assets required for initialization must be copied by the managed backend, not manually authored by `Spec Driven`.

## Validation

The design is successful when the following scenarios work end-to-end:

1. Plugin installation makes `Spec Driven` visible in OpenCode as a restricted primary plan-mode agent.
2. Selecting `Spec Driven` in an uninitialized repository starts guided init and installs `/sdd`.
3. Selecting `Spec Driven` in a partially prepared repository resumes from the correct phase.
4. A user can reach `tasks.md` without manually switching among phase commands.

## Traceability Notes

Related feature workspace: `specs/002-opencode-sdd-agent/`

Approved clarifications captured from the specification conversation:

- The installed OpenCode experience must expose a visible agent named `Spec Driven`.
- The user-facing entrypoint is the agent, while `/sdd` remains the repo-local backend installed during initialization.
- `Spec Driven` must behave like a plan-mode agent that only authors markdown planning artifacts and does not generate code.
