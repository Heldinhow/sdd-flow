import { describe, expect, it } from "bun:test";

import { evaluateArtifactState } from "../../../src/workflow/evaluate-artifact-state";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("evaluate-artifact-state", () => {
  describe("evaluateArtifactState", () => {
    it("returns INIT phase when repo is not initialized", () => {
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

    it("returns SPECIFY phase when repo initialized but no spec exists and no resume intent", () => {
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
      expect(result.nextRecommendation).toContain("spec.md");
    });

    it("returns CLARIFY phase when clarifications are outstanding", () => {
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

    it("returns WAITING_SPEC_APPROVAL phase when spec exists but not approved", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
      expect(result.nextRecommendation).toContain("approve");
    });

    it("returns PLAN phase when spec approved but no plan exists", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        specApproved: true,
        planApproved: false,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
      expect(result.nextRecommendation).toContain("planning package");
    });

    it("returns WAITING_PLAN_APPROVAL phase when plan exists but not approved", () => {
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

    it("returns TASKS phase when plan approved but no tasks exist", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: true,
        planExists: true,
        tasksExists: false,
        specApproved: true,
        planApproved: true,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.TASKS);
      expect(result.nextRecommendation).toContain("tasks.md");
    });

    it("returns COMPLETE phase when all artifacts exist and approved", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: true,
        planExists: true,
        tasksExists: true,
        specApproved: true,
        planApproved: true,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.COMPLETE);
      expect(result.nextRecommendation).toContain("implementation");
    });

    it("uses default false for hasOutstandingClarifications when not provided", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    });

    it("uses default false for hasResumeIntent when not provided", () => {
      const result = evaluateArtifactState({
        repoInitialized: false,
        specExists: false,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.INIT);
    });
  });

  describe("edge cases", () => {
    it("returns PLAN phase with hasResumeIntent true but no spec", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: false,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
        hasResumeIntent: true,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });

    it("handles all flags false except repoInitialized and specApproved", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        specApproved: true,
        planApproved: false,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });

    it("returns correct structure", () => {
      const result = evaluateArtifactState({
        repoInitialized: true,
        specExists: true,
        planExists: true,
        tasksExists: true,
        specApproved: true,
        planApproved: true,
      });

      expect(result).toHaveProperty("phase");
      expect(result).toHaveProperty("nextRecommendation");
      expect(typeof result.phase).toBe("string");
      expect(typeof result.nextRecommendation).toBe("string");
    });
  });
});