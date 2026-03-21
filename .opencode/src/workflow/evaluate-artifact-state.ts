import { determineNextPhase, getNextRecommendation } from "./phase-router";
import { type WorkflowPhase } from "./session-state";

interface EvaluateArtifactStateInput {
  repoInitialized: boolean;
  specExists: boolean;
  planExists: boolean;
  tasksExists: boolean;
  specApproved: boolean;
  planApproved: boolean;
  hasOutstandingClarifications?: boolean;
  hasResumeIntent?: boolean;
}

interface ArtifactStateEvaluation {
  phase: WorkflowPhase;
  nextRecommendation: string;
}

function evaluateArtifactState(input: EvaluateArtifactStateInput): ArtifactStateEvaluation {
  const phase = determineNextPhase({
    repoInitialized: input.repoInitialized,
    specExists: input.specExists,
    planExists: input.planExists,
    tasksExists: input.tasksExists,
    specApproved: input.specApproved,
    planApproved: input.planApproved,
    hasOutstandingClarifications: input.hasOutstandingClarifications ?? false,
    hasResumeIntent: input.hasResumeIntent ?? false,
  });

  return {
    phase,
    nextRecommendation: getNextRecommendation(phase),
  };
}

export { evaluateArtifactState };
export type { ArtifactStateEvaluation, EvaluateArtifactStateInput };
