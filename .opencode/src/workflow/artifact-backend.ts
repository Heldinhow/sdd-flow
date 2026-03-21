import path from "node:path";

import type { BranchPrefix } from "../branching/prefixes";

const SPECIFY_SCRIPT = {
  CREATE_NEW_FEATURE: "create-new-feature.sh",
  SETUP_PLAN: "setup-plan.sh",
  CHECK_PREREQUISITES: "check-prerequisites.sh",
} as const;

type SpecifyScript = (typeof SPECIFY_SCRIPT)[keyof typeof SPECIFY_SCRIPT];

interface CommandDescriptor {
  scriptPath: string;
  args: string[];
  env: Record<string, string>;
}

interface CreateFeatureCommandInput {
  repoRoot: string;
  featureDescription: string;
  shortName: string;
  branchPrefix: BranchPrefix;
}

interface SetupPlanCommandInput {
  repoRoot: string;
}

interface CheckPrerequisitesCommandInput {
  repoRoot: string;
  requireTasks?: boolean;
  includeTasks?: boolean;
}

function resolveScriptPath(repoRoot: string, script: SpecifyScript): string {
  return path.join(repoRoot, ".specify", "scripts", "bash", script);
}

function createCommandDescriptor(repoRoot: string, script: SpecifyScript, args: string[]): CommandDescriptor {
  return {
    scriptPath: resolveScriptPath(repoRoot, script),
    args,
    env: {
      SPECIFY_REPO_ROOT: repoRoot,
    },
  };
}

function buildCreateFeatureCommand(input: CreateFeatureCommandInput): CommandDescriptor {
  return createCommandDescriptor(input.repoRoot, SPECIFY_SCRIPT.CREATE_NEW_FEATURE, [
    input.featureDescription,
    "--json",
    "--type",
    input.branchPrefix,
    "--short-name",
    input.shortName,
  ]);
}

function buildSetupPlanCommand(input: SetupPlanCommandInput): CommandDescriptor {
  return createCommandDescriptor(input.repoRoot, SPECIFY_SCRIPT.SETUP_PLAN, ["--json"]);
}

function buildCheckPrerequisitesCommand(input: CheckPrerequisitesCommandInput): CommandDescriptor {
  const args = ["--json"];
  if (input.requireTasks) {
    args.push("--require-tasks");
  }
  if (input.includeTasks) {
    args.push("--include-tasks");
  }

  return createCommandDescriptor(input.repoRoot, SPECIFY_SCRIPT.CHECK_PREREQUISITES, args);
}

export {
  SPECIFY_SCRIPT,
  buildCheckPrerequisitesCommand,
  buildCreateFeatureCommand,
  buildSetupPlanCommand,
  resolveScriptPath,
};
export type {
  CheckPrerequisitesCommandInput,
  CommandDescriptor,
  CreateFeatureCommandInput,
  SetupPlanCommandInput,
  SpecifyScript,
};
