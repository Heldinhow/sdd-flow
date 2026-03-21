# Spec Driven Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a visible `Spec Driven` primary plan-mode agent to the OpenCode plugin so users can enter the guided SDD flow through the agent picker while direct agent-authored edits remain limited to markdown planning artifacts and `/sdd` remains the canonical repo-local workflow backend.

**Architecture:** Extend the plugin with a `config` hook that registers `Spec Driven` as a restricted primary planning agent, enforce a granular edit allowlist for markdown planning artifacts, and move the agent prompt and repo-state-aware instructions into a dedicated plugin helper. Keep `/sdd` as the single repo-local command contract for init, specify, clarify, plan, and tasks, and treat non-markdown repo bootstrap assets as managed backend outputs rather than agent-authored files. Fix the no-active-workspace routing gap so `Spec Driven` sends initialized repositories to specification instead of incorrectly falling back to init.

Use OpenCode granular permissions, not prompt text alone, to enforce the restriction: deny all direct edits by default, allow only markdown planning paths, and deny arbitrary bash while allowlisting only the repo-inspection and managed workflow commands required for SDD.

**Tech Stack:** TypeScript 5.8, Bun test, `@opencode-ai/plugin`, `@opencode-ai/sdk`, repo-local markdown command assets in `.opencode/command/`

---

### Task 1: Register the visible `Spec Driven` primary plan agent

**Files:**
- Create: `.opencode/src/plugin/spec-driven-agent.ts`
- Modify: `.opencode/src/plugin/index.ts`
- Test: `.opencode/tests/unit/plugin/index.test.ts`

**Step 1: Write the failing test**

```ts
import type { Config, Model } from "@opencode-ai/sdk";

it("registers the Spec Driven primary agent", async () => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
  const hooks = await sddPlugin(createPluginInput(projectRoot));
  const config = { agent: {} } as Config;

  await hooks.config?.(config);

  expect(config.agent?.["Spec Driven"]).toMatchObject({
    mode: "primary",
    description: expect.stringContaining("SDD"),
    permission: {
      edit: {
        "*": "deny",
        "specs/**/*.md": "allow",
      },
      bash: {
        "*": "deny",
        "*check-prerequisites.sh*": "allow",
      },
    },
  });
});
```

**Step 2: Run test to verify it fails**

Run from `.opencode/`:

```bash
bun test tests/unit/plugin/index.test.ts --filter "registers the Spec Driven primary agent"
```

Expected: FAIL because `hooks.config` is missing and no restricted `Spec Driven` agent is registered.

**Step 3: Write minimal implementation**

```ts
// .opencode/src/plugin/spec-driven-agent.ts
import type { Config } from "@opencode-ai/sdk";

const SPEC_DRIVEN_AGENT = "Spec Driven";

function registerSpecDrivenAgent(config: Config, prompt: string): void {
  config.agent ??= {};
  config.agent[SPEC_DRIVEN_AGENT] = {
    mode: "primary",
    description: "Guides the repo-local Spec Driven Development workflow in plan mode",
    color: "accent",
    prompt,
    permission: {
      edit: {
        "*": "deny",
        "specs/**/*.md": "allow",
      },
      bash: {
        "*": "deny",
        "git status*": "allow",
        "*check-prerequisites.sh*": "allow",
        "*create-new-feature.sh*": "allow",
        "*setup-plan.sh*": "allow",
      },
      webfetch: "ask",
    },
  };
}

export { SPEC_DRIVEN_AGENT, registerSpecDrivenAgent };

// .opencode/src/plugin/index.ts
import { registerSpecDrivenAgent, buildSpecDrivenPrompt } from "./spec-driven-agent";

async config(config) {
  registerSpecDrivenAgent(
    config,
    buildSpecDrivenPrompt({
      projectRoot,
      initialized: hasSddMarkers(projectRoot),
    }),
  );
}
```

**Step 4: Run test to verify it passes**

Run from `.opencode/`:

```bash
bun test tests/unit/plugin/index.test.ts --filter "registers the Spec Driven primary agent"
```

Expected: PASS.

**Step 5: Commit**

```bash
git add .opencode/src/plugin/spec-driven-agent.ts .opencode/src/plugin/index.ts .opencode/tests/unit/plugin/index.test.ts
git commit -m "feat: register Spec Driven primary agent"
```

### Task 2: Make `Spec Driven` route users into the repo-local `/sdd` flow without code generation

**Files:**
- Modify: `.opencode/src/plugin/spec-driven-agent.ts`
- Modify: `.opencode/src/plugin/index.ts`
- Test: `.opencode/tests/unit/plugin/index.test.ts`

**Step 1: Write the failing test**

