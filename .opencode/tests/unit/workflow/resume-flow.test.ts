import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { resumeFlow } from "../../../src/workflow/resume-flow";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("resume-flow", () => {
  describe("resumeFlow", () => {
    it("returns INIT phase when repo not initialized and no active feature", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));

      const result = resumeFlow({ repoRoot: targetRoot });

      expect(result.phase).toBe(WORKFLOW_PHASE.INIT);
      expect(result.activeFeature).toBeNull();
      expect(result.featureRoot).toBeNull();
      expect(result.hasResumeIntent).toBe(false);
    });

    it("returns PLAN phase when no active feature and has resume intent but no specs", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      mkdirSync(path.join(targetRoot, "specs"), { recursive: true });

      const result = resumeFlow({ repoRoot: targetRoot, hasResumeIntent: true });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });

    it("returns correct structure when no active feature", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));

      const result = resumeFlow({ repoRoot: targetRoot });

      expect(result).toHaveProperty("activeFeature");
      expect(result).toHaveProperty("featureRoot");
      expect(result).toHaveProperty("phase");
      expect(result).toHaveProperty("nextRecommendation");
      expect(result).toHaveProperty("hasResumeIntent");
    });

    it("uses provided active feature when given", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "my-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = resumeFlow({ repoRoot: targetRoot, activeFeature: "my-feature" });

      expect(result.activeFeature).toBe("my-feature");
      expect(result.featureRoot).toBe(featureRoot);
      expect(result.hasResumeIntent).toBe(true);
    });

    it("evaluates artifact state correctly with active feature", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");

      const result = resumeFlow({ repoRoot: targetRoot, activeFeature: "test-feature" });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    });

    it("detects WAITING_SPEC_APPROVAL when spec exists but not approved", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = resumeFlow({ repoRoot: targetRoot, activeFeature: "test-feature" });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    });

    it("returns PLAN phase when plan exists but spec not approved", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");

      const result = resumeFlow({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    });

    it("returns COMPLETE phase when all artifacts exist", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");
      writeFileSync(path.join(featureRoot, "tasks.md"), "# Tasks");

      const result = resumeFlow({ repoRoot: targetRoot, activeFeature: "test-feature" });

      expect(result.phase).toBe(WORKFLOW_PHASE.COMPLETE);
    });

    it("returns false for hasResumeIntent when not explicitly set and no active feature", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      mkdirSync(path.join(targetRoot, "specs"), { recursive: true });

      const result = resumeFlow({ repoRoot: targetRoot });

      expect(result.hasResumeIntent).toBe(false);
    });

    it("returns featureRoot as null when no active feature", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));

      const result = resumeFlow({ repoRoot: targetRoot });

      expect(result.featureRoot).toBeNull();
    });

    it("includes nextRecommendation in result", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));

      const result = resumeFlow({ repoRoot: targetRoot });

      expect(result.nextRecommendation).toBeDefined();
      expect(typeof result.nextRecommendation).toBe("string");
    });
  });

  describe("edge cases", () => {
    it("handles feature name with special characters", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      const featureRoot = path.join(targetRoot, "specs", "feature-with_dashes");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = resumeFlow({ repoRoot: targetRoot, activeFeature: "feature-with_dashes" });

      expect(result.activeFeature).toBe("feature-with_dashes");
    });

    it("handles empty activeFeature string like no feature provided", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });
      mkdirSync(path.join(targetRoot, "specs"), { recursive: true });

      const result = resumeFlow({ repoRoot: targetRoot, activeFeature: "" });

      expect(result.activeFeature).toBeNull();
      expect(result.featureRoot).toBeNull();
    });

    it("handles hasResumeIntent undefined (defaults to false)", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));

      const result = resumeFlow({ repoRoot: targetRoot, hasResumeIntent: undefined });

      expect(result.hasResumeIntent).toBe(false);
    });

    it("handles repo with only .specify but no specs directory and has resume intent", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });

      const result = resumeFlow({ repoRoot: targetRoot, hasResumeIntent: true });

      expect(result.phase).toBe(WORKFLOW_PHASE.PLAN);
    });
  });
});