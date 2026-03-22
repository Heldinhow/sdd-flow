import { describe, expect, it } from "bun:test";

import { evaluateArtifactState } from "../../../src/workflow/evaluate-artifact-state";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("evaluate-artifact-state", () => {
  it("routes to INIT when repository is not initialized", () => {
    const result = evaluateArtifactState({
      repoInitialized: false,
      specExists: false,
      planExists: false,
      tasksExists: false,
      specApproved: false,
      planApproved: false,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.INIT);
    expect(result.nextRecommendation).toContain("initialization");
  });

  it("routes to SPECIFY when repo is initialized but no spec exists", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: false,
      planExists: false,
      tasksExists: false,
      specApproved: false,
      planApproved: false,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
    expect(result.nextRecommendation).toContain("spec");
  });

  it("routes to CLARIFY when spec exists but has outstanding clarifications", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: false,
      tasksExists: false,
      specApproved: false,
      planApproved: false,
      hasOutstandingClarifications: true,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
    expect(result.nextRecommendation).toContain("clarification");
  });

  it("routes to SPEC_REVIEW when spec exists but not approved", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: false,
      tasksExists: false,
      specApproved: false,
      planApproved: false,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPEC_REVIEW);
    expect(result.nextRecommendation).toContain("quality");
  });

  it("routes to PLAN when spec is approved but plan does not exist", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: false,
      tasksExists: false,
      specApproved: true,
      planApproved: false,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    expect(result.nextRecommendation).toContain("planning");
  });

  it("routes to WAITING_PLAN_APPROVAL when plan exists but not approved", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: true,
      tasksExists: false,
      specApproved: true,
      planApproved: false,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_PLAN_APPROVAL);
    expect(result.nextRecommendation).toContain("approve");
  });

  it("routes to TASKS when plan is approved but tasks do not exist", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: true,
      tasksExists: false,
      specApproved: true,
      planApproved: true,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.TASKS);
    expect(result.nextRecommendation).toContain("tasks");
  });

  it("routes to COMPLETE when all artifacts exist and approved", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: true,
      tasksExists: true,
      specApproved: true,
      planApproved: true,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.COMPLETE);
    expect(result.nextRecommendation).toContain("completed");
  });

  it("defaults hasOutstandingClarifications to false", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: false,
      tasksExists: false,
      specApproved: false,
      planApproved: false,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPEC_REVIEW);
  });

  it("defaults hasResumeIntent to false", () => {
    const result = evaluateArtifactState({
      repoInitialized: true,
      specExists: false,
      planExists: false,
      tasksExists: false,
      specApproved: false,
      planApproved: false,
      hasResumeIntent: false,
    });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
  });
});
