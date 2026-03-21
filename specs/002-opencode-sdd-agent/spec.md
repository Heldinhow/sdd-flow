# Feature Specification: Unified SDD Agent for OpenCode

**Feature Branch**: `[002-opencode-sdd-agent]`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "quero criar um plugin para agent especializado em SDD para opencode. esse agent precisa fazer todo o fluxo de /speckit.specify, speckit.plan, speckit.clarify(se necessário) e speckit.tasks. o agent deverá ser plan mode e apenas poder criar arquivos markdown. a ideia é simplificar o speckit: https://github.com/github/spec-kit pode clonar o repo e entender como funciona. basicamente o agent deverá direcionar o usuário por todo o flow do SDD, fazer perguntas, esclarecer qualquer ponto ambiguo, a medida que for evoluindo, executar os scripts do speckit para criar os arquivos necessário e que o speckit criaria, plan, spec, tasks, e os demais. o plugin deve instalar o agent no opencode (inicialmente) e precisa de alguma forma pode ser inicializado no repositorio, tipo o que o speckit faz, criando arquivos dentro do repo de prompts e scripts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize a repository for guided SDD (Priority: P1)

As a repository maintainer, I want to initialize a repository for the unified SDD workflow so that contributors can start planning work from one OpenCode entrypoint without manually copying prompts, templates, or automation assets.

**Why this priority**: Without repository initialization, the unified agent cannot be adopted consistently or reused across repositories.

**Independent Test**: Initialize a repository that does not yet contain the workflow assets and verify that the single SDD entrypoint and required planning assets are available for immediate use.

**Acceptance Scenarios**:

1. **Given** a repository without the guided SDD setup, **When** a maintainer initializes the workflow, **Then** the repository receives the required planning assets and exposes one clear SDD entrypoint in OpenCode.
2. **Given** a repository with partial workflow assets, **When** a maintainer initializes the workflow, **Then** the repository is brought to a usable guided-SDD state through a non-destructive merge that preserves existing compatible customizations.
3. **Given** the plugin is installed in OpenCode, **When** a user opens the available agents and chooses `Spec Driven`, **Then** the guided SDD flow starts without requiring the user to know or type `/sdd` manually.

---

### User Story 2 - Produce core planning artifacts from one guided conversation (Priority: P1)

As a feature author, I want one guided SDD conversation that takes me from feature idea to planning artifacts so that I do not need to manually switch between separate workflow commands.

**Why this priority**: This is the core user value: reducing the operational complexity of the current multi-command flow.

**Independent Test**: Start a new feature from the unified SDD entrypoint, provide the feature idea, answer the guided prompts, and verify that the expected planning artifacts are created in the active feature workspace.

**Acceptance Scenarios**:

1. **Given** a repository with guided SDD enabled, **When** a feature author starts a new planning session, **Then** the system creates or selects the correct feature workspace, assigns a conventional English change-type prefix with the short name for the feature branch, and guides the user through the planning flow from the initial request onward.
2. **Given** an active planning session, **When** the user completes the required inputs, **Then** the system produces the expected planning artifacts without the user having to invoke separate phase commands manually.
3. **Given** a user is working through `Spec Driven`, **When** the workflow writes planning outputs, **Then** the agent only authors markdown planning artifacts and does not generate source code.

---

### User Story 3 - Resolve ambiguity without leaving the workflow (Priority: P2)

As a feature author, I want the unified SDD agent to detect and clarify material ambiguities during the same flow so that the resulting planning artifacts stay complete, consistent, and ready for the next phase.

**Why this priority**: Clarification is essential for quality, but it should not force the user to restart or manage workflow state manually.

**Independent Test**: Start a feature with a partially ambiguous description, answer the clarification prompts, and verify that the accepted answers are reflected in the resulting planning artifacts.

**Acceptance Scenarios**:

1. **Given** a feature request with missing high-impact details, **When** the unified SDD agent reaches a blocking ambiguity, **Then** it asks a focused question, recommends a best-fit answer, and records the accepted answer in the relevant artifact.
2. **Given** clarification answers have been accepted, **When** the flow continues, **Then** the next planning artifact incorporates those decisions without contradicting earlier content.

---

### User Story 4 - Resume from repository state (Priority: P3)

As a returning user, I want the unified SDD workflow to continue from the repository's current planning state so that I can update or complete a feature without manually rebuilding context.

