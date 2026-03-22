import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { BRANCH_PREFIX } from "../../../src/branching/prefixes";
import { loadWorkflowContext } from "../../../src/workflow/context-loader";
import { orchestratePlanning } from "../../../src/workflow/orchestrate-planning";
import { recommendBranch } from "../../../src/branching/recommend-branch";
import { runGuidedSdd } from "../../../src/workflow/run-guided-sdd";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("guided sdd workflow", () => {
  it("recommends an init prefix for bootstrap requests", () => {
    const recommendation = recommendBranch("Initialize the unified SDD workflow for OpenCode");

    expect(recommendation.prefix).toBe(BRANCH_PREFIX.INIT);
    expect(recommendation.branchName).toBe("init-unified-sdd-workflow");
  });

  it("loads the current workflow context from the feature workspace", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
    const featureRoot = path.join(repoRoot, "specs/feat-opencode-sdd-agent");
    mkdirSync(featureRoot, { recursive: true });
    mkdirSync(path.join(repoRoot, ".specify"));
    writeFileSync(path.join(featureRoot, "spec.md"), "# spec\n");
    writeFileSync(path.join(featureRoot, "plan.md"), "# plan\n");

    const context = loadWorkflowContext({
      repoRoot,
      activeFeature: "feat-opencode-sdd-agent",
    });

    expect(context.activeFeature).toBe("feat-opencode-sdd-agent");
    expect(context.artifacts.specExists).toBe(true);
    expect(context.artifacts.planExists).toBe(true);
    expect(context.artifacts.tasksExists).toBe(false);
  });

  it("builds the planning command sequence for a new feature", () => {
    const commands = orchestratePlanning({
      repoRoot: "/repo",
      featureDescription: "Create unified SDD workflow",
      shortName: "unified-sdd-workflow",
      branchPrefix: BRANCH_PREFIX.FEAT,
    });

    expect(commands.map((command) => command.scriptPath)).toEqual([
      "/repo/.specify/scripts/bash/create-new-feature.sh",
      "/repo/.specify/scripts/bash/setup-plan.sh",
      "/repo/.specify/scripts/bash/check-prerequisites.sh",
    ]);
  });

  it("routes to spec_review when no approval state is known", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
    const featureRoot = path.join(repoRoot, "specs/feat-opencode-sdd-agent");
    mkdirSync(featureRoot, { recursive: true });
    mkdirSync(path.join(repoRoot, ".specify"));
    writeFileSync(path.join(featureRoot, "spec.md"), "# spec\n");
    writeFileSync(path.join(featureRoot, "plan.md"), "# plan\n");

    const result = runGuidedSdd({
      repoRoot,
      activeFeature: "feat-opencode-sdd-agent",
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPEC_REVIEW);
    expect(result.nextRecommendation).toContain("quality");
  });

  it("routes to tasks when both spec and plan are approved", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
    const featureRoot = path.join(repoRoot, "specs/feat-opencode-sdd-agent");
    mkdirSync(featureRoot, { recursive: true });
    mkdirSync(path.join(repoRoot, ".specify"));
    writeFileSync(path.join(featureRoot, "spec.md"), "# spec\n");
    writeFileSync(path.join(featureRoot, "plan.md"), "# plan\n");

    const result = runGuidedSdd({
      repoRoot,
      activeFeature: "feat-opencode-sdd-agent",
      specApproved: true,
      planApproved: true,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.TASKS);
    expect(result.nextRecommendation).toContain("tasks");
  });

  it("routes initialized repositories without an active feature to specify", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(path.join(repoRoot, "specs"));

    const result = runGuidedSdd({ repoRoot });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
    expect(result.nextRecommendation).toContain("spec");
  });
});
