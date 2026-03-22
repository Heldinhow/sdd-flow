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
        specApproved: false,
        planApproved: false,
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
        specApproved: false,
        planApproved: false,
        hasOutstandingClarifications: true,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.CLARIFY);
  });

  it("routes to waiting_plan_approval when plan exists but is not approved", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: true,
        planExists: true,
        tasksExists: false,
        specApproved: true,
        planApproved: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.WAITING_PLAN_APPROVAL);
  });

  it("routes to specify for new session without resume intent", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: false,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
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
        specApproved: false,
        planApproved: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: false,
      }),
    ).toBe(WORKFLOW_PHASE.SPECIFY);
  });

  it("routes to spec_review when spec exists but is not approved", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: true,
      }),
    ).toBe(WORKFLOW_PHASE.SPEC_REVIEW);
  });

  it("routes to plan when spec is approved and plan does not exist", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: true,
        planExists: false,
        tasksExists: false,
        specApproved: true,
        planApproved: false,
        hasOutstandingClarifications: false,
        hasResumeIntent: true,
      }),
    ).toBe(WORKFLOW_PHASE.PLAN);
  });

  it("routes to tasks when plan is approved and tasks do not exist", () => {
    expect(
      determineNextPhase({
        repoInitialized: true,
        specExists: true,
        planExists: true,
        tasksExists: false,
        specApproved: true,
        planApproved: true,
        hasOutstandingClarifications: false,
        hasResumeIntent: true,
      }),
    ).toBe(WORKFLOW_PHASE.TASKS);
  });

  it("returns a concrete recommendation for the next phase", () => {
    expect(getNextRecommendation(WORKFLOW_PHASE.TASKS)).toContain("tasks");
  });
});