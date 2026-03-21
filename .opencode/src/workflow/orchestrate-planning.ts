import type { BranchPrefix } from "../branching/prefixes";
import {
  buildCheckPrerequisitesCommand,
  buildCreateFeatureCommand,
  buildSetupPlanCommand,
  type CommandDescriptor,
} from "./artifact-backend";

interface OrchestratePlanningInput {
  repoRoot: string;
  featureDescription: string;
  shortName: string;
  branchPrefix: BranchPrefix;
}

function orchestratePlanning(input: OrchestratePlanningInput): CommandDescriptor[] {
  return [
    buildCreateFeatureCommand({
      repoRoot: input.repoRoot,
      featureDescription: input.featureDescription,
      shortName: input.shortName,
      branchPrefix: input.branchPrefix,
    }),
    buildSetupPlanCommand({ repoRoot: input.repoRoot }),
    buildCheckPrerequisitesCommand({
      repoRoot: input.repoRoot,
      requireTasks: true,
      includeTasks: true,
    }),
  ];
}

export { orchestratePlanning };
export type { OrchestratePlanningInput };
