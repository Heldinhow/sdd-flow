import { describe, expect, it } from "bun:test";

import { orchestratePlanning } from "../../../src/workflow/orchestrate-planning";
import { BRANCH_PREFIX } from "../../../src/branching/prefixes";

describe("orchestrate-planning", () => {
  it("returns three command descriptors", () => {
    const result = orchestratePlanning({
      repoRoot: "/project",
      featureDescription: "create user authentication",
      shortName: "user-auth",
      branchPrefix: BRANCH_PREFIX.FEAT,
    });
    expect(result).toHaveLength(3);
  });

  it("first command is create feature", () => {
    const result = orchestratePlanning({
      repoRoot: "/project",
      featureDescription: "create user authentication",
      shortName: "user-auth",
      branchPrefix: BRANCH_PREFIX.FEAT,
    });
    expect(result[0].scriptPath).toContain("create-new-feature.sh");
    expect(result[0].args).toContain("create user authentication");
    expect(result[0].args).toContain("--type");
    expect(result[0].args).toContain("feat");
    expect(result[0].args).toContain("--short-name");
    expect(result[0].args).toContain("user-auth");
    expect(result[0].env.SPECIFY_REPO_ROOT).toBe("/project");
  });

  it("second command is setup plan", () => {
    const result = orchestratePlanning({
      repoRoot: "/project",
      featureDescription: "create user authentication",
      shortName: "user-auth",
      branchPrefix: BRANCH_PREFIX.FEAT,
    });
    expect(result[1].scriptPath).toContain("setup-plan.sh");
    expect(result[1].args).toContain("--json");
  });

  it("third command is check prerequisites with tasks", () => {
    const result = orchestratePlanning({
      repoRoot: "/project",
      featureDescription: "create user authentication",
      shortName: "user-auth",
      branchPrefix: BRANCH_PREFIX.FEAT,
    });
    expect(result[2].scriptPath).toContain("check-prerequisites.sh");
    expect(result[2].args).toContain("--json");
    expect(result[2].args).toContain("--require-tasks");
    expect(result[2].args).toContain("--include-tasks");
  });

  it("works with different branch prefixes", () => {
    const fixResult = orchestratePlanning({
      repoRoot: "/project",
      featureDescription: "fix login bug",
      shortName: "login-bug",
      branchPrefix: BRANCH_PREFIX.FIX,
    });
    expect(fixResult[0].args).toContain("fix");
  });
});