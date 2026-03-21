import { determineNextPhase, getNextRecommendation } from "./phase-router";
import { type WorkflowPhase } from "./session-state";

interface EvaluateArtifactStateInput {
  repoInitialized: boolean;
  specExists: boolean;
  planExists: boolean;
  tasksExists: boolean;
  hasOutstandingClarifications?: boolean;
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
    hasOutstandingClarifications: input.hasOutstandingClarifications ?? false,
  });

  return {
    phase,
    nextRecommendation: getNextRecommendation(phase),
  };
}

export { evaluateArtifactState };
export type { ArtifactStateEvaluation, EvaluateArtifactStateInput };
