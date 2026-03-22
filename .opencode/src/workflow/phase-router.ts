import { WORKFLOW_PHASE, type WorkflowPhase, type WorkflowRouteInput } from "./session-state";

function determineNextPhase(input: WorkflowRouteInput): WorkflowPhase {
  if (!input.repoInitialized) {
    return WORKFLOW_PHASE.INIT;
  }

  if (!input.hasResumeIntent && !input.specExists) {
    return WORKFLOW_PHASE.SPECIFY;
  }

  if (input.hasOutstandingClarifications) {
    return WORKFLOW_PHASE.CLARIFY;
  }

  if (input.specExists && !input.specApproved) {
    // Run spec review before waiting for approval
    return WORKFLOW_PHASE.SPEC_REVIEW;
  }

  if (!input.planExists) {
    return WORKFLOW_PHASE.PLAN;
  }

  if (input.planExists && !input.planApproved) {
    return WORKFLOW_PHASE.WAITING_PLAN_APPROVAL;
  }

  if (!input.tasksExists) {
    return WORKFLOW_PHASE.TASKS;
  }

  return WORKFLOW_PHASE.COMPLETE;
}

function getNextRecommendation(phase: WorkflowPhase): string {
  switch (phase) {
    case WORKFLOW_PHASE.INIT:
      return "Run the repository initialization flow before starting feature planning.";
    case WORKFLOW_PHASE.SPECIFY:
      return "Create or update spec.md for the active feature request.";
    case WORKFLOW_PHASE.SPEC_REVIEW:
      return "Run automatic spec quality review to check acceptance criteria, user stories, and completeness.";
    case WORKFLOW_PHASE.WAITING_SPEC_APPROVAL:
      return "Review and approve spec.md to unlock the planning stage.";
    case WORKFLOW_PHASE.CLARIFY:
      return "Resolve the remaining high-impact clarification questions before planning.";
    case WORKFLOW_PHASE.PLAN:
      return "Generate the planning package for the active feature workspace.";
    case WORKFLOW_PHASE.WAITING_PLAN_APPROVAL:
      return "Review and approve the planning package to unlock task generation.";
    case WORKFLOW_PHASE.TASKS:
      return "Generate tasks.md for the active feature workspace.";
    case WORKFLOW_PHASE.COMPLETE:
      return "Review the completed planning package and proceed to implementation.";
  }
}

export { determineNextPhase, getNextRecommendation };
