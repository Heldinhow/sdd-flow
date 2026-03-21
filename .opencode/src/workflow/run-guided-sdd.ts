import { determineNextPhase, getNextRecommendation } from "./phase-router";
import { loadWorkflowContext } from "./context-loader";
import { resumeFlow } from "./resume-flow";
import { runClarifyLoop } from "./run-clarify-loop";
import { type WorkflowPhase } from "./session-state";

interface RunGuidedSddInput {
  repoRoot: string;
  activeFeature?: string;
  hasOutstandingClarifications?: boolean;
  clarificationContent?: string;
}

interface GuidedSddResult {
  phase: WorkflowPhase;
  nextRecommendation: string;
}

function runGuidedSdd(input: RunGuidedSddInput): GuidedSddResult {
  if (!input.activeFeature) {
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
    ? runClarifyLoop(input.clarificationContent)
    : null;
  const hasOutstandingClarifications = clarificationResult
    ? clarificationResult.phase === "clarify"
    : (input.hasOutstandingClarifications ?? false);

  const phase = determineNextPhase({
    repoInitialized: context.repoInitialized,
    specExists: context.artifacts.specExists,
    planExists: context.artifacts.planExists,
    tasksExists: context.artifacts.tasksExists,
    hasOutstandingClarifications,
    hasResumeIntent: true,
  });

  return {
    phase,
    nextRecommendation: getNextRecommendation(phase),
  };
}

export { runGuidedSdd };
export type { GuidedSddResult, RunGuidedSddInput };
