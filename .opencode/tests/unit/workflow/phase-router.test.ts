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
      }),
    ).toBe(WORKFLOW_PHASE.TASKS);
  });

  it("returns a concrete recommendation for the next phase", () => {
    expect(getNextRecommendation(WORKFLOW_PHASE.TASKS)).toContain("tasks");
  });
});