**Why this priority**: Resume behavior improves day-to-day usability but depends on the initialization and guided flow already being in place.

**Independent Test**: Re-enter the unified SDD flow for a feature that already has partial artifacts and confirm that the system continues from the current state instead of forcing a restart.

**Acceptance Scenarios**:

1. **Given** a feature workspace with an existing specification but no task breakdown yet, **When** a user resumes the unified SDD flow, **Then** the system continues from the missing or outdated phase rather than recreating earlier artifacts unnecessarily.

---

### Edge Cases

- What happens when the repository already contains `.specify`, `.opencode`, or prior planning assets managed by another workflow version?
- What happens when the plugin is installed globally in OpenCode but the current repository has not yet been initialized with SDD assets?
- How are non-markdown managed assets installed during repository init while keeping `Spec Driven` itself in plan mode?
- How should the README describe the npm-first install path before the public package is published without misleading users about current availability?
- Which OpenCode config example should the documentation recommend for personal installation versus repo-shared installation?
- How does the system handle a feature request that is too vague to produce independently testable user stories on the first pass?
- What happens when some planning artifacts already exist but are incomplete, missing, or inconsistent with the latest user answers?
- How does the workflow behave when the user ends clarification early and chooses to proceed with unresolved lower-impact ambiguity?
- How does the workflow keep the active feature workspace clear when multiple feature folders already exist in the same repository?
- How does the workflow behave when it cannot confidently infer the best change-type prefix for a new feature branch?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide one clear OpenCode entrypoint for the guided SDD workflow.
- **FR-002**: The system MUST initialize a repository with the prompts, templates, and automation assets required to run the guided SDD workflow.
- **FR-003**: The system MUST create or select a feature workspace using the directory structure expected by the unified SDD workflow while preserving compatibility with the planning artifacts it manages.
- **FR-004**: The system MUST guide the user from initial feature request through specification, clarification when needed, planning, and task breakdown within one continuous workflow.
- **FR-005**: The system MUST ask clarifying questions only for ambiguities that materially affect feature scope, user experience, validation, or planning quality.
- **FR-006**: The system MUST present clarifying questions sequentially and provide a recommended answer for each one.
- **FR-007**: The system MUST record accepted clarification answers in the most relevant planning artifact and remove contradictory wording when the answer changes earlier assumptions.
- **FR-008**: The system MUST generate and maintain a feature specification that includes user scenarios, edge cases, requirements, assumptions, and measurable success criteria.
- **FR-009**: The system MUST generate and maintain an implementation planning artifact that expands the approved feature specification into a structured planning package for downstream use.
- **FR-010**: The system MUST generate and maintain a task breakdown artifact that maps work to user stories, dependencies, and independent validation steps.
- **FR-011**: The system MUST preserve traceability between the original feature request, clarification answers, the feature specification, the planning package, and the task breakdown.
- **FR-012**: The system MUST keep the unified SDD agent limited to planning activities and markdown artifact creation; source-code generation and other non-markdown implementation changes remain outside the agent's scope.
- **FR-013**: The system MUST allow the user to resume the planning flow from repository state when partial planning artifacts already exist for the active feature.
- **FR-014**: The system MUST generate the core planning trio (`spec.md`, `plan.md`, and `tasks.md`) and also generate auxiliary planning artifacts such as `research.md`, `data-model.md`, `quickstart.md`, and `contracts/` when they are relevant to the feature.
- **FR-015**: The system MUST initialize into repositories that already contain `.specify` and/or `.opencode` assets by merging managed files non-destructively and preserving existing compatible customizations.
- **FR-016**: The system MUST present a clear next-step recommendation at the end of each major planning phase.
- **FR-017**: The system MUST generate feature branch names with a conventional English change-type prefix combined with the short name instead of numeric-only prefixes.
- **FR-018**: The system MUST recommend the best-fit change-type prefix for a new feature branch based on the user's request and allow that prefix to be changed before the feature context is finalized.
- **FR-019**: The system MUST register a visible OpenCode primary plan-mode agent named `Spec Driven` as part of the plugin installation experience.
- **FR-020**: The system MUST allow users to start the guided SDD flow by selecting `Spec Driven` without requiring manual invocation of `/sdd`.
- **FR-021**: The system MUST install `/sdd` into the repository as the canonical repo-local workflow backend while keeping `Spec Driven` as the primary user-facing entrypoint.
- **FR-022**: The system MUST restrict direct `Spec Driven` file edits to markdown planning artifacts and deny direct source-code authoring.
- **FR-023**: The system MUST handle installation of non-markdown managed workflow assets through the managed repository-init backend rather than through agent-authored code generation.
- **FR-024**: The system MUST support distribution as a public scoped npm package named `@helldinhow/sdd-flow-opencode-plugin` so users can reference it directly from the OpenCode `plugin` config array.
- **FR-025**: The system MUST document the recommended end-user install path as adding `@helldinhow/sdd-flow-opencode-plugin` to OpenCode config instead of cloning the repository.
- **FR-026**: The system MUST document that OpenCode installs npm plugins automatically at startup and caches their dependencies, so normal plugin usage does not require a manual `npm install` step.
- **FR-027**: The system MUST keep a separate contributor-oriented local-development flow that explains how to clone the repository and validate the plugin without making that flow the primary install path.
- **FR-028**: The system MUST refresh the root README information architecture to follow a more scannable spec-kit-inspired structure with a hero section, a short Get Started path near the top, npm-first installation guidance, and secondary contributor details later in the document.
- **FR-029**: The system MUST include at least one concrete OpenCode config example for npm installation and note that both global and per-project config locations are supported.