```ts
it("builds a repo-aware Spec Driven prompt", async () => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
  mkdirSync(path.join(projectRoot, ".specify"));
  mkdirSync(path.join(projectRoot, "specs"));

  const hooks = await sddPlugin(createPluginInput(projectRoot));
  const config = { agent: {} } as Config;

  await hooks.config?.(config);

  const prompt = String(config.agent?.["Spec Driven"]?.prompt);
  expect(prompt).toContain("/sdd");
  expect(prompt).toContain("markdown");
  expect(prompt).toContain("source code");
  expect(prompt).toContain("active feature workspace");
});

it("adds Spec Driven to the repo system guidance", async () => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
  mkdirSync(path.join(projectRoot, ".specify"));
  mkdirSync(path.join(projectRoot, "specs"));

  const hooks = await sddPlugin(createPluginInput(projectRoot));
  const output = { system: [] as string[] };

  await hooks["experimental.chat.system.transform"]!({ model: {} as Model }, output);

  expect(output.system.join("\n")).toContain("Spec Driven");
  expect(output.system.join("\n")).toContain("/sdd");
});
```

**Step 2: Run test to verify it fails**

Run from `.opencode/`:

```bash
bun test tests/unit/plugin/index.test.ts --filter "Spec Driven"
```

Expected: FAIL because the prompt and system guidance do not yet describe the new agent contract.

**Step 3: Write minimal implementation**

```ts
function buildSpecDrivenPrompt(input: { projectRoot: string; initialized: boolean }): string {
  const stateLine = input.initialized
    ? `The repository already has SDD workflow assets at ${input.projectRoot}. Continue through /sdd and reuse the active feature workspace when one exists.`
    : "The repository is not initialized for SDD yet. Start the guided /sdd init flow first, then continue the planning conversation.";

  return [
    "You are Spec Driven, the primary Spec-Driven Development agent for OpenCode.",
    stateLine,
    "Use /sdd as the canonical repo-local backend for init, specify, clarify, plan, and tasks.",
    "Stay in plan mode and only create markdown workflow artifacts.",
    "Do not generate source code or author non-markdown files.",
    "If repository bootstrap needs non-markdown managed assets, rely on the managed init backend instead of writing them yourself.",
    "Ask focused clarification questions only when they materially affect scope, UX, or validation.",
  ].join("\n");
}

function buildSystemContext(projectRoot: string): string[] {
  return [
    `Repository-local SDD workflow root: ${projectRoot}`,
    "Use the Spec Driven agent as the user-facing SDD entrypoint.",
    "Use /sdd as the primary workflow backend.",
    `Preferred branch prefixes: ${BRANCH_PREFIX_VALUES.join(", ")}.`,
  ];
}
```

**Step 4: Run test to verify it passes**

Run from `.opencode/`:

```bash
bun test tests/unit/plugin/index.test.ts --filter "Spec Driven"
```

Expected: PASS.

**Step 5: Commit**

```bash
git add .opencode/src/plugin/spec-driven-agent.ts .opencode/src/plugin/index.ts .opencode/tests/unit/plugin/index.test.ts
git commit -m "feat: route Spec Driven through /sdd"
```

### Task 3: Fix initialized-repo routing when no feature workspace exists

**Files:**
- Modify: `.opencode/src/workflow/resume-flow.ts`
- Modify: `.opencode/src/workflow/run-guided-sdd.ts`
- Test: `.opencode/tests/unit/workflow/clarify-resume.test.ts`
- Test: `.opencode/tests/unit/workflow/guided-sdd.test.ts`

**Step 1: Write the failing test**

```ts
it("routes initialized repositories without an active feature to specify", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
  mkdirSync(path.join(repoRoot, ".specify"));
  mkdirSync(path.join(repoRoot, "specs"));

  const result = resumeFlow({ repoRoot });

  expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
  expect(result.nextRecommendation).toContain("spec");
});

it("keeps uninitialized repositories on init", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));

  const result = runGuidedSdd({ repoRoot });

  expect(result.phase).toBe(WORKFLOW_PHASE.INIT);
});
```

**Step 2: Run test to verify it fails**

Run from `.opencode/`:

```bash
bun test tests/unit/workflow/clarify-resume.test.ts tests/unit/workflow/guided-sdd.test.ts --filter "initialized repositories without an active feature|keeps uninitialized repositories on init"
```

Expected: FAIL because `resumeFlow()` currently hard-codes `repoInitialized: false` whenever no active feature is found.

**Step 3: Write minimal implementation**

```ts
// .opencode/src/workflow/resume-flow.ts
import { existsSync } from "node:fs";

function hasInitializedRepo(repoRoot: string): boolean {
  return existsSync(path.join(repoRoot, ".specify")) && existsSync(path.join(repoRoot, "specs"));
}

if (!activeFeature) {
  const evaluation = evaluateArtifactState({
    repoInitialized: hasInitializedRepo(input.repoRoot),
    specExists: false,
    planExists: false,
    tasksExists: false,
  });

  return {
    activeFeature: null,
    featureRoot: null,
    phase: evaluation.phase,
    nextRecommendation: evaluation.nextRecommendation,
  };
}
```

