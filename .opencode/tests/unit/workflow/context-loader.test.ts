import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadWorkflowContext } from "../../../src/workflow/context-loader";

describe("context-loader", () => {
  it("loads workflow context with all artifacts present", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
    const featureRoot = path.join(repoRoot, "specs/feat-test");
    mkdirSync(featureRoot, { recursive: true });
    mkdirSync(path.join(repoRoot, ".specify"));
    writeFileSync(path.join(featureRoot, "spec.md"), "# spec");
    writeFileSync(path.join(featureRoot, "plan.md"), "# plan");
    writeFileSync(path.join(featureRoot, "tasks.md"), "# tasks");

    const context = loadWorkflowContext({ repoRoot, activeFeature: "feat-test" });

    expect(context.repoRoot).toBe(repoRoot);
    expect(context.activeFeature).toBe("feat-test");
    expect(context.featureRoot).toBe(featureRoot);
    expect(context.repoInitialized).toBe(true);
    expect(context.artifacts.specExists).toBe(true);
    expect(context.artifacts.planExists).toBe(true);
    expect(context.artifacts.tasksExists).toBe(true);
  });

  it("sets repoInitialized to false when .specify does not exist", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
    const featureRoot = path.join(repoRoot, "specs/feat-test");
    mkdirSync(featureRoot, { recursive: true });

    const context = loadWorkflowContext({ repoRoot, activeFeature: "feat-test" });

    expect(context.repoInitialized).toBe(false);
  });

  it("sets specExists to false when spec.md is missing", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
    const featureRoot = path.join(repoRoot, "specs/feat-test");
    mkdirSync(featureRoot, { recursive: true });
    mkdirSync(path.join(repoRoot, ".specify"));
    writeFileSync(path.join(featureRoot, "plan.md"), "# plan");

    const context = loadWorkflowContext({ repoRoot, activeFeature: "feat-test" });

    expect(context.artifacts.specExists).toBe(false);
    expect(context.artifacts.planExists).toBe(true);
    expect(context.artifacts.tasksExists).toBe(false);
  });

  it("handles empty specs directory", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(path.join(repoRoot, "specs"));

    const context = loadWorkflowContext({ repoRoot, activeFeature: "nonexistent-feature" });

    expect(context.activeFeature).toBe("nonexistent-feature");
    expect(context.artifacts.specExists).toBe(false);
    expect(context.artifacts.planExists).toBe(false);
    expect(context.artifacts.tasksExists).toBe(false);
  });

  it("constructs correct featureRoot path", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(path.join(repoRoot, "specs/feat-my-feature"), { recursive: true });

    const context = loadWorkflowContext({ repoRoot, activeFeature: "feat-my-feature" });

    expect(context.featureRoot).toBe(path.join(repoRoot, "specs/feat-my-feature"));
  });

  it("sets all artifact flags to false when feature directory does not exist", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-context-"));
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(path.join(repoRoot, "specs"));

    const context = loadWorkflowContext({ repoRoot, activeFeature: "feat-nonexistent" });

    expect(context.artifacts.specExists).toBe(false);
    expect(context.artifacts.planExists).toBe(false);
    expect(context.artifacts.tasksExists).toBe(false);
  });
});
