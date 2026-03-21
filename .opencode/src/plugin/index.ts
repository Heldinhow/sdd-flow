import { existsSync } from "node:fs";
import path from "node:path";

import type { Plugin, PluginInput } from "@opencode-ai/plugin";

import { BRANCH_PREFIX_VALUES } from "../branching/prefixes";
import { registerCommands } from "./command-registry";
import {
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
    "Use /sdd as the primary workflow backend.",
    `Preferred branch prefixes: ${BRANCH_PREFIX_VALUES.join(", ")}.`,
  ];
}

const sddPlugin: Plugin = async (input) => {
  const projectRoot = resolveProjectRoot(input);
  const repoInitialized = hasSddMarkers(projectRoot);

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
    async "chat.message"(event, output) {
      if (!repoInitialized || event.agent !== SPEC_DRIVEN_AGENT) {
        return;
      }

      injectSddBackendTemplate(projectRoot, output);
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
