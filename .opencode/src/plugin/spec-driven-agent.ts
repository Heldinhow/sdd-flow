import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Hooks } from "@opencode-ai/plugin";

const SPEC_DRIVEN_AGENT = "Spec Driven";
const SDD_COMMAND_PATH = [".opencode", "command", "sdd.md"] as const;
const SDD_SKILL_NAMES = ["sdd-flow", "sdd-spec", "sdd-plan", "sdd-tasks"] as const;

type PluginConfigInput = Parameters<NonNullable<Hooks["config"]>>[0];
type ChatMessageOutput = Parameters<NonNullable<Hooks["chat.message"]>>[1];

interface BuildSpecDrivenPromptInput {
  projectRoot: string;
  repoInitialized: boolean;
}

function buildSkillPaths(projectRoot: string): string[] {
  return SDD_SKILL_NAMES.map((skill) => path.join(projectRoot, ".opencode", "skills", skill, "SKILL.md"));
}

function buildSpecDrivenPrompt(input: BuildSpecDrivenPromptInput): string {
  if (!input.repoInitialized) {
    return [
      "You are Spec Driven, the primary Spec-Driven Development agent for OpenCode.",
      "",
      "## Repository Not Initialized",
      "",
      `The repository at ${input.projectRoot} is not initialized for SDD workflow.`,
      "",
      "**You cannot proceed with planning until initialization is complete.**",
      "",
      "## Required Action",
      "",
      "Instruct the user to:",
      "1. Switch to the build agent (not Spec Driven)",
      "2. Run `/sdd-init` to initialize the repository",
      "3. After initialization completes, switch back to Spec Driven",
      "4. Then the planning workflow can begin",
      "",
      "## What `/sdd-init` Does",
      "",
      "The `/sdd-init` command will create:",
      "- `.specify/` directory with templates, scripts, and memory",
      "- `.opencode/` directory with commands and plugin",
      "- `.opencode/skills/` with repo-local SDD orchestration skills",
      "- `specs/` directory for feature workspaces",
      "- Interactive constitution creation",
    ].join("\n");
  }

  const skillPaths = buildSkillPaths(input.projectRoot);

  return [
    "You are Spec Driven, the primary Spec-Driven Development agent for OpenCode.",
    `The repository already has SDD workflow assets at ${input.projectRoot}.`,
    "At the beginning of every new interaction, load and follow these repo-local skills:",
    ...skillPaths.map((skillPath) => `- ${skillPath}`),
    "Every new Spec Driven interaction creates a fresh typed branch workspace for that task, even if another workspace already exists in the repository.",
    "Treat fix, init, feat, refactor, and test requests the same way: recommend the branch prefix, confirm it briefly, and create the new branch workspace before planning.",
    "Use the repo-local SDD backend automatically; do not ask the user to invoke internal planning commands manually.",
    "Stay in plan mode and only create markdown workflow artifacts.",
    "Do not generate source code or author non-markdown files.",
    "If repository bootstrap needs non-markdown managed assets, rely on the managed init backend instead of writing them yourself.",
    "Ask focused clarification questions only when they materially affect scope, user experience, or validation.",
    "Slash commands execute first: if user input starts with /, treat it as a command invocation before any other interpretation.",
  ].join("\n");
}

function registerSpecDrivenAgent(config: PluginConfigInput, prompt: string): void {
  config.agent ??= {};
  config.agent[SPEC_DRIVEN_AGENT] = {
    mode: "primary",
    description: "Guides the repo-local SDD workflow in plan mode",
    color: "accent",
    prompt,
    permission: {
      edit: {
        "*": "deny",
        "specs/**/*.md": "allow",
      },
      bash: {
        "*": "deny",
        "*check-prerequisites.sh*": "allow",
        "*create-new-feature.sh*": "allow",
        "*setup-plan.sh*": "allow",
      },
      webfetch: "ask",
    },
  } as never;
}

function resolvePackageRoot(): string {
  return path.resolve(fileURLToPath(import.meta.url), "..", "..", "..");
}

function loadSddTemplate(projectRoot: string): string | null {
  const repoLocalPath = path.join(projectRoot, ...SDD_COMMAND_PATH);
  if (existsSync(repoLocalPath)) {
    return readFileSync(repoLocalPath, "utf8");
  }

  const bundlePath = path.join(resolvePackageRoot(), "managed-assets", ...SDD_COMMAND_PATH);
  if (existsSync(bundlePath)) {
    return readFileSync(bundlePath, "utf8");
  }

  return null;
}

function injectSddBackendTemplate(projectRoot: string, output: ChatMessageOutput): void {
  const userText = output.parts
    .filter((part): part is Extract<ChatMessageOutput["parts"][number], { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (!userText) {
    return;
  }

  if (userText.startsWith("/")) {
    return;
  }

  const template = loadSddTemplate(projectRoot);
  if (!template) {
    const templatePath = path.join(projectRoot, ...SDD_COMMAND_PATH);
    const errorMessage = [
      "⚠️ **SDD Backend Template Missing**",
      "",
      `The SDD backend template is required but not found at: ${templatePath}`,
      "",
      "The Spec Driven agent will operate without critical SDD workflow orchestration instructions.",
      "",
      "**To fix this:**",
      "1. Run \`/sdd-init\` in the build agent to initialize the repository",
      "2. This will create the required `.opencode/command/sdd.md` template",
      "3. Then return to Spec Driven for proper workflow guidance",
    ].join("\n");

    console.warn(`[SDD Plugin] Template not found at ${templatePath}`);

    output.parts.unshift({
      id: `prt-${output.message.id}-sdd-template-missing`,
      sessionID: output.message.sessionID,
      messageID: output.message.id,
      type: "text",
      synthetic: true,
      text: errorMessage,
    });
    return;
  }

  output.parts.unshift({
    id: `prt-${output.message.id}-sdd-backend`,
    sessionID: output.message.sessionID,
    messageID: output.message.id,
    type: "text",
    synthetic: true,
    text: template.replaceAll("$ARGUMENTS", userText),
  });
}

export { SDD_SKILL_NAMES, SPEC_DRIVEN_AGENT, buildSpecDrivenPrompt, injectSddBackendTemplate, registerSpecDrivenAgent };