### Key Entities *(include if feature involves data)*

- **Repository Setup**: The installable planning workflow footprint added to a repository, including the unified entrypoint and managed planning assets.
- **Feature Workspace**: The per-feature planning location that stores the specification, planning package, tasks, and related supporting artifacts for one feature.
- **SDD Session**: A guided planning interaction that captures the user's goal, clarification answers, current workflow phase, and recommended next step.
- **Planning Artifact**: A markdown output that represents a specific stage of the workflow, such as the specification, plan, task breakdown, or supporting documentation.

## Assumptions

- The first release targets OpenCode as the only runtime environment.
- OpenCode can expose installed plugin-provided agents in a user-selectable agent list.
- OpenCode can load both regular and scoped npm plugin packages from the `plugin` array in user or project config and install them automatically with Bun at startup.
- Existing phase-based `speckit.*` commands remain available as compatibility paths unless explicitly retired in a later iteration.
- The unified SDD workflow may reuse existing project automation as long as the user experience stays centered on a single entrypoint.
- Clarification is triggered only when unresolved ambiguity would materially change scope, user experience, or downstream validation.
- The initial release uses a standard English set of branch prefixes aligned with common software change types, including examples such as `feat`, `fix`, `refactor`, `init`, and `test`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time maintainer can initialize the guided SDD workflow and reach a usable single entrypoint in under 5 minutes without manually copying workflow assets.
- **SC-002**: At least 90% of pilot users can complete the core planning flow for a new feature without manually switching between separate phase commands.
- **SC-003**: For features that require clarification, the workflow resolves critical ambiguity in 5 or fewer accepted questions and continues without losing the active feature context.
- **SC-004**: 100% of pilot runs store the generated core planning artifacts in the expected feature workspace structure.
- **SC-005**: At least 80% of pilot runs complete the planning flow on the first attempt without manual repair of artifact structure or workflow state.
- **SC-006**: After plugin installation, a user can see `Spec Driven` in OpenCode and enter the guided SDD flow in under 1 minute without prior knowledge of `/sdd`.
- **SC-007**: After npm publication, a user can add `@helldinhow/sdd-flow-opencode-plugin` to OpenCode config and see `Spec Driven` available without cloning the repository or manually installing plugin dependencies.

## Clarifications

### Session 2026-03-20

- Q: Should installation expose a visible OpenCode agent or only a command alias? -> A: Expose a visible OpenCode agent named `Spec Driven`.
- Q: Does repository initialization still need `/sdd`? -> A: Yes. `Spec Driven` is the user-facing entrypoint, while repository init installs `/sdd` as the repo-local backend command.
- Q: How should `Spec Driven` behave during normal use? -> A: It must behave as a plan-mode agent that only authors markdown planning artifacts and does not generate code.
- Q: What is the approved public npm package name? -> A: `@helldinhow/sdd-flow-opencode-plugin`.
- Q: Which install path should the README prioritize? -> A: The npm-based OpenCode config flow, not `git clone`.
- Q: Which external README style should guide the rewrite? -> A: Use the scannable `github/spec-kit` README structure as the model.
- Q: Where should the clone-based flow live after the rewrite? -> A: In a secondary Local Development or Contributing section, not in the main quickstart.
