import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { applyClarifications } from "../../../src/workflow/apply-clarifications";
import { detectActiveWorkspace } from "../../../src/workflow/detect-active-workspace";
import { detectAmbiguity } from "../../../src/workflow/detect-ambiguity";
import { evaluateArtifactState } from "../../../src/workflow/evaluate-artifact-state";
import { resumeFlow } from "../../../src/workflow/resume-flow";
import { runClarifyLoop } from "../../../src/workflow/run-clarify-loop";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("clarify and resume workflows", () => {
  it("detects high-impact clarification markers in a spec", () => {
    const requests = detectAmbiguity("Requirement [NEEDS CLARIFICATION: choose merge policy]");

    expect(requests).toHaveLength(1);
    expect(requests[0]?.question).toBe("choose merge policy");
  });

  it("applies accepted clarification answers back into the spec", () => {
    const updated = applyClarifications(
      "Requirement [NEEDS CLARIFICATION: choose merge policy]",
      [{ question: "choose merge policy", answer: "non-destructive merge" }],
      "2026-03-20",
    );

    expect(updated).toContain("non-destructive merge");
    expect(updated).toContain("## Clarifications");
  });

  it("keeps the workflow in clarify mode until all questions are answered", () => {
    const result = runClarifyLoop("Requirement [NEEDS CLARIFICATION: choose merge policy]");

    expect(result.phase).toBe(WORKFLOW_PHASE.CLARIFY);
    expect(result.nextQuestion?.question).toBe("choose merge policy");
  });

  it("detects the latest active feature workspace from specs", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(path.join(repoRoot, "specs/feat-old-workflow"), { recursive: true });
    mkdirSync(path.join(repoRoot, "specs/feat-new-workflow"), { recursive: true });

    expect(detectActiveWorkspace(repoRoot)).toBe("feat-new-workflow");
  });

  it("evaluates artifact state and routes to waiting_plan_approval when plan exists but is not approved", () => {
    const evaluation = evaluateArtifactState({
      repoInitialized: true,
      specExists: true,
      planExists: true,
      tasksExists: false,
      specApproved: true,
      planApproved: false,
    });

    expect(evaluation.phase).toBe(WORKFLOW_PHASE.WAITING_PLAN_APPROVAL);
  });

  it("resumes conservatively to waiting_spec_approval when spec exists but approval state is unknown", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
    const featureRoot = path.join(repoRoot, "specs/feat-opencode-sdd-agent");
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(featureRoot, { recursive: true });
    writeFileSync(path.join(featureRoot, "spec.md"), "# spec\n");
    writeFileSync(path.join(featureRoot, "plan.md"), "# plan\n");

    const result = resumeFlow({ repoRoot, hasResumeIntent: true });

    expect(result.activeFeature).toBe("feat-opencode-sdd-agent");
    expect(result.phase).toBe(WORKFLOW_PHASE.WAITING_SPEC_APPROVAL);
    expect(result.nextRecommendation).toContain("approve");
  });

  it("does not auto-resume without explicit resume intent", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
    const featureRoot = path.join(repoRoot, "specs/feat-opencode-sdd-agent");
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(featureRoot, { recursive: true });
    writeFileSync(path.join(featureRoot, "spec.md"), "# spec\n");
    writeFileSync(path.join(featureRoot, "plan.md"), "# plan\n");

    const result = resumeFlow({ repoRoot });

    expect(result.activeFeature).toBeNull();
    expect(result.hasResumeIntent).toBe(false);
  });

  it("routes initialized repositories without an active feature to specify", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "sdd-resume-"));
    mkdirSync(path.join(repoRoot, ".specify"));
    mkdirSync(path.join(repoRoot, "specs"));

    const result = resumeFlow({ repoRoot });

    expect(result.phase).toBe(WORKFLOW_PHASE.SPECIFY);
    expect(result.nextRecommendation).toContain("spec");
  });
});
