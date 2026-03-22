import { determineNextPhase, getNextRecommendation } from "./phase-router";
import { loadWorkflowContext } from "./context-loader";
import { resumeFlow } from "./resume-flow";
import { runClarifyLoop, type ClarifyLoopResult } from "./run-clarify-loop";
import { WORKFLOW_PHASE, type WorkflowPhase } from "./session-state";
import { type ClarificationAnswer } from "./apply-clarifications";

interface RunGuidedSddInput {
  repoRoot: string;
  activeFeature?: string;
  hasOutstandingClarifications?: boolean;
  clarificationContent?: string;
  clarificationAnswers?: ClarificationAnswer[];
  specApproved?: boolean;
  planApproved?: boolean;
  shouldCreateNewWorkspace?: boolean;
}

interface GuidedSddResult {
  phase: WorkflowPhase;
  nextRecommendation: string;
}

function runGuidedSdd(input: RunGuidedSddInput): GuidedSddResult {
  if (!input.activeFeature) {
    // Session-scoped workspaces: default to creating new workspace unless explicitly resuming
    const shouldCreateNew = input.shouldCreateNewWorkspace ?? true;
    if (shouldCreateNew) {
      // For new sessions, return SPECIFY phase (don't try to reuse existing workspace)
      return {
        phase: WORKFLOW_PHASE.SPECIFY,
        nextRecommendation: getNextRecommendation(WORKFLOW_PHASE.SPECIFY),
      };
    }

    // Only resume if explicitly requested
    const resumed = resumeFlow({ repoRoot: input.repoRoot });
    return {
      phase: resumed.phase,
      nextRecommendation: resumed.nextRecommendation,
    };
  }

  const context = loadWorkflowContext({
    repoRoot: input.repoRoot,
    activeFeature: input.activeFeature,
  });

  const clarificationResult = input.clarificationContent
    ? runClarifyLoop(input.clarificationContent, input.clarificationAnswers)
    : null;
  const hasOutstandingClarifications = clarificationResult
    ? clarificationResult.phase === "clarify"
    : (input.hasOutstandingClarifications ?? false);

  const hasResumeIntent = !!input.activeFeature;

  const phase = determineNextPhase({
    repoInitialized: context.repoInitialized,
    specExists: context.artifacts.specExists,
    planExists: context.artifacts.planExists,
    tasksExists: context.artifacts.tasksExists,
    specApproved: input.specApproved ?? false,
    planApproved: input.planApproved ?? false,
    hasOutstandingClarifications,
    hasResumeIntent,
  });

  return {
    phase,
    nextRecommendation: getNextRecommendation(phase),
  };
}

export { runGuidedSdd };
export type { GuidedSddResult, RunGuidedSddInput };
