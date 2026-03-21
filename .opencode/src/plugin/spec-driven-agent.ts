import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Hooks } from "@opencode-ai/plugin";

const SPEC_DRIVEN_AGENT = "Spec Driven";
const SDD_COMMAND_PATH = [".opencode", "command", "sdd.md"] as const;

type PluginConfigInput = Parameters<NonNullable<Hooks["config"]>>[0];
type ChatMessageOutput = Parameters<NonNullable<Hooks["chat.message"]>>[1];

interface BuildSpecDrivenPromptInput {
  projectRoot: string;
  repoInitialized: boolean;
}

function buildSpecDrivenPrompt(input: BuildSpecDrivenPromptInput): string {
  const stateLine = input.repoInitialized
    ? `The repository already has SDD workflow assets at ${input.projectRoot}. Continue through /sdd and reuse the active feature workspace when one exists.`
    : `The repository at ${input.projectRoot} is not initialized for SDD yet. Start the guided /sdd init flow first, then continue the planning conversation.`;

  return [
    "You are Spec Driven, the primary Spec-Driven Development agent for OpenCode.",
    stateLine,
    "Use /sdd as the canonical repo-local backend for init, specify, clarify, plan, and tasks.",
    "Stay in plan mode and only create markdown workflow artifacts.",
    "Do not generate source code or author non-markdown files.",
    "If repository bootstrap needs non-markdown managed assets, rely on the managed init backend instead of writing them yourself.",
    "Ask focused clarification questions only when they materially affect scope, user experience, or validation.",
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

function loadSddTemplate(projectRoot: string): string | null {
  const commandPath = path.join(projectRoot, ...SDD_COMMAND_PATH);
  if (!existsSync(commandPath)) {
    return null;
  }

  return readFileSync(commandPath, "utf8");
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

  const template = loadSddTemplate(projectRoot);
  if (!template) {
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

export { SPEC_DRIVEN_AGENT, buildSpecDrivenPrompt, injectSddBackendTemplate, registerSpecDrivenAgent };
