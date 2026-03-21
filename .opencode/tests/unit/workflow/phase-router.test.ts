import { describe, expect, it } from "bun:test";

import { determineNextPhase, getNextRecommendation } from "../../../src/workflow/phase-router";
import { WORKFLOW_PHASE } from "../../../src/workflow/session-state";

describe("phase router", () => {
  it("routes to init when the repository is not initialized", () => {
    expect(
      determineNextPhase({
        repoInitialized: false,
        specExists: false,
        planExists: false,
        tasksExists: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.INIT);
  });

  it("routes to clarify when high-impact ambiguity is still open", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        hasOutstandingClarifications: true,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.CLARIFY);
  });

  it("routes to tasks after the planning package exists", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: true,
        planExists: true,
        tasksExists: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.TASKS);
  });

  it("routes to specify for new session without resume intent", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: false,
        planExists: false,
        tasksExists: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.SPECIFY);
  });

  it("routes to specify for new session even when existing workspace exists", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: false,
        planExists: true,
        tasksExists: true,
        hasOutstandingClarifications: false,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.SPECIFY);
  });

  it("routes to plan when resuming with existing spec", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: true,
      }),
    ).toBe(WORKFLOW_PHASE.PLAN);
  });

  it("returns a concrete recommendation for the next phase", () => {
    expect(getNextRecommendation(WORKFLOW_PHASE.TASKS)).toContain("tasks");
  });
});