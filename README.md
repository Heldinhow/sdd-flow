# sdd-flow

<div align="center">
  <h1>sdd-flow</h1>
  <p><strong>Spec-Driven Development for OpenCode</strong></p>
  <p>One visible planning agent, one repository-owned workflow, and a full path from idea to implementation without making the user manually orchestrate <code>/speckit.*</code> commands.</p>
</div>

---

## What This Project Is

`sdd-flow` is an OpenCode plugin that brings a complete Spec-Driven Development workflow into a repository.

Instead of jumping from a feature idea straight into code, the workflow guides the team through:

1. repository bootstrap
2. feature specification
3. clarification of ambiguity
4. implementation planning
5. task generation
6. execution

The output is a versioned planning package inside `specs/<feature>/` that your team owns in Git:

- `spec.md`
- `plan.md`
- `research.md`
- `data-model.md`
- `quickstart.md`
- `tasks.md`

The result is a workflow that is inspectable, auditable, reusable, and much easier to hand off between people and agents.

---

## Why This Exists

This project was created to make Spec-Driven Development feel natural inside OpenCode.

Tools like [Spec Kit](https://github.com/github/spec-kit) are strong references for spec-first development, but they still assume the user knows which command to run next and when to move between phases. In practice, that creates friction:

- users need to remember `specify`, `clarify`, `plan`, `tasks`, and `implement`
- the workflow can feel like a toolbox instead of a guided system
- the command surface is powerful, but not very approachable for day-to-day agent-first usage

`sdd-flow` keeps the strengths of the spec-driven model while changing the user experience:

- **one user-facing planning agent**: `Spec Driven`
- **one internal repo-local backend workflow** used automatically by `Spec Driven`
- **one bootstrap step**: `/sdd-init`
- **one execution entrypoint**: `/implement`

The main design goal is simple:

> put the flow in the hands of the agent, not in the memory of the user.

That means the user should mostly:

1. initialize once with `/sdd-init`
2. switch to `Spec Driven`
3. describe the feature they want
4. review and approve each phase
5. run `/implement` when planning is complete

The agent should handle the rest.

---

## What Makes It Different From Spec Kit

`sdd-flow` is not anti-Spec Kit. It is an adaptation of spec-driven principles for OpenCode's agent model.

### Spec Kit style

- command-oriented
- user often decides which phase command to invoke
- strong artifact discipline
- good for teams already comfortable with the command set

### sdd-flow style

- agent-oriented
- the `Spec Driven` agent owns the planning flow
- the user approves phase transitions instead of manually driving them
- repo-local workflow assets are installed directly into the repository
- compatibility wrappers still exist for `speckit.*`, but they are not the primary UX

Put another way:

- **Spec Kit** is a strong command model for spec-driven work
- **sdd-flow** is a guided OpenCode experience built on the same spec-first philosophy

---

## Core Concepts

| Concept | Role |
|---------|------|
| **`Spec Driven`** | The visible OpenCode planning agent. It stays in plan mode and writes markdown artifacts only. |
| **`/sdd-init`** | One-time repository bootstrap. Installs or merges the managed SDD scaffold. Runs in the build agent. |
| **Internal SDD backend** | Repo-local workflow contract used automatically by `Spec Driven` to orchestrate the SDD phases. |
| **`/implement`** | Build-mode execution command. Loads planning artifacts and executes `tasks.md`. |
| **Managed assets** | The repository scaffold installed by init: `.opencode/`, `.specify/`, `specs/`, and `AGENTS.md`. |
| **Compatibility wrappers** | `speckit.*` commands preserved for compatibility, but not required in the normal flow. |

---

## The Recommended User Flow

The intended workflow is:

```text
configure plugin → /sdd-init → Spec Driven conversation → approve each phase → /implement
```

### Short version

1. Add the plugin to OpenCode.
2. In a new repository, run `/sdd-init` once using the build agent.
3. Switch to `Spec Driven`.
4. Describe the feature in natural language.
5. Let the agent carry the workflow from spec to tasks.
6. Approve each phase before it advances.
7. Run `/implement` when the planning package is ready.

### Important UX principle

In the normal flow, the user should **not** need to keep typing:

- `/speckit.specify`
- `/speckit.clarify`
- `/speckit.plan`
- `/speckit.tasks`

That sequencing is exactly what `sdd-flow` is trying to remove from the user's mental load.

---

## Installation

Add the plugin to your OpenCode config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@helldinhow/sdd-flow-opencode-plugin"]
}
```

You can place this in:

- `~/.config/opencode/opencode.json` for personal/global use
- `opencode.json` inside a repository for project-level use

OpenCode installs npm plugins automatically at startup.

---

## Step 1: Repository Bootstrap With `/sdd-init`

`/sdd-init` is the one-time setup step for a repository.

Run it with the **build** agent:

```text
/sdd-init
```

### Why it runs in build mode

Bootstrap needs write access because it creates and merges the repository scaffold.

### What `/sdd-init` installs or merges

- `.specify/`
  - shell workflow scripts
  - planning templates
  - constitution storage
- `.opencode/`
  - command definitions
  - plugin runtime files
  - local OpenCode integration points
- `specs/`
  - feature workspace root
- `AGENTS.md`
  - repository development guidelines

### What happens during `/sdd-init`

1. It creates the directory structure needed for SDD.
2. It installs the workflow templates and shell backends.
3. It installs the OpenCode command surface and plugin assets.
4. It helps create the repository constitution.
5. It verifies that the scaffold is usable.

### Non-destructive behavior

`/sdd-init` is designed for brownfield repositories too.

When a managed file already exists, the init flow classifies it as:

- **ADD**: safe to copy
- **KEEP**: preserve as-is
- **REVIEW**: existing file differs and should be reviewed instead of overwritten

This is one of the most important design decisions in the project: initialization should be safe, not destructive.

---

## Step 2: Plan Features With `Spec Driven`

After bootstrap, switch to the `Spec Driven` agent.

From this point on, the intended user experience is conversational:

> “I want to add X.”

The `Spec Driven` agent uses the internal repo-local SDD backend automatically and carries the planning package through its phases.

### What the user does

- describe the feature
- answer clarification questions when needed
- review generated artifacts
- explicitly approve each major phase before the workflow advances

### What the agent does

- creates the feature workspace
- routes the workflow to the correct phase
- writes the planning artifacts
- keeps phase ordering correct
- generates tasks automatically when planning is complete

### Key behavior

Every phase transition is approval-gated.

That means:

- `spec.md` is produced first
- the workflow waits for approval
- clarification happens only if needed
- planning artifacts are created next
- the workflow waits for approval again
- `tasks.md` is generated after planning is complete

The user stays in one conversation instead of having to remember which command to invoke next.

---

## What Happens In Each SDD Stage

### 1. Specify

The workflow converts the user's request into a proper feature specification.

Primary output:

- `spec.md`

What goes into it:

- user stories
- acceptance criteria
- functional requirements
- edge cases
- success criteria

This stage answers:

- What are we building?
- Who is it for?
- How do we know it is done?

### 2. Clarify

If the specification still has high-impact ambiguity, the workflow enters a clarification loop.

What happens here:

- the agent asks focused questions
- answers are written back into the planning package
- the flow does not move forward until ambiguity is resolved enough to plan safely

This stage exists to prevent weak specs from becoming expensive implementation mistakes.

### 3. Plan

Once the spec is approved, the workflow creates the technical implementation package.

Primary outputs:

- `plan.md`
- `research.md`
- `data-model.md` when applicable
- `quickstart.md`

What goes into it:

- architecture and file structure
- technical decisions and rationale
- data entities and relationships
- implementation constraints
- verification and usage patterns

This stage answers:

- How should we build it?
- What tradeoffs did we choose?
- What context will implementation need?

### 4. Tasks

When the planning package is complete and approved, the workflow generates `tasks.md`.

Primary output:

- `tasks.md`

What goes into it:

- phased task breakdown
- user-story-oriented slices
- dependency ordering
- parallelizable work markers
- implementation checkpoints

This stage answers:

- What exactly needs to be done?
- In what order?
- What can happen in parallel?

### 5. Implement

Execution begins only after the planning package is complete.

Run:

```text
/implement
```

`/implement` switches to the build agent, loads the planning artifacts, checks the active feature workspace, and starts execution from `tasks.md`.

---

## Files Generated By The Workflow

Each feature gets its own workspace under:

```text
specs/<feature-branch>/
```

Typical generated files:

| File | Meaning |
|------|---------|
| `spec.md` | Product and behavior definition |
| `plan.md` | Technical implementation strategy |
| `research.md` | Decisions, constraints, and rationale |
| `data-model.md` | Entities and relationships when the feature needs them |
| `quickstart.md` | Verification commands and usage examples |
| `tasks.md` | Execution checklist for implementation |

This artifact package is the main deliverable of the planning phase.

---

## How `/implement` Works

`/implement` is the transition from planning to code execution.

### What it does

1. checks prerequisites and finds the active feature workspace
2. requires `tasks.md`
3. loads `plan.md`
4. loads complementary artifacts when present
5. moves into build-mode execution
6. follows the task breakdown phase by phase

### What it loads

- `tasks.md` as the execution source of truth
- `plan.md` as the technical reference
- `research.md`, `data-model.md`, and `quickstart.md` when available

### What it should do for the user

The correct behavior of `/implement` is operational, not documentary.

It should:

- start implementation
- report concrete blockers
- use the planning package as context

It should not:

- explain the command markdown file
- ask the user to manually reconstruct planning context
- behave like a plain text prompt with no workflow state

---

## Workflow Guarantees

### 1. Artifact ordering

The workflow enforces a strict sequence:

- spec before plan
- plan before tasks
- tasks before implementation

### 2. Approval gates

The workflow does not silently jump from one planning stage to the next.

The user must approve the output before the next stage begins.

### 3. Session-scoped workspaces

Each new `Spec Driven` session starts a fresh feature workspace by default.

Existing workspaces are resumed only when the user explicitly asks to continue one.

### 4. Repo-owned artifacts

The planning package lives in the repository, not in hidden agent state.

That makes it:

- reviewable
- versionable
- shareable
- resilient to session changes

### 5. Non-destructive bootstrap

Initialization is safe for existing repositories and local customization.

---

## Compatibility With `speckit.*`

The project still ships compatibility wrappers:

- `/speckit.specify`
- `/speckit.clarify`
- `/speckit.plan`
- `/speckit.tasks`
- `/speckit.implement`
- `/speckit.constitution`

These exist to reduce migration friction and preserve familiar entrypoints.

But the recommended workflow is:

- `Spec Driven` for planning
- `/sdd-init` for bootstrap
- `/implement` for execution

---

## Architecture Map

### User-facing command templates

- `.opencode/command/sdd.md` - internal planning backend contract used by `Spec Driven`
- `.opencode/command/sdd-init.md`
- `.opencode/command/implement.md`

### Plugin runtime

- `.opencode/src/plugin/spec-driven-agent.ts`
- `.opencode/src/plugin/index.ts`
- `.opencode/src/plugin/command-registry.ts`

### Workflow orchestration

- `.opencode/src/workflow/phase-router.ts`
- `.opencode/src/workflow/orchestrate-planning.ts`
- `.opencode/src/workflow/run-guided-sdd.ts`
- `.opencode/src/workflow/context-loader.ts`

### Repository initialization

- `.opencode/src/init/run-init.ts`
- `.opencode/src/init/merge-managed-assets.ts`
- `.opencode/src/init/managed-assets.ts`

### Managed bundle published to npm

- `.opencode/managed-assets/`

### Shell backends

- `.specify/scripts/bash/check-prerequisites.sh`
- `.specify/scripts/bash/create-new-feature.sh`
- `.specify/scripts/bash/setup-plan.sh`

---

## Local Development

```bash
git clone https://github.com/Heldinhow/sdd-flow.git
cd sdd-flow
opencode .
```

OpenCode auto-loads `.opencode/plugins/sdd.ts` for local development.

If dependencies are missing:

```bash
cd .opencode && bun install
```

### Validation

```bash
cd .opencode && bunx tsc --noEmit
cd .opencode && bun test
cd .opencode && bun run prepublishOnly
```

---

## Contributing

When changing workflow behavior:

1. update the authoring source in `.opencode/command/` or `.opencode/src/`
2. keep `.opencode/managed-assets/` aligned with what is published
3. run typecheck and tests before opening a PR
4. preserve the non-destructive init behavior
5. preserve the approval-gated planning flow

---

## Project Layout

```text
sdd-flow/
├── .opencode/
│   ├── command/              # Authoring source for /sdd, /sdd-init, /implement, speckit.*
│   ├── managed-assets/       # Bundle published to npm
│   ├── plugin/               # Package export entry
│   ├── plugins/              # Local OpenCode loader
│   ├── src/
│   │   ├── init/             # Non-destructive bootstrap runtime
│   │   ├── plugin/           # Agent and command registration
│   │   └── workflow/         # Phase routing and planning orchestration
│   └── tests/                # Unit and integration tests
├── .specify/
│   ├── scripts/bash/         # Shell workflow backends
│   ├── templates/            # Artifact templates
│   └── memory/               # Constitution storage
├── specs/                    # Feature workspaces
├── AGENTS.md                 # Repository development guidance
└── README.md
```

---

## License

This project is licensed under the MIT License. See `LICENSE` for the full text.
