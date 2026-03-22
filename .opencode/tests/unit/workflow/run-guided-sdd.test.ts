import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { runGuidedSdd } from "../../../src/workflow/run-guided-sdd";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("run-guided-sdd", () => {
  describe("runGuidedSdd", () => {
    it("returns SPECIFY phase when no active feature and should create new workspace", () => {
      const result = runGuidedSdd({
        repoRoot: "/test/repo",
        shouldCreateNewWorkspace: true,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
    });

    it("returns SPECIFY phase when no active feature provided", () => {
      const result = runGuidedSdd({
        repoRoot: "/test/repo",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
    });

    it("returns correct structure", () => {
      const result = runGuidedSdd({
        repoRoot: "/test/repo",
      });

      expect(result).toHaveProperty("phase");
      expect(result).toHaveProperty("nextRecommendation");
      expect(typeof result.phase).toBe("string");
      expect(typeof result.nextRecommendation).toBe("string");
    });

    it("handles clarification content with outstanding questions", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
        clarificationContent: "The feature [NEEDS CLARIFICATION: should use what API?]",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
    });

    it("handles clarification answers to resolve questions", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
        clarificationContent: "The feature [NEEDS CLARIFICATION: should use what API?]",
        clarificationAnswers: [{ question: "should use what API?", answer: "REST" }],
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    });

    it("uses provided hasOutstandingClarifications flag", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
        hasOutstandingClarifications: true,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
    });

    it("uses specApproved flag when provided", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
        specApproved: true,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });

    it("uses planApproved flag when provided", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
        specApproved: true,
        planApproved: true,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.TASKS);
    });

    it("returns PLAN when shouldCreateNewWorkspace is false and no active feature (tries to resume)", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      mkdirSync(path.join(targetRoot, "specs"), { recursive: true });

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        shouldCreateNewWorkspace: false,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });
  });

  describe("with active feature", () => {
    it("returns PLAN phase for feature with no artifacts", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });

    it("returns WAITING_SPEC_APPROVAL phase for feature with spec only", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    });

    it("returns WAITING_SPEC_APPROVAL phase for feature with spec and plan", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    });

    it("returns COMPLETE phase for feature with all artifacts", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");
      writeFileSync(path.join(featureRoot, "tasks.md"), "# Tasks");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.COMPLETE);
    });
  });

  describe("edge cases", () => {
    it("handles empty string activeFeature as no feature", () => {
      const result = runGuidedSdd({
        repoRoot: "/test/repo",
        activeFeature: "",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
    });

    it("handles all optional parameters undefined", () => {
      const result = runGuidedSdd({
        repoRoot: "/test/repo",
        activeFeature: undefined,
        hasOutstandingClarifications: undefined,
        clarificationContent: undefined,
        clarificationAnswers: undefined,
        specApproved: undefined,
        planApproved: undefined,
        shouldCreateNewWorkspace: undefined,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
    });

    it("clarificationResult takes precedence over hasOutstandingClarifications", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-guided-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = runGuidedSdd({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
        clarificationContent: "[NEEDS CLARIFICATION: question?]",
        hasOutstandingClarifications: false,
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
    });
  });
});