import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadFeatureApproval, saveFeatureApproval } from "../../../src/workflow/approval-state";
import { runGuidedSdd } from "../../../src/workflow/run-guided-sdd";
import { resumeFlow } from "../../../src/workflow/resume-flow";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("approval state persistence", () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-approval-"));
    mkdirSync(path.join(repoRoot, ".specify"), { recursive: true });
    mkdirSync(path.join(repoRoot, "specs", "feat-test-feature"), { recursive: true });
    writeFileSync(path.join(repoRoot, "specs", "feat-test-feature", "spec.md"), "# spec\n");
    writeFileSync(path.join(repoRoot, "specs", "feat-test-feature", "plan.md"), "# plan\n");
  });

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it("saves and loads approval state for a feature", () => {
    saveFeatureApproval(repoRoot, "feat-test-feature", {
      specApproved: true,
      planApproved: false,
    });

    const state = loadFeatureApproval(repoRoot, "feat-test-feature");
    expect(state.specApproved).toBe(true);
    expect(state.planApproved).toBe(false);
  });

  it("loads empty approval state for unknown feature", () => {
    const state = loadFeatureApproval(repoRoot, "unknown-feature");
    expect(state.specApproved).toBe(false);
    expect(state.planApproved).toBe(false);
  });

  it("persists spec approval when runGuidedSdd is called with specApproved true", () => {
    runGuidedSdd({
      repoRoot,
      activeFeature: "feat-test-feature",
      specApproved: true,
    });

    const state = loadFeatureApproval(repoRoot, "feat-test-feature");
    expect(state.specApproved).toBe(true);
  });

  it("persists plan approval when runGuidedSdd is called with planApproved true", () => {
    runGuidedSdd({
      repoRoot,
      activeFeature: "feat-test-feature",
      planApproved: true,
    });

    const state = loadFeatureApproval(repoRoot, "feat-test-feature");
    expect(state.planApproved).toBe(true);
  });

  it("restores spec approval when resuming a workspace", () => {
    saveFeatureApproval(repoRoot, "feat-test-feature", {
      specApproved: true,
      planApproved: false,
    });

    const result = resumeFlow({
      repoRoot,
      activeFeature: "feat-test-feature",
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_PLAN_APPROVAL);
  });

  it("restores plan approval when resuming a workspace", () => {
    saveFeatureApproval(repoRoot, "feat-test-feature", {
      specApproved: true,
      planApproved: true,
    });

    const result = resumeFlow({
      repoRoot,
      activeFeature: "feat-test-feature",
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.TASKS);
  });

  it("resumes with spec_review when spec is not approved", () => {
    const result = resumeFlow({
      repoRoot,
      activeFeature: "feat-test-feature",
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPEC_REVIEW);
  });
});
