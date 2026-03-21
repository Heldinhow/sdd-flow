# sdd-flow

<div align="center">
  <h1>sdd-flow</h1>
  <p><strong>Spec-Driven Development for OpenCode</strong></p>
  <p>A plugin that injects a guided SDD workflow into your repository development — one visible agent, one consistent process, markdown artifacts you own.</p>
</div>

---

## What Problem It Solves

`sdd-flow` is an OpenCode plugin that brings Spec-Driven Development to any repository. Instead of starting a feature request with a blank slate, the workflow guides you through specification, clarification, planning, and task preparation — producing a complete, traceable artifact set in `specs/<feature>/` before a single line of code is written.

It is inspired by [Spec Kit](https://github.com/github/spec-kit) and [OpenSpec](https://github.com/Fission-AI/OpenSpec) as reference models for spec-first, artifact-driven development, adapted specifically for the OpenCode agent experience.

## Key Concepts

| Concept | Role |
|---------|------|
| **`Spec Driven`** | The visible planning agent registered by the plugin. Stays in plan mode. Only authors markdown. |
| **`/sdd`** | The repo-local backend command that orchestrates the full guided workflow under `Spec Driven`. |
| **`/sdd-init`** | A **one-time** bootstrap step that installs or merges managed workflow assets into a repository. Runs in build mode. |
| **`/implement`** | Transitions to build mode and executes the work defined in `tasks.md`, phase by phase. |
| **Managed assets** | The packaged scaffold (`.opencode/`, `.specify/`, `AGENTS.md`) that `sdd-init` installs or merges non-destructively. |
| **Artifact guard** | The [`sdd-artifact-guard` skill](#workflow-guarantees) enforces the correct ordering and completeness of SDD artifacts. |

---

## How the Workflow Works

The end-to-end flow has four distinct stages. Read this section to understand what each step does and which agent or command owns it.

```
install → /sdd-init → Spec Driven + /sdd → /implement
```

### Stage 1 — Install and Configure

Install the plugin globally and add it to your OpenCode configuration.

```bash
npm install -g @helldinhow/sdd-flow-opencode-plugin@latest
```

Add it to your OpenCode config (`~/.config/opencode/opencode.json` or a project-level `opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@helldinhow/sdd-flow-opencode-plugin"]
}
```

OpenCode installs npm plugins automatically at startup. No `npm install` inside the target repository is needed.

### Stage 2 — One-Time Repository Bootstrap (`/sdd-init`)

**This step runs once per repository. Do not repeat it for each new feature.**

Open any repository in OpenCode, switch to the **build** agent, and run:

```
/sdd-init
```

`/sdd-init` uses the build agent because it needs write access to create the managed asset directories and files. It installs or merges the following into the target repository:

- `.specify/` — workflow scripts, templates, and constitution storage
- `.opencode/` — command surface and plugin runtime integration
- `specs/` — feature workspace root
- `AGENTS.md` — development guidelines for the repository

**Non-destructive by design.** If a file already exists, `/sdd-init` surfaces it for review instead of overwriting it. Your customizations are preserved.

After init completes, switch back to **Spec Driven** to start planning.

### Stage 3 — Plan with `Spec Driven` + `/sdd`

Once the repository is initialized, use **`Spec Driven`** as your conversational planning agent. It stays in plan mode and only writes markdown planning artifacts. All backend orchestration goes through `/sdd`.

The full planning loop is:

```
Spec Driven + /sdd
  ├── specify      → spec.md (user stories, acceptance criteria, requirements)
  ├── clarify      → iterative Q&A to resolve ambiguity
  ├── plan         → plan.md + research.md + data-model.md + quickstart.md
  └── tasks        → tasks.md (phase-by-phase task breakdown)
```

Each artifact lives in `specs/<branch-name>/`:

| Artifact | Purpose |
|----------|---------|
| `spec.md` | Feature specification with user stories and acceptance scenarios |
| `plan.md` | Implementation plan with architecture, tech stack, and file structure |
| `research.md` | Technical decisions, constraints, options considered, and rationale |
| `data-model.md` | Entity definitions and data relationships (when applicable) |
| `quickstart.md` | Quick verification commands and integration patterns |
| `tasks.md` | Task breakdown organized by phase and user story |

**Session-scoped workspace rule.** Every new `Spec Driven` session creates a fresh workspace under `specs/` by default. Resume an existing workspace only when you explicitly ask to continue a named feature or branch.

### Stage 4 — Execute with `/implement`

When the planning package is complete, run:

```
/implement
```

`/implement` loads the planning artifacts and transitions to the **build** agent to execute the work described in `tasks.md`. It runs phase by phase, respects task dependencies and parallel markers (`[P]`), and marks completed tasks as `[X]` in the tasks file.

---

## Workflow Guarantees

### Artifact ordering and completeness

The [`sdd-artifact-guard` skill](.opencode/skills/sdd-artifact-guard/SKILL.md) is included with the plugin to enforce the SDD artifact creation contract:

- **spec.md** must exist and be approved before **plan.md** is generated
- **plan.md** must be complete before **tasks.md** is created
- All complementary artifacts (**research.md**, **data-model.md**, **quickstart.md**) are produced alongside planning
- No artifact is recreated if it already exists and is valid

This means the workflow produces a complete, traceable artifact set — not a loose collection of markdown files.

### Non-destructive initialization

`/sdd-init` classifies every managed asset into one of three buckets:

- **ADD** — copy the file from the package bundle into the repository
- **KEEP** — preserve the existing file (no change)
- **REVIEW** — surface the file for manual decision (existing file differs from bundle)

Your repository's existing customizations are never blindly overwritten.

### Plan-mode only for planning

`Spec Driven` is permission-restricted to markdown editing in `specs/**/*.md` and selected workflow shell scripts. It cannot author source code. The build agent (`/implement`) handles execution.

---

## Architecture and Code Map

This section maps each user-facing claim to the files that implement it, so contributors can verify behavior directly.

### Plugin registration and agent prompt

- `.opencode/src/plugin/spec-driven-agent.ts` — registers `Spec Driven` as a primary agent, injects the backend command template into chat, and enforces plan-mode permissions

### Command templates (user-visible behavior)

- `.opencode/command/sdd.md` — `/sdd` workflow entrypoint; routes between init, new planning, and resume; enforces session-scoped workspace rule
- `.opencode/command/sdd-init.md` — `/sdd-init` bootstrap command; creates managed asset directories and constitution; runs in build mode
- `.opencode/command/implement.md` — `/implement` execution command; loads artifacts and hands off to build agent

### Workflow runtime

- `.opencode/src/workflow/phase-router.ts` — routes between `INIT`, `SPECIFY`, `CLARIFY`, `PLAN`, `TASKS`, `COMPLETE` based on repo and artifact state
- `.opencode/src/workflow/orchestrate-planning.ts` — builds the command pipeline (`create-new-feature`, `setup-plan`, `check-prerequisites`) for the planning flow
- `.opencode/src/workflow/run-guided-sdd.ts` — orchestrates the guided SDD loop
- `.opencode/src/init/run-init.ts` — executes non-destructive asset merge using the add/keep/review classification

### Managed assets

- `.opencode/managed-assets/` — the packaged bundle that is published to npm; must stay in sync with the authoring sources above

### Shell script backend primitives

- `.specify/scripts/bash/check-prerequisites.sh` — detects repo state, active workspace, and artifact availability
- `.specify/scripts/bash/create-new-feature.sh` — creates feature workspace, branch, and initial `spec.md` from template
- `.specify/scripts/bash/setup-plan.sh` — copies the plan template and resolves feature paths

### Artifact templates

- `.specify/templates/spec-template.md`
- `.specify/templates/plan-template.md`
- `.specify/templates/tasks-template.md`
- `.specify/templates/constitution-template.md`

---

## Local Development

Clone the repository and open it in OpenCode:

```bash
git clone https://github.com/Heldinhow/sdd-flow.git
cd sdd-flow
opencode .
```

OpenCode auto-loads `.opencode/plugins/sdd.ts`. Select **`Spec Driven`** to start working on the plugin itself.

If dependencies are not installed automatically on first load:

```bash
cd .opencode && bun install
```

### Keeping managed assets in sync

The bundle in `.opencode/managed-assets/` is what gets published to npm. The authoring sources are the files listed in the architecture map above. Before publishing a new version, sync the bundle:

```bash
cp .opencode/command/*.md .opencode/managed-assets/.opencode/command/
cp .specify/scripts/bash/*.sh .opencode/managed-assets/.specify/scripts/bash/
cp -r .specify/templates/* .opencode/managed-assets/.specify/templates/
cp .specify/memory/* .opencode/managed-assets/.specify/memory/
cp AGENTS.md .opencode/managed-assets/AGENTS.md
```

### Verification commands

```bash
# Type-check
cd .opencode && bunx tsc --noEmit

# Run tests
cd .opencode && bun test

# Full prepublish check (typecheck + tests + packaging)
cd .opencode && bun run prepublishOnly
```

---

## Compatibility Wrappers

The plugin preserves compatibility with the existing `speckit.*` command surface:

- `/speckit.specify` — wraps `/sdd` for spec creation
- `/speckit.clarify` — handles clarification loop
- `/speckit.plan` — generates the planning package
- `/speckit.tasks` — produces the task breakdown
- `/speckit.implement` — wraps `/implement`
- `/speckit.constitution` — interactive constitution creation

These are provided for environments that already use Speckit-style commands. The primary user-facing entrypoint remains **`Spec Driven`**.

---

## Why This Exists

Spec-Driven Development means letting a structured artifact set drive implementation: specs before code, plan before tasks, tasks before execution. The workflow produces markdown files you own, can audit, and can version alongside your code.

`sdd-flow` brings this model to OpenCode by:

- exposing one visible agent (`Spec Driven`) that stays in plan mode and only authors markdown
- providing a repo-local backend (`/sdd`) that orchestrates the planning loop without requiring external services
- installing a managed asset scaffold that any developer can adopt without scaffolding a new repo from scratch
- enforcing artifact ordering and completeness through the `sdd-artifact-guard` skill
- making the bootstrap process non-destructive so existing repositories are safe to initialize

It is not a replacement for Spec Kit or OpenSpec — it is an implementation of SDD principles adapted for OpenCode's agent model.

---

## Contributing

Contributions are welcome. When contributing:

1. All behavioral changes must be reflected in the command templates (`.opencode/command/*.md`) **and** the managed assets bundle (`.opencode/managed-assets/`)
2. Run `bunx tsc --noEmit` and `bun test` before opening a pull request
3. The `sdd-artifact-guard` skill must not be broken by any change to the artifact creation flow
4. New commands should follow the existing frontmatter format with `handoffs` declaring the execution agent

---

## Project Layout

```
sdd-flow/
├── .opencode/
│   ├── command/              # Authoring source for /sdd, /sdd-init, /implement, speckit.*
│   ├── managed-assets/       # Synced bundle published to npm
│   ├── plugin/               # Package export entry
│   ├── plugins/              # Local development loader
│   ├── src/
│   │   ├── init/             # Non-destructive asset merge runtime
│   │   ├── plugin/           # Agent registration and template injection
│   │   └── workflow/         # Phase routing, orchestration, resume logic
│   └── tests/                # Unit and integration tests
├── .specify/
│   ├── scripts/bash/         # Workflow shell scripts (check-prerequisites, create-new-feature, setup-plan)
│   ├── templates/            # Artifact templates (spec, plan, tasks, constitution)
│   └── memory/               # Constitution storage
├── specs/                    # Feature workspaces created by the workflow
├── .claude/                  # Napkin runbook and session notes
├── AGENTS.md                 # Development guidelines
└── README.md
```