If `run-guided-sdd.ts` needs no logic change after this fix, keep that file untouched and remove it from the final `git add` command.

**Step 4: Run test to verify it passes**

Run from `.opencode/`:

```bash
bun test tests/unit/workflow/clarify-resume.test.ts tests/unit/workflow/guided-sdd.test.ts --filter "initialized repositories without an active feature|keeps uninitialized repositories on init"
```

Expected: PASS.

**Step 5: Commit**

```bash
git add .opencode/src/workflow/resume-flow.ts .opencode/src/workflow/run-guided-sdd.ts .opencode/tests/unit/workflow/clarify-resume.test.ts .opencode/tests/unit/workflow/guided-sdd.test.ts
git commit -m "fix: route initialized repos into specify"
```

### Task 4: Align documentation and managed guidance with the new entrypoint

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `.opencode/command/sdd.md`
- Test: `.opencode/tests/unit/plugin/index.test.ts`

**Step 1: Write the failing test**

```ts
it("describes Spec Driven as the user-facing SDD entrypoint", async () => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), "sdd-plugin-"));
  mkdirSync(path.join(projectRoot, ".specify"));
  mkdirSync(path.join(projectRoot, "specs"));

  const hooks = await sddPlugin(createPluginInput(projectRoot));
  const output = { system: [] as string[] };

  await hooks["experimental.chat.system.transform"]!({ model: {} as Model }, output);

  expect(output.system.join("\n")).toContain("Spec Driven");
  expect(output.system.join("\n")).toContain("user-facing");
});
```

**Step 2: Run test to verify it fails**

Run from `.opencode/`:

```bash
bun test tests/unit/plugin/index.test.ts --filter "user-facing SDD entrypoint"
```

Expected: FAIL until the system guidance explicitly names `Spec Driven` as the visible entrypoint.

**Step 3: Write minimal implementation**

```md
# README.md
## Installation
1. Install the OpenCode plugin.
2. Open OpenCode and select `Spec Driven` from the primary agent picker.
3. Let the agent guide the workflow in plan mode; it only authors markdown planning artifacts.
4. If workflow assets are missing, let the managed init backend install `/sdd` and the non-markdown runtime assets.

# AGENTS.md
- Use `Spec Driven` as the primary UX entrypoint for SDD.
- Use `/sdd` as the repo-local backend command installed during init.
- Keep `Spec Driven` restricted to markdown planning artifacts; it must not generate code.

# .opencode/command/sdd.md
- Document that `/sdd` is the canonical backend invoked by the `Spec Driven` agent.
- Document that non-markdown workflow assets are installed by backend init logic, not by agent-authored code.
```

**Step 4: Run verification**

Run from `.opencode/`:

```bash
bun test tests/unit/plugin/index.test.ts && bunx tsc --noEmit
```

Expected: PASS.

**Step 5: Commit**

```bash
git add README.md AGENTS.md .opencode/command/sdd.md .opencode/tests/unit/plugin/index.test.ts
git commit -m "docs: explain Spec Driven installation flow"
```

### Task 5: Run the regression sweep for the shipped workflow contract

**Files:**
- Review: `.opencode/tests/unit/plugin/index.test.ts`
- Review: `.opencode/tests/unit/workflow/guided-sdd.test.ts`
- Review: `.opencode/tests/unit/workflow/clarify-resume.test.ts`
- Review: `.opencode/tests/integration/specify-scripts.test.ts`

**Step 1: Run the focused unit suite**

Run from `.opencode/`:

```bash
bun test tests/unit/plugin/index.test.ts tests/unit/workflow/guided-sdd.test.ts tests/unit/workflow/clarify-resume.test.ts
```

Expected: PASS.

**Step 2: Run the script integration suite**

Run from `.opencode/`:

```bash
bun test tests/integration/specify-scripts.test.ts
```

Expected: PASS.

**Step 3: Run the typecheck**

Run from `.opencode/`:

```bash
bunx tsc --noEmit
```

Expected: PASS.

**Step 4: Commit the validation checkpoint**

```bash
git add .
git commit -m "test: validate Spec Driven workflow entrypoint"
```

**Step 5: Record release notes**

Capture the final behavior in the PR or release summary:

```md
- Plugin install exposes a visible `Spec Driven` primary agent.
- Selecting `Spec Driven` enters the guided SDD flow.
- Repository init still installs `/sdd` as the canonical repo-local backend.
- Initialized repositories without an active workspace now route to specification instead of init.
```
