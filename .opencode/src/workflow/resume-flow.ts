import { existsSync } from "node:fs";
import path from "node:path";

import { detectActiveWorkspace } from "./detect-active-workspace";
import { evaluateArtifactState } from "./evaluate-artifact-state";
import { loadWorkflowContext } from "./context-loader";
import { loadFeatureApproval } from "./approval-state";
import { type WorkflowPhase } from "./session-state";

interface ResumeFlowInput {
  repoRoot: string;
  activeFeature?: string;
  hasResumeIntent?: boolean;
}

interface ResumeFlowResult {
  activeFeature: string | null;
  featureRoot: string | null;
  phase: WorkflowPhase;
  nextRecommendation: string;
  hasResumeIntent: boolean;
}

function hasInitializedRepo(repoRoot: string): boolean {
  return existsSync(path.join(repoRoot, ".specify")) && existsSync(path.join(repoRoot, "specs"));
}

function resumeFlow(input: ResumeFlowInput): ResumeFlowResult {
  const hasResumeIntent = input.hasResumeIntent ?? false;

    if (!input.activeFeature) {
    if (!hasResumeIntent) {
      const evaluation = evaluateArtifactState({
        repoInitialized: hasInitializedRepo(input.repoRoot),
        specExists: false,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
      });

      return {
        activeFeature: null,
        featureRoot: null,
        phase: evaluation.phase,
        nextRecommendation: evaluation.nextRecommendation,
        hasResumeIntent: false,
      };
    }

    const detected = detectActiveWorkspace(input.repoRoot);
    if (!detected) {
      const evaluation = evaluateArtifactState({
        repoInitialized: hasInitializedRepo(input.repoRoot),
        specExists: false,
        planExists: false,
        tasksExists: false,
        specApproved: false,
        planApproved: false,
      });

      return {
        activeFeature: null,
        featureRoot: null,
        phase: evaluation.phase,
        nextRecommendation: evaluation.nextRecommendation,
        hasResumeIntent: false,
      };
    }

    const context = loadWorkflowContext({ repoRoot: input.repoRoot, activeFeature: detected });
    const savedApproval = loadFeatureApproval(input.repoRoot, detected);
    const evaluation = evaluateArtifactState({
      repoInitialized: context.repoInitialized,
      specExists: context.artifacts.specExists,
      planExists: context.artifacts.planExists,
      tasksExists: context.artifacts.tasksExists,
      specApproved: savedApproval.specApproved,
      planApproved: savedApproval.planApproved,
    });

    return {
      activeFeature: detected,
      featureRoot: path.join(input.repoRoot, "specs", detected),
      phase: evaluation.phase,
      nextRecommendation: evaluation.nextRecommendation,
      hasResumeIntent: true,
    };
  }

  const context = loadWorkflowContext({ repoRoot: input.repoRoot, activeFeature: input.activeFeature });
  const savedApproval = loadFeatureApproval(input.repoRoot, input.activeFeature);
  const evaluation = evaluateArtifactState({
    repoInitialized: context.repoInitialized,
    specExists: context.artifacts.specExists,
    planExists: context.artifacts.planExists,
    tasksExists: context.artifacts.tasksExists,
    specApproved: savedApproval.specApproved,
    planApproved: savedApproval.planApproved,
  });

  return {
    activeFeature: input.activeFeature,
    featureRoot: path.join(input.repoRoot, "specs", input.activeFeature),
    phase: evaluation.phase,
    nextRecommendation: evaluation.nextRecommendation,
    hasResumeIntent: true,
  };
}

export { resumeFlow };
export type { ResumeFlowInput, ResumeFlowResult };
