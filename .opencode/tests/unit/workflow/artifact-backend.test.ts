import { describe, expect, it } from "bun:test";

import {
  buildCheckPrerequisitesCommand,
  buildCreateFeatureCommand,
  buildSetupPlanCommand,
} from "../../../src/workflow/artifact-backend";
import { BRANCH_PREFIX } from "../../../src/branching/prefixes";

describe("artifact backend", () => {
  it("builds the create feature command with a typed branch prefix", () => {
    const command = buildCreateFeatureCommand({
      repoRoot: "/repo",
      featureDescription: "Create unified SDD workflow",
      shortName: "opencode-sdd-agent",
      branchPrefix: BRANCH_PREFIX.FEAT,
    });

    expect(command.scriptPath).toBe("/repo/.specify/scripts/bash/create-new-feature.sh");
    expect(command.args).toEqual([
      "Create unified SDD workflow",
      "--json",
      "--type",
      "feat",
      "--short-name",
      "opencode-sdd-agent",
    ]);
    expect(command.env.SPECIFY_REPO_ROOT).toBe("/repo");
  });

  it("builds the setup-plan command for the active feature workspace", () => {
    const command = buildSetupPlanCommand({ repoRoot: "/repo" });

    expect(command.scriptPath).toBe("/repo/.specify/scripts/bash/setup-plan.sh");
    expect(command.args).toEqual(["--json"]);
  });

  it("builds the prerequisite command with task flags when requested", () => {
    const command = buildCheckPrerequisitesCommand({
      repoRoot: "/repo",
      requireTasks: true,
      includeTasks: true,
    });

    expect(command.scriptPath).toBe("/repo/.specify/scripts/bash/check-prerequisites.sh");
    expect(command.args).toEqual(["--json", "--require-tasks", "--include-tasks"]);
  });
});
