import path from "node:path";

import { detectActiveWorkspace } from "./detect-active-workspace";
import { evaluateArtifactState } from "./evaluate-artifact-state";
import { loadWorkflowContext } from "./context-loader";
import { type WorkflowPhase } from "./session-state";

interface ResumeFlowInput {
  repoRoot: string;
  activeFeature?: string;
}

interface ResumeFlowResult {
  activeFeature: string | null;
  featureRoot: string | null;
  phase: WorkflowPhase;
  nextRecommendation: string;
}

function resumeFlow(input: ResumeFlowInput): ResumeFlowResult {
  const activeFeature = input.activeFeature ?? detectActiveWorkspace(input.repoRoot);
  if (!activeFeature) {
    const evaluation = evaluateArtifactState({
      repoInitialized: false,
      specExists: false,
      planExists: false,
      tasksExists: false,
    });

    return {
      activeFeature: null,
      featureRoot: null,
      phase: evaluation.phase,
      nextRecommendation: evaluation.nextRecommendation,
    };
  }

  const context = loadWorkflowContext({ repoRoot: input.repoRoot, activeFeature });
  const evaluation = evaluateArtifactState({
    repoInitialized: context.repoInitialized,
    specExists: context.artifacts.specExists,
    planExists: context.artifacts.planExists,
    tasksExists: context.artifacts.tasksExists,
  });

  return {
    activeFeature,
    featureRoot: path.join(input.repoRoot, "specs", activeFeature),
    phase: evaluation.phase,
    nextRecommendation: evaluation.nextRecommendation,
  };
}

export { resumeFlow };
export type { ResumeFlowInput, ResumeFlowResult };
