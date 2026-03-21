# sdd-flow Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-21

---

## Active Technologies

- **Runtime**: Bun (Node 22 compatible)
- **Language**: TypeScript 5.8 with strict mode
- **Plugin SDK**: `@opencode-ai/plugin` 1.2.27
- **Validation**: `zod` 4.x for runtime schema validation
- **Test runner**: Bun's built-in `bun:test`

---

## Build, Lint, and Test Commands

All commands run from the `.opencode/` directory unless noted.

```bash
# Run all tests
cd .opencode && bun test

# Run a single test file
cd .opencode && bun test tests/unit/workflow/phase-router.test.ts

# Run tests matching a pattern
cd .opencode && bun test "phase-router"

# Type-check without emitting
cd .opencode && bunx tsc --noEmit

# Run typecheck + tests together (pre-commit)
cd .opencode && bunx tsc --noEmit && bun test
```

---

## Project Layout

```
.opencode/
├── src/
│   ├── plugin/         # Plugin runtime and agent registration
│   ├── workflow/      # SDD workflow orchestration
│   ├── init/          # Repository initialization and asset merge
│   └── branching/     # Branch prefix logic
├── plugin/            # Package export entry (re-exports src/plugin/index)
├── plugins/           # Local OpenCode development loader
├── command/           # Command definitions (.md files for OpenCode)
└── tests/
    ├── unit/          # Colocated with src/ at same nesting depth
    └── integration/   # Cross-component integration tests

.specify/
├── scripts/bash/      # Workflow shell scripts
├── templates/         # Planning artifact templates
└── memory/           # Constitution and persistent memory

specs/                 # Feature workspaces (e.g. specs/002-opencode-sdd-agent/)
└── <feature>/
    ├── spec.md
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── quickstart.md
    └── tasks.md
```

---

## TypeScript Conventions

### Strict Mode Enabled

```json
{
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "Bundler",
    "noEmit": true
  }
}
```

### Imports

- **Node built-ins**: Use `node:` prefix — `import { readFileSync } from "node:fs"`
- **Type-only imports**: Use `import type { ... }` for declarations only used as types
- **Plugin SDK**: `import type { Hooks } from "@opencode-ai/plugin"` when using types; `import { Hooks } from "@opencode-ai/plugin"` when using values
- **Relative paths**: Always include file extension — `import { foo } from "./foo.ts"`

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Functions, variables | `camelCase` | `detectRepoState`, `presentAssets` |
| Types, interfaces | `PascalCase` | `RepoState`, `WorkflowRouteInput` |
| Enum-like const objects | `PascalCase` with `as const` | `WORKFLOW_PHASE.INIT` |
| File names | `kebab-case.ts` | `phase-router.ts`, `detect-ambiguity.ts` |
| Boolean variables | Prefix with `is`, `has`, `should` | `isBranchPrefix`, `hasOutstandingClarifications` |

### Exhaustive Type Patterns

Use `as const` and indexed access for exhaustive constants:

```typescript
const WORKFLOW_PHASE = {
  INIT: "init",
  SPECIFY: "specify",
  PLAN: "plan",
  TASKS: "tasks",
  COMPLETE: "complete",
} as const;

type WorkflowPhase = (typeof WORKFLOW_PHASE)[keyof typeof WORKFLOW_PHASE];
```

### Error Handling

Throw descriptive `Error` instances. No custom error classes.

```typescript
// Correct
throw new Error(`Unsupported branch prefix: ${value}`);

// Avoid
throw new ValidationError(`Unsupported branch prefix: ${value}`);
```

### Null Handling

- Use `??` and `?.` for safe navigation
- Avoid `!` non-null assertions
- Explicitly handle `null`/`undefined` in conditional logic rather than asserting

---

## Plugin Architecture

The plugin uses OpenCode's hook system in `.opencode/src/plugin/index.ts`:

```typescript
const sddPlugin: Plugin = async (input) => {
  return {
    async config(config) { /* registers agents */ },
    async "shell.env"(_event, output) { /* injects env vars */ },
    async "chat.message"(event, output) { /* intercepts chat */ },
    async "experimental.chat.system.transform"(_event, output) { /* system context */ },
  };
};
```

- **`config`**: Register agents with permissions and prompts
- **`shell.env`**: Inject environment variables into shell sessions
- **`chat.message`**: Intercept and modify chat outputs (used for template injection)
- **`experimental.chat.system.transform`**: Add lines to the system prompt

### Agent Permissions

Permissions are restrictive by default:

```typescript
permission: {
  edit: { "*": "deny", "specs/**/*.md": "allow" },
  bash: { "*": "deny", "*check-prerequisites.sh*": "allow" },
  webfetch: "ask",
}
```

---

## Testing Conventions

- Tests live in `.opencode/tests/unit/` mirroring the `src/` directory structure
- Test file naming: `<module-name>.test.ts`
- Use Bun's `bun:test` — no Jest or Vitest
- Colocate tests with source files where practical

### Test Structure

```typescript
import { describe, expect, it } from "bun:test";
import { myFunction } from "../../../src/my-module";

describe("my module", () => {
  it("does the thing", () => {
    expect(myFunction("input")).toBe("expected");
  });

  it("throws on invalid input", () => {
    expect(() => myFunction("bad")).toThrow("Unsupported");
  });
});
```

### Integration Tests

Integration tests run shell scripts and verify end-to-end behavior:

```typescript
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-test-"));
```

---

## Git Branch Naming

Use typed prefixes in kebab-case:

```
feat-unified-sdd-agent
fix-phase-router-routing
refactor-managed-assets
init-new-repository-workflow
test-clarification-loop
```

Valid prefixes: `feat`, `fix`, `refactor`, `init`, `test`

---

## SDD Workflow Commands

- **`Spec Driven`** — Primary user-facing agent in OpenCode (plan mode only)
- **`/sdd`** — Repo-local backend for init, specify, clarify, plan, tasks
- **`/speckit.*`** — Compatibility wrappers for existing speckit commands

### Phase Flow

```
INIT → SPECIFY → CLARIFY → PLAN → TASKS → COMPLETE
```

Phase routing is handled by `.opencode/src/workflow/phase-router.ts`.

---

## Recent Changes

- 002-opencode-sdd-agent: Planned and implemented the unified SDD workflow plugin with typed branch prefixes and non-destructive repository initialization

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
