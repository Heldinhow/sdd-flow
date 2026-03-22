import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadWorkflowContext } from "../../../src/workflow/context-loader";

describe("context-loader", () => {
  describe("loadWorkflowContext", () => {
    it("loads workflow context with all artifacts missing", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.repoRoot).toBe(targetRoot);
      expect(result.activeFeature).toBe("test-feature");
      expect(result.featureRoot).toBe(path.join(targetRoot, "specs", "test-feature"));
      expect(result.repoInitialized).toBe(false);
      expect(result.artifacts.specExists).toBe(false);
      expect(result.artifacts.planExists).toBe(false);
      expect(result.artifacts.tasksExists).toBe(false);
    });

    it("detects repo initialized when .specify directory exists", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
      mkdirSync(path.join(targetRoot, ".specify"), { recursive: true });

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.repoInitialized).toBe(true);
    });

    it("detects spec.md exists in feature root", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.artifacts.specExists).toBe(true);
      expect(result.artifacts.planExists).toBe(false);
      expect(result.artifacts.tasksExists).toBe(false);
    });

    it("detects plan.md exists in feature root", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.artifacts.specExists).toBe(false);
      expect(result.artifacts.planExists).toBe(true);
      expect(result.artifacts.tasksExists).toBe(false);
    });

    it("detects tasks.md exists in feature root", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "tasks.md"), "# Tasks");

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.artifacts.specExists).toBe(false);
      expect(result.artifacts.planExists).toBe(false);
      expect(result.artifacts.tasksExists).toBe(true);
    });

    it("detects all artifacts when they all exist", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
      const featureRoot = path.join(targetRoot, "specs", "test-feature");
      mkdirSync(featureRoot, { recursive: true });
      writeFileSync(path.join(featureRoot, "spec.md"), "# Spec");
      writeFileSync(path.join(featureRoot, "plan.md"), "# Plan");
      writeFileSync(path.join(featureRoot, "tasks.md"), "# Tasks");

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(result.artifacts.specExists).toBe(true);
      expect(result.artifacts.planExists).toBe(true);
      expect(result.artifacts.tasksExists).toBe(true);
    });

    it("handles special characters in feature name", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "feature-with_dashes-and_underscores",
      });

      expect(result.featureRoot).toContain("feature-with_dashes-and_underscores");
    });

    it("returns correct types for WorkflowContext", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "test-feature",
      });

      expect(typeof result.repoRoot).toBe("string");
      expect(typeof result.activeFeature).toBe("string");
      expect(typeof result.featureRoot).toBe("string");
      expect(typeof result.repoInitialized).toBe("boolean");
      expect(result.artifacts).toHaveProperty("specExists");
      expect(result.artifacts).toHaveProperty("planExists");
      expect(result.artifacts).toHaveProperty("tasksExists");
    });
  });

  describe("edge cases", () => {
    it("handles empty feature name", () => {
      const targetRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));

      const result = loadWorkflowContext({
        repoRoot: targetRoot,
        activeFeature: "",
      });

      expect(result.activeFeature).toBe("");
      expect(result.featureRoot).toBe(path.join(targetRoot, "specs", ""));
    });
  });
});