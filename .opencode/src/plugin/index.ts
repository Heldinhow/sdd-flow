import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin, PluginInput } from "@opencode-ai/plugin";

import { BRANCH_PREFIX_VALUES } from "../branching/prefixes";
import { discoverCommands, registerCommands } from "./command-registry";
import { PreScriptRunner } from "./pre-script-runner";
import { runInit } from "../init/run-init";
import {
  SDD_SKILL_NAMES,
  SPEC_DRIVEN_AGENT,
  buildSpecDrivenPrompt,
  injectSddBackendTemplate,
  registerSpecDrivenAgent,
} from "./spec-driven-agent";

function hasSddMarkers(directory: string): boolean {
  return existsSync(path.join(directory, ".specify")) && existsSync(path.join(directory, "specs"));
}

function resolveProjectRoot(input: Pick<PluginInput, "directory" | "worktree">): string {
  let currentDirectory = path.resolve(input.directory);

  while (true) {
    if (hasSddMarkers(currentDirectory)) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      break;
    }
    currentDirectory = parentDirectory;
  }

  if (hasSddMarkers(input.worktree)) {
    return input.worktree;
  }

  return path.resolve(input.directory);
}

function buildSystemContext(projectRoot: string): string[] {
  return [
    `Repository-local SDD workflow root: ${projectRoot}`,
    "Use Spec Driven as the user-facing SDD entrypoint.",
    "Use the internal repo-local SDD backend automatically rather than exposing it as a user-facing command.",
    `Load these repo-local skills for Spec Driven work: ${SDD_SKILL_NAMES.join(", ")}.`,
    "Every new Spec Driven interaction creates a fresh branch-backed workspace before planning begins.",
    `Preferred branch prefixes: ${BRANCH_PREFIX_VALUES.join(", ")}.`,
  ];
}

function buildSyntheticPartIds(sessionID: string, commandName: string): { id: string; messageID: string } {
  const slug = commandName.replace(/[^a-zA-Z0-9._-]/g, "-");

  return {
    id: `prt-${sessionID}-${slug}-prescript`,
    messageID: `msg-${sessionID}-${slug}-prescript`,
  };
}

function resolveBundleRoot(): string {
  return path.join(path.resolve(fileURLToPath(import.meta.url), "..", "..", ".."), "managed-assets");
}

function formatInitOutput(result: { addedAssets: string[]; keptAssets: string[]; reviewAssets: string[]; nextRecommendation: string; needsInitialization: boolean }): string {
  const lines: string[] = [];

  lines.push("## SDD Initialization Result");
  lines.push("");

  if (result.needsInitialization) {
    lines.push("**Status**: Repository requires initialization");
  } else {
    lines.push("**Status**: Repository already initialized");
  }

  if (result.addedAssets.length > 0) {
    lines.push("");
    lines.push("**Added assets**:");
    for (const asset of result.addedAssets) {
      lines.push(`  - ${asset}`);
    }
  }

  if (result.keptAssets.length > 0) {
    lines.push("");
    lines.push("**Kept existing assets**:");
    for (const asset of result.keptAssets) {
      lines.push(`  - ${asset}`);
    }
  }

  if (result.reviewAssets.length > 0) {
    lines.push("");
    lines.push("**Assets requiring review**:");
    for (const asset of result.reviewAssets) {
      lines.push(`  - ${asset}`);
    }
  }

  lines.push("");
  lines.push(`**Next**: ${result.nextRecommendation}`);

  return lines.join("\n");
}

const sddPlugin: Plugin = async (input) => {
  const projectRoot = resolveProjectRoot(input);
  const repoInitialized = hasSddMarkers(projectRoot);
  const runner = new PreScriptRunner((name) => {
    const commands = discoverCommands(projectRoot);
    const entry = commands.get(name);

    return entry?.scripts ?? null;
  });

  return {
    async config(config) {
      registerSpecDrivenAgent(
        config,
        buildSpecDrivenPrompt({
          projectRoot,
          repoInitialized,
        }),
      );

      registerCommands(config, projectRoot);
    },
    async "shell.env"(_event, output) {
      output.env.SPECIFY_REPO_ROOT = projectRoot;
      output.env.SDD_PRIMARY_COMMAND = "sdd";
      output.env.SDD_BRANCH_PREFIXES = BRANCH_PREFIX_VALUES.join(",");
    },
    async "chat.message"(input, output) {
      if (!repoInitialized || input.agent !== SPEC_DRIVEN_AGENT) {
        return;
      }

      injectSddBackendTemplate(projectRoot, output);
    },
    async "command.execute.before"(input, output) {
      if (input.command === "sdd-init") {
        const initResult = runInit({
          sourceRoot: resolveBundleRoot(),
          targetRoot: projectRoot,
        });

        const ids = buildSyntheticPartIds(input.sessionID, "sdd-init");
        output.parts.unshift({
          id: ids.id,
          sessionID: input.sessionID,
          messageID: ids.messageID,
          type: "text",
          synthetic: true,
          text: formatInitOutput(initResult),
        });
        return;
      }

      const result = await runner.runIfNeeded(input.command, projectRoot);
      if (!result) {
        return;
      }

      const ids = buildSyntheticPartIds(input.sessionID, input.command);
      output.parts.unshift({
        id: ids.id,
        sessionID: input.sessionID,
        messageID: ids.messageID,
        type: "text",
        synthetic: true,
        text: result.formattedOutput,
      });
    },
    async "experimental.chat.system.transform"(_event, output) {
      if (!repoInitialized) {
        return;
      }

      output.system.push(...buildSystemContext(projectRoot));
    },
  };
};

export default sddPlugin;
export { buildSystemContext, resolveProjectRoot };